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

    const physicalAccess = await prisma.physicalAccess.findUnique({
      where: { id }
    })

    if (!physicalAccess) {
      return NextResponse.json({ error: 'Physical access not found' }, { status: 404 })
    }

    return NextResponse.json({ data: physicalAccess })
  } catch (error) {
    console.error('Error fetching physical access:', error)
    return NextResponse.json(
      { error: 'Failed to fetch physical access' },
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

    const physicalAccess = await prisma.physicalAccess.update({
      where: { id },
      data: {
        location: body.location,
        accessType: body.accessType,
        badgeCardNumber: body.badgeCardNumber || null,
        accessSchedule: body.accessSchedule,
        accessZones: body.accessZones,
        assignedTo: body.assignedTo || null,
        validFrom: new Date(body.validFrom),
        validTo: body.validTo ? new Date(body.validTo) : null,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
        escortRequired: body.escortRequired ?? false,
        authorizationLevel: body.authorizationLevel || null,
        requestDate: body.requestDate ? new Date(body.requestDate) : null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: physicalAccess })
  } catch (error) {
    console.error('Error updating physical access:', error)
    return NextResponse.json(
      { error: 'Failed to update physical access' },
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

    await prisma.physicalAccess.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Physical access deleted successfully' })
  } catch (error) {
    console.error('Error deleting physical access:', error)
    return NextResponse.json(
      { error: 'Failed to delete physical access' },
      { status: 500 }
    )
  }
}
