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

    const cloudAccounts = await prisma.cloudAccount.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: cloudAccounts })
  } catch (error) {
    console.error('Error fetching cloud accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cloud accounts' },
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
    if (!body.cloudProvider || !body.accountName || !body.environment || !body.accessType || !body.permissionLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const cloudAccount = await prisma.cloudAccount.create({
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

    return NextResponse.json({ data: cloudAccount }, { status: 201 })
  } catch (error) {
    console.error('Error creating cloud account:', error)
    return NextResponse.json(
      { error: 'Failed to create cloud account' },
      { status: 500 }
    )
  }
}
