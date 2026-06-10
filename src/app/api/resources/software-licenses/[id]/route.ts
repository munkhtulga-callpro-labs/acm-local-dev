import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

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

    const license = await prisma.softwareLicense.findUnique({
      where: { id }
    })

    if (!license) {
      return NextResponse.json({ error: 'Software license not found' }, { status: 404 })
    }

    // Convert Decimal to number for JSON serialization
    const serializedLicense = {
      ...license,
      cost: license.cost ? Number(license.cost) : null
    }

    return NextResponse.json({ data: serializedLicense })
  } catch (error) {
    console.error('Error fetching software license:', error)
    return NextResponse.json(
      { error: 'Failed to fetch software license' },
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

    const license = await prisma.softwareLicense.update({
      where: { id },
      data: {
        softwareName: body.softwareName,
        vendor: body.vendor,
        licenseType: body.licenseType,
        totalSeats: parseInt(body.totalSeats),
        assignedSeats: parseInt(body.assignedSeats) || 0,
        cost: body.cost ? new Decimal(body.cost) : null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        expiryRenewalDate: body.expiryRenewalDate ? new Date(body.expiryRenewalDate) : null,
        autoRenewal: body.autoRenewal ?? false,
        licenseKey: body.licenseKey || null,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    // Convert Decimal to number for JSON serialization
    const serializedLicense = {
      ...license,
      cost: license.cost ? Number(license.cost) : null
    }

    return NextResponse.json({ data: serializedLicense })
  } catch (error) {
    console.error('Error updating software license:', error)
    return NextResponse.json(
      { error: 'Failed to update software license' },
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

    await prisma.softwareLicense.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Software license deleted successfully' })
  } catch (error) {
    console.error('Error deleting software license:', error)
    return NextResponse.json(
      { error: 'Failed to delete software license' },
      { status: 500 }
    )
  }
}
