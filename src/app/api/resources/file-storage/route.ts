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

    const fileStorages = await prisma.fileStorage.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: fileStorages })
  } catch (error) {
    console.error('Error fetching file storage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file storage' },
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
    if (!body.storageType || !body.pathLocation || !body.permissionLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const fileStorage = await prisma.fileStorage.create({
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

    return NextResponse.json({ data: fileStorage }, { status: 201 })
  } catch (error) {
    console.error('Error creating file storage:', error)
    return NextResponse.json(
      { error: 'Failed to create file storage' },
      { status: 500 }
    )
  }
}
