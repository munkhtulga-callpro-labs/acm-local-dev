import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createEmployeeSchema, paginationSchema } from '@/lib/validations'
import { AuditService } from '@/services/audit-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20', // Pagination with 20 items per page
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    const where: any = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: true,
          accessPermissions: {
            include: {
              system: true,
            },
          },
        },
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ])

    return NextResponse.json({
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
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
    const validatedData = createEmployeeSchema.parse(body)

    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Generate employee ID
    const employeeId = `EMP${Date.now().toString().slice(-6)}`

    // Create user account
    const user = await prisma.user.create({
      data: {
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        email: validatedData.email,
        role: 'EMPLOYEE',
        company: validatedData.company,
      },
    })

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
        ...validatedData,
        employeeId,
        userId: user.id,
        startDate: validatedData.startDate || new Date(),
      },
      include: {
        user: true,
      },
    })

    // Log the action
    try {
      const currentUser = session.user?.email ? await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { employee: true }
      }) : null

      if (currentUser) {
        await prisma.auditLog.create({
          data: {
            action: 'CREATE_EMPLOYEE',
            entityType: 'Employee',
            entityId: employee.id,
            userId: currentUser.id,
            employeeId: currentUser.employee?.id || null,
            newValues: {
              employeeId: employee.employeeId,
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              department: employee.department,
              position: employee.position
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        })
        console.log('✅ Audit log created for CREATE_EMPLOYEE')
      }
    } catch (auditError) {
      console.error('❌ Failed to create audit log:', auditError)
    }

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
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
