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

    const server = await prisma.resourceServer.findUnique({
      where: { id }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    return NextResponse.json({ data: server })
  } catch (error) {
    console.error('Error fetching server:', error)
    return NextResponse.json(
      { error: 'Failed to fetch server' },
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

    const server = await prisma.resourceServer.update({
      where: { id },
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
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: server })
  } catch (error) {
    console.error('Error updating server:', error)
    return NextResponse.json(
      { error: 'Failed to update server' },
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

    await prisma.resourceServer.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Server deleted successfully' })
  } catch (error) {
    console.error('Error deleting server:', error)
    return NextResponse.json(
      { error: 'Failed to delete server' },
      { status: 500 }
    )
  }
}
