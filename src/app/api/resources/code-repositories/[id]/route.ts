import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const codeRepository = await prisma.codeRepository.findUnique({
      where: { id }
    })

    if (!codeRepository) {
      return NextResponse.json({ error: 'Code repository not found' }, { status: 404 })
    }

    return NextResponse.json({ data: codeRepository })
  } catch (error) {
    console.error('Error fetching code repository:', error)
    return NextResponse.json(
      { error: 'Failed to fetch code repository' },
      { status: 500 }
    )
  }
}

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

    const codeRepository = await prisma.codeRepository.update({
      where: { id },
      data: {
        platform: body.platform,
        repositoryName: body.repositoryName,
        organizationTeam: body.organizationTeam,
        accessLevel: body.accessLevel,
        branchRestrictions: body.branchRestrictions || null,
        assignedTo: body.assignedTo || null,
        ownerDepartment: body.ownerDepartment || null,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
        webhookAccess: body.webhookAccess ?? false,
        deploymentKeys: body.deploymentKeys || null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: codeRepository })
  } catch (error) {
    console.error('Error updating code repository:', error)
    return NextResponse.json(
      { error: 'Failed to update code repository' },
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

    await prisma.codeRepository.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Code repository deleted successfully' })
  } catch (error) {
    console.error('Error deleting code repository:', error)
    return NextResponse.json(
      { error: 'Failed to delete code repository' },
      { status: 500 }
    )
  }
}
