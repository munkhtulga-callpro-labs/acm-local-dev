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

    const tool = await prisma.internalTool.findUnique({
      where: { id }
    })

    if (!tool) {
      return NextResponse.json({ error: 'Internal tool not found' }, { status: 404 })
    }

    return NextResponse.json({ data: tool })
  } catch (error) {
    console.error('Error fetching internal tool:', error)
    return NextResponse.json(
      { error: 'Failed to fetch internal tool' },
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

    const tool = await prisma.internalTool.update({
      where: { id },
      data: {
        toolName: body.toolName,
        url: body.url,
        purposeCategory: body.purposeCategory,
        accessLevel: body.accessLevel,
        authenticationMethod: body.authenticationMethod,
        networkAccess: body.networkAccess,
        ownerDepartment: body.ownerDepartment || null,
        userGroups: body.userGroups || null,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
        documentationLink: body.documentationLink || null,
        integrationSystems: body.integrationSystems || null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: tool })
  } catch (error) {
    console.error('Error updating internal tool:', error)
    return NextResponse.json(
      { error: 'Failed to update internal tool' },
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

    await prisma.internalTool.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Internal tool deleted successfully' })
  } catch (error) {
    console.error('Error deleting internal tool:', error)
    return NextResponse.json(
      { error: 'Failed to delete internal tool' },
      { status: 500 }
    )
  }
}
