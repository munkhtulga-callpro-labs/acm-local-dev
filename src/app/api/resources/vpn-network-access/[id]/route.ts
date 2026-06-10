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

    const vpnNetwork = await prisma.vPNNetworkAccess.findUnique({
      where: { id }
    })

    if (!vpnNetwork) {
      return NextResponse.json({ error: 'VPN/Network Access not found' }, { status: 404 })
    }

    return NextResponse.json({ data: vpnNetwork })
  } catch (error) {
    console.error('Error fetching VPN/Network Access:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VPN/Network Access' },
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

    const vpnNetwork = await prisma.vPNNetworkAccess.update({
      where: { id },
      data: {
        profileName: body.profileName,
        vpnType: body.vpnType,
        networkSegments: body.networkSegments,
        accessLevel: body.accessLevel,
        deviceRestrictions: body.deviceRestrictions || null,
        assignedTo: body.assignedTo || null,
        validFrom: new Date(body.validFrom),
        validTo: body.validTo ? new Date(body.validTo) : null,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
        ipWhitelist: body.ipWhitelist || null,
        splitTunnel: body.splitTunnel ?? false,
        requestDate: body.requestDate ? new Date(body.requestDate) : null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: vpnNetwork })
  } catch (error) {
    console.error('Error updating VPN/Network Access:', error)
    return NextResponse.json(
      { error: 'Failed to update VPN/Network Access' },
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

    await prisma.vPNNetworkAccess.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'VPN/Network Access deleted successfully' })
  } catch (error) {
    console.error('Error deleting VPN/Network Access:', error)
    return NextResponse.json(
      { error: 'Failed to delete VPN/Network Access' },
      { status: 500 }
    )
  }
}
