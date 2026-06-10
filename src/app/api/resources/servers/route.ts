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

    const servers = await prisma.resourceServer.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: servers })
  } catch (error) {
    console.error('Error fetching servers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
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
    if (!body.name || !body.serverType || !body.os || !body.ipAddress || !body.owner || !body.environment || !body.accessLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const server = await prisma.resourceServer.create({
      data: {
        name: body.name,
        type: body.serverType,
        os: body.os,
        environment: body.environment,
        ipHostname: body.ipAddress,
        accessMethod: body.os === 'Windows' ? 'RDP' : 'SSH',
        accessLevel: body.accessLevel,
        locationRegion: body.location || null,
        ownerDepartment: body.owner,
        status: body.isActive ? 'ACTIVE' : 'INACTIVE',
        notes: body.description || null,
        purpose: body.businessJustification || null,
        mfaRequired: false,
        vpnRequired: false,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: server }, { status: 201 })
  } catch (error) {
    console.error('Error creating server:', error)
    return NextResponse.json(
      { error: 'Failed to create server' },
      { status: 500 }
    )
  }
}
