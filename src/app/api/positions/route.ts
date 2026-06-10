import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPositionSchema, updatePositionSchema, paginationSchema } from '@/lib/validations'
import { AuditService } from '@/services/audit-service'

export async function GET(request: NextRequest) {
  try {
    // Temporarily removed authentication for dropdown population
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })

    const department = searchParams.get('department')
    const departmentId = searchParams.get('departmentId')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { level: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by department name or ID
    if (department) {
      where.department = {
        name: { equals: department, mode: 'insensitive' }
      }
    }
    if (departmentId) {
      where.departmentId = departmentId
    }

    const [positions, total] = await Promise.all([
      prisma.position.findMany({
        where,
        include: {
          department: true,
        },
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.position.count({ where }),
    ])

    return NextResponse.json({
      data: positions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPositionSchema.parse(body)

    const existingPosition = await prisma.position.findFirst({
      where: { 
        name: validatedData.name,
        departmentId: validatedData.departmentId
      },
    })

    if (existingPosition) {
      return NextResponse.json(
        { error: 'Position with this name already exists in this department' },
        { status: 400 }
      )
    }

    const position = await prisma.position.create({
      data: validatedData,
      include: {
        department: true,
      },
    })

    await AuditService.logAction({
      action: 'CREATE_POSITION',
      entityType: 'Position',
      entityId: position.id,
      newValues: position,
      userId: session.user.id,
    })

    return NextResponse.json(position, { status: 201 })
  } catch (error) {
    console.error('Error creating position:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
