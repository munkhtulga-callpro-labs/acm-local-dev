import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCompanySchema } from '@/lib/validations'
import { AuditService } from '@/services/audit-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateCompanySchema.parse(body)

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it conflicts
    if (validatedData.name && validatedData.name !== existingCompany.name) {
      const nameConflict = await prisma.company.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id }
        },
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Company with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: validatedData,
    })

    await AuditService.logAction({
      action: 'UPDATE_COMPANY',
      entityType: 'Company',
      entityId: updatedCompany.id,
      oldValues: existingCompany,
      newValues: updatedCompany,
      userId: session.user.id,
    })

    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error('Error updating company:', error)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingCompany = await prisma.company.findUnique({
      where: { id },
      include: {
        employees: true,
        departments: true,
      },
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Check if company has employees or departments
    if (existingCompany.employees.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete company with employees. Please reassign or delete employees first.' },
        { status: 400 }
      )
    }

    if (existingCompany.departments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete company with departments. Please delete departments first.' },
        { status: 400 }
      )
    }

    await AuditService.logAction({
      action: 'DELETE_COMPANY',
      entityType: 'Company',
      entityId: existingCompany.id,
      oldValues: existingCompany,
      userId: session.user.id,
    })

    await prisma.company.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
