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

    const apiKeys = await prisma.aPIKey.findMany({
      orderBy: {
        createdDate: 'desc'
      }
    })

    const rest = apiKeys.map(({apiKeyToken, ...rest}) => rest);

    return NextResponse.json({ data: rest })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
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
    if (!body.serviceName || !body.apiKeyToken || !body.keyType || !body.scopePermissions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const apiKey = await prisma.aPIKey.create({
      data: {
        serviceName: body.serviceName,
        apiKeyToken: body.apiKeyToken,
        keyType: body.keyType,
        scopePermissions: body.scopePermissions,
        rateLimit: body.rateLimit || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        assignedTo: body.assignedTo || null,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
        ipRestrictions: body.ipRestrictions || null,
        webhookUrls: body.webhookUrls || null,
        requestDate: body.requestDate ? new Date(body.requestDate) : null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: apiKey }, { status: 201 })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}
