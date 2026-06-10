import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendAccessRequestNotification } from '@/lib/email'

// GET /api/resources/access-requests - Get all requests (with filters)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') // 'my-requests' | 'pending-approvals' | 'all'
    const status = searchParams.get('status')

    let whereClause: any = {}

    if (view === 'my-requests') {
      // Show requests made by current user
      whereClause.requesterEmail = session.user.email
    } else if (view === 'pending-approvals') {
      // ✅ NEW: Dynamic owner lookup instead of cached currentApproverId
      // Show requests where current user is an approver (via their approvals)
      whereClause.approvals = {
        some: {
          approverEmail: session.user.email,
          status: 'PENDING'
        }
      }
      whereClause.status = 'PENDING'
    }

    if (status && view !== 'pending-approvals') {
      whereClause.status = status
    }

    const requests = await prisma.resourceAccessRequest.findMany({
      where: whereClause,
      include: {
        approvals: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: requests })
  } catch (error) {
    console.error('Error fetching access requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch access requests' },
      { status: 500 }
    )
  }
}

// POST /api/resources/access-requests - Create new request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.resourceType || !body.resourceId || !body.accessLevel || !body.businessJustification) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get requester info from session/employee
    const employee = await prisma.employee.findUnique({
      where: { email: session.user.email }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      )
    }

    // Get resource owners to assign approver
    const owners = await prisma.resourceOwner.findMany({
      where: {
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        isActive: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (owners.length === 0) {
      return NextResponse.json(
        { error: 'No owners found for this resource. Please contact IT.' },
        { status: 400 }
      )
    }

    // Filter to get only owners with email addresses (exclude department-only owners without email)
    const ownersWithEmail = owners.filter(o => o.ownerEmail && o.ownerEmail.trim() !== '')

    if (ownersWithEmail.length === 0) {
      return NextResponse.json(
        { error: 'No individual owners found for this resource. Please contact IT.' },
        { status: 400 }
      )
    }

    // Create access request
    const accessRequest = await prisma.resourceAccessRequest.create({
      data: {
        requestType: 'ACCESS_GRANT',
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        resourceName: body.resourceName,
        requesterId: employee.id,
        requesterName: `${employee.firstName} ${employee.lastName}`,
        requesterEmail: employee.email,
        requesterDepartment: employee.department,
        accessLevel: body.accessLevel,
        accessDetails: body.accessDetails || null,
        businessJustification: body.businessJustification,
        accessRequestTicketId: body.accessRequestTicketId || null,
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validTo: body.validTo ? new Date(body.validTo) : null,
        status: 'PENDING',
        priority: body.priority || 'MEDIUM',
        currentApproverId: null // No longer needed - using dynamic approval lookup
      }
    })

    // Create approval records ONLY for owners with email addresses
    await Promise.all(
      ownersWithEmail.map((owner) =>
        prisma.resourceApproval.create({
          data: {
            requestId: accessRequest.id,
            approverId: owner.ownerEmail!,
            approverName: owner.ownerEmail!,
            approverEmail: owner.ownerEmail!,
            approverRole: owner.ownershipType,
            status: 'PENDING',
          }
        })
      )
    )

    // ✅ Create audit log for access request creation
    try {
      const requesterUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { employee: true }
      })

      if (requesterUser) {
        await prisma.auditLog.create({
          data: {
            action: 'CREATE_ACCESS_REQUEST',
            entityType: 'ResourceAccessRequest',
            entityId: accessRequest.id,
            userId: requesterUser.id,
            employeeId: requesterUser.employee?.id || null,
            newValues: {
              resourceType: body.resourceType,
              resourceName: body.resourceName,
              accessLevel: body.accessLevel,
              requesterEmail: employee.email,
              businessJustification: body.businessJustification
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        })
        console.log('✅ Audit log created for CREATE_ACCESS_REQUEST')
      }
    } catch (auditError) {
      console.error('❌ Failed to create audit log:', auditError)
    }

    // ✅ Send email notification to all approvers
    try {
      await Promise.all(
        ownersWithEmail.map(owner =>
          sendAccessRequestNotification(owner.ownerEmail!, {
            requesterName: `${employee.firstName} ${employee.lastName}`,
            requesterEmail: employee.email,
            resourceName: body.resourceName,
            resourceType: body.resourceType,
            accessLevel: body.accessLevel,
            businessJustification: body.businessJustification,
            requestId: accessRequest.id
          })
        )
      )
    } catch (emailError) {
      console.error('Failed to send access request notifications:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        data: accessRequest,
        message: 'Access request submitted successfully. You will be notified once reviewed.'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating access request:', error)
    return NextResponse.json(
      { error: 'Failed to create access request' },
      { status: 500 }
    )
  }
}
