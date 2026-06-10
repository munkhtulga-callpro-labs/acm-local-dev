import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAccessRequestSchema, paginationSchema } from '@/lib/validations'
import { ApprovalService } from '@/services/approval-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    const status = searchParams.get('status')
    const requestType = searchParams.get('requestType')

    const where: any = {}

    // Build AND conditions
    const andConditions: any[] = []

    // Add search filter as OR condition
    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { employee: { firstName: { contains: search, mode: 'insensitive' } } },
          { employee: { lastName: { contains: search, mode: 'insensitive' } } },
        ]
      })
    }

    // Add status filter
    if (status) {
      andConditions.push({ status })
    }

    // Add request type filter
    if (requestType) {
      andConditions.push({ requestType })
    }

    // If user is not admin, only show their own requests or requests they need to approve
    if (session.user.role !== 'ADMIN') {
      andConditions.push({
        OR: [
          { requestedBy: session.user.id },
          {
            approvals: {
              some: {
                approverId: session.user.id,
              },
            },
          },
        ]
      })
    }

    // Combine all conditions with AND
    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    const requests = await prisma.accessRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        systems: {
          include: {
            system: true,
          },
        },
        approvals: true,
      },
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const total = await prisma.accessRequest.count({ where })

    return NextResponse.json({
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching requests:', error)
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
    const validatedData = createAccessRequestSchema.parse(body)

    const accessRequest = await ApprovalService.createAccessRequest({
      employeeId: validatedData.employeeId,
      requestType: validatedData.requestType,
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority,
      systems: validatedData.systems,
      requestedBy: session.user.id,
    })

    return NextResponse.json(accessRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating access request:', error)
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
