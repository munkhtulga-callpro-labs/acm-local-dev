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

    const devices = await prisma.resourceDevice.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: devices })
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
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
    if (!body.deviceType) {
      return NextResponse.json(
        { error: 'Device type is required' },
        { status: 400 }
      )
    }

    if (!body.brand && !body.model) {
      return NextResponse.json(
        { error: 'Either brand or model is required' },
        { status: 400 }
      )
    }

    // Create makeModel from brand and model
    const makeModel = [body.brand, body.model].filter(Boolean).join(' ')

    const device = await prisma.resourceDevice.create({
      data: {
        deviceType: body.deviceType,
        makeModel: makeModel,
        serialNumber: body.serialNumber || null,
        assetTag: body.assetTag || null,
        operatingSystem: body.operatingSystem || null,
        assignedTo: body.assignedTo || null,
        assignmentDate: body.assignmentDate ? new Date(body.assignmentDate) : null,
        location: body.location || null,
        condition: body.condition || null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
        status: body.status || 'AVAILABLE',
        specifications: body.specifications || null,
        purchaseCost: body.purchaseCost || null,
        requestDate: body.requestDate ? new Date(body.requestDate) : null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: device }, { status: 201 })
  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    )
  }
}
