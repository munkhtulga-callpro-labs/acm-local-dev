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

    const apiKey = await prisma.aPIKey.findUnique({
      where: { id }
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return NextResponse.json({ data: apiKey })
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
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

    const apiKey = await prisma.aPIKey.update({
      where: { id },
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

    return NextResponse.json({ data: apiKey })
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json(
      { error: 'Failed to update API key' },
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

    await prisma.aPIKey.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'API key deleted successfully' })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}
