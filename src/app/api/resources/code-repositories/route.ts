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

    const codeRepositories = await prisma.codeRepository.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: codeRepositories })
  } catch (error) {
    console.error('Error fetching code repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch code repositories' },
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
    if (!body.platform || !body.repositoryName || !body.organizationTeam || !body.accessLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const codeRepository = await prisma.codeRepository.create({
      data: {
        platform: body.platform,
        repositoryName: body.repositoryName,
        organizationTeam: body.organizationTeam,
        accessLevel: body.accessLevel,
        branchRestrictions: body.branchRestrictions || null,
        assignedTo: body.assignedTo || null,
        ownerDepartment: body.ownerDepartment || null,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
        webhookAccess: body.webhookAccess ?? false,
        deploymentKeys: body.deploymentKeys || null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    return NextResponse.json({ data: codeRepository }, { status: 201 })
  } catch (error) {
    console.error('Error creating code repository:', error)
    return NextResponse.json(
      { error: 'Failed to create code repository' },
      { status: 500 }
    )
  }
}
