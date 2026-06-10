import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const licenses = await prisma.softwareLicense.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert Decimal to number for JSON serialization
    const serializedLicenses = licenses.map(license => ({
      ...license,
      cost: license.cost ? Number(license.cost) : null
    }))

    return NextResponse.json({ data: serializedLicenses })
  } catch (error) {
    console.error('Error fetching software licenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch software licenses' },
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
    if (!body.softwareName || !body.vendor || !body.licenseType || !body.totalSeats) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const license = await prisma.softwareLicense.create({
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

    return NextResponse.json({ data: serializedLicense }, { status: 201 })
  } catch (error) {
    console.error('Error creating software license:', error)
    return NextResponse.json(
      { error: 'Failed to create software license' },
      { status: 500 }
    )
  }
}
