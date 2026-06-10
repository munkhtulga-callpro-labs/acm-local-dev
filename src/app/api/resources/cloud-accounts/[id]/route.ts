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

    const cloudAccount = await prisma.cloudAccount.findUnique({
      where: { id }
    })

    if (!cloudAccount) {
      return NextResponse.json({ error: 'Cloud account not found' }, { status: 404 })
    }

    return NextResponse.json({ data: cloudAccount })
  } catch (error) {
    console.error('Error fetching cloud account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cloud account' },
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

    const cloudAccount = await prisma.cloudAccount.update({
      where: { id },
      data: {
        cloudProvider: body.cloudProvider,
        accountName: body.accountName,
        accountId: body.accountId || null,
        environment: body.environment,
        accessType: body.accessType,
        permissionLevel: body.permissionLevel,
        regionAccess: body.regionAccess || null,
        mfaRequired: body.mfaRequired ?? true,
        ownerDepartment: body.ownerDepartment || null,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
        costCenter: body.costCenter || null,
        servicesAccessible: body.servicesAccessible || null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: cloudAccount })
  } catch (error) {
    console.error('Error updating cloud account:', error)
    return NextResponse.json(
      { error: 'Failed to update cloud account' },
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

    await prisma.cloudAccount.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Cloud account deleted successfully' })
  } catch (error) {
    console.error('Error deleting cloud account:', error)
    return NextResponse.json(
      { error: 'Failed to delete cloud account' },
      { status: 500 }
    )
  }
}
