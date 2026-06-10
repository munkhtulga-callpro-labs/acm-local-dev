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

    const physicalAccesses = await prisma.physicalAccess.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: physicalAccesses })
  } catch (error) {
    console.error('Error fetching physical access:', error)
    return NextResponse.json(
      { error: 'Failed to fetch physical access' },
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
    if (!body.location || !body.accessType || !body.accessSchedule || !body.accessZones || !body.validFrom) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const physicalAccess = await prisma.physicalAccess.create({
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

    return NextResponse.json({ data: physicalAccess }, { status: 201 })
  } catch (error) {
    console.error('Error creating physical access:', error)
    return NextResponse.json(
      { error: 'Failed to create physical access' },
      { status: 500 }
    )
  }
}
