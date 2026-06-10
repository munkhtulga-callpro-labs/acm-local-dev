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

    const device = await prisma.resourceDevice.findUnique({
      where: { id }
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    return NextResponse.json({ data: device })
  } catch (error) {
    console.error('Error fetching device:', error)
    return NextResponse.json(
      { error: 'Failed to fetch device' },
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

    // Create makeModel from brand and model
    const makeModel = [body.brand, body.model].filter(Boolean).join(' ')

    const device = await prisma.resourceDevice.update({
      where: { id },
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

    return NextResponse.json({ data: device })
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json(
      { error: 'Failed to update device' },
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

    await prisma.resourceDevice.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Device deleted successfully' })
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json(
      { error: 'Failed to delete device' },
      { status: 500 }
    )
  }
}
