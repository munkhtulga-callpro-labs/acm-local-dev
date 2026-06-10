import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateEmployeeSchema } from '@/lib/validations'
import { AuditService } from '@/services/audit-service'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily removed authentication for testing
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await context.params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        accessPermissions: {
          include: {
            system: true,
          },
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const validatedData = updateEmployeeSchema.parse(body)

    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: validatedData,
      include: { user: true }
    })

    // Create audit log
    try {
      const currentUser = session.user?.email ? await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { employee: true }
      }) : null

      if (currentUser) {
        await prisma.auditLog.create({
          data: {
            action: 'UPDATE_EMPLOYEE',
            entityType: 'Employee',
            entityId: updatedEmployee.id,
            userId: currentUser.id,
            employeeId: currentUser.employee?.id || null,
            oldValues: {
              firstName: existingEmployee.firstName,
              lastName: existingEmployee.lastName,
              department: existingEmployee.department,
              position: existingEmployee.position
            },
            newValues: {
              firstName: updatedEmployee.firstName,
              lastName: updatedEmployee.lastName,
              department: updatedEmployee.department,
              position: updatedEmployee.position
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        })
        console.log('✅ Audit log created for UPDATE_EMPLOYEE')
      }
    } catch (auditError) {
      console.error('❌ Failed to create audit log:', auditError)
    }

    return NextResponse.json(updatedEmployee, { status: 200 })
  } catch (error) {
    console.error('Error updating employee:', error)
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Delete the employee (this will also delete the associated user due to cascade)
    await prisma.employee.delete({
      where: { id },
    })

    // Create audit log
    try {
      const currentUser = session.user?.email ? await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { employee: true }
      }) : null

      if (currentUser) {
        await prisma.auditLog.create({
          data: {
            action: 'DELETE_EMPLOYEE',
            entityType: 'Employee',
            entityId: id,
            userId: currentUser.id,
            employeeId: currentUser.employee?.id || null,
            oldValues: {
              employeeId: existingEmployee.employeeId,
              firstName: existingEmployee.firstName,
              lastName: existingEmployee.lastName,
              email: existingEmployee.email,
              department: existingEmployee.department,
              position: existingEmployee.position
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        })
        console.log('✅ Audit log created for DELETE_EMPLOYEE')
      }
    } catch (auditError) {
      console.error('❌ Failed to create audit log:', auditError)
    }

    return NextResponse.json(
      { message: 'Employee deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
