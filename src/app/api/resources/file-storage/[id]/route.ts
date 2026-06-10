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

    const fileStorage = await prisma.fileStorage.findUnique({
      where: { id }
    })

    if (!fileStorage) {
      return NextResponse.json({ error: 'File storage not found' }, { status: 404 })
    }

    return NextResponse.json({ data: fileStorage })
  } catch (error) {
    console.error('Error fetching file storage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file storage' },
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

    const fileStorage = await prisma.fileStorage.update({
      where: { id },
      data: {
        storageType: body.storageType,
        pathLocation: body.pathLocation,
        permissionLevel: body.permissionLevel,
        quotaLimit: body.quotaLimit || null,
        assignedTo: body.assignedTo || null,
        encryptionStatus: body.encryptionStatus || null,
        ownerDepartment: body.ownerDepartment || null,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
        sharingSettings: body.sharingSettings || null,
        retentionPolicy: body.retentionPolicy || null,
        requestDate: body.requestDate ? new Date(body.requestDate) : null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: fileStorage })
  } catch (error) {
    console.error('Error updating file storage:', error)
    return NextResponse.json(
      { error: 'Failed to update file storage' },
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

    await prisma.fileStorage.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'File storage deleted successfully' })
  } catch (error) {
    console.error('Error deleting file storage:', error)
    return NextResponse.json(
      { error: 'Failed to delete file storage' },
      { status: 500 }
    )
  }
}
