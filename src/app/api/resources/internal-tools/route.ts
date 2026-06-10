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

    const tools = await prisma.internalTool.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: tools })
  } catch (error) {
    console.error('Error fetching internal tools:', error)
    return NextResponse.json(
      { error: 'Failed to fetch internal tools' },
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
    if (!body.toolName || !body.url || !body.purposeCategory || !body.accessLevel || !body.authenticationMethod || !body.networkAccess) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const tool = await prisma.internalTool.create({
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

    return NextResponse.json({ data: tool }, { status: 201 })
  } catch (error) {
    console.error('Error creating internal tool:', error)
    return NextResponse.json(
      { error: 'Failed to create internal tool' },
      { status: 500 }
    )
  }
}
