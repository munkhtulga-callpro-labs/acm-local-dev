import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vpnNetworks = await prisma.vPNNetworkAccess.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: vpnNetworks })
  } catch (error) {
    console.error('Error fetching VPN/Network Access:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VPN/Network Access' },
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

    // Validate required fields
    if (!body.profileName || !body.vpnType || !body.networkSegments || !body.accessLevel || !body.validFrom) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const vpnNetwork = await prisma.vPNNetworkAccess.create({
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

    return NextResponse.json({ data: vpnNetwork }, { status: 201 })
  } catch (error) {
    console.error('Error creating VPN/Network Access:', error)
    return NextResponse.json(
      { error: 'Failed to create VPN/Network Access' },
      { status: 500 }
    )
  }
}
