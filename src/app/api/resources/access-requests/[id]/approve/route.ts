import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendAccessGrantedNotification, sendAccessRejectedNotification } from '@/lib/email'

// POST /api/resources/access-requests/:id/approve - Approve or reject access request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { decision, comments, accessCredentials } = body

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be APPROVED or REJECTED.' },
        { status: 400 }
      )
    }

    // Get the access request with all approvals
    const accessRequest = await prisma.resourceAccessRequest.findUnique({
      where: { id },
      include: { approvals: true }
    })

    if (!accessRequest) {
      return NextResponse.json(
        { error: 'Access request not found' },
        { status: 404 }
      )
    }

    // Check if current user is an approver for this request
    const userApproval = accessRequest.approvals.find(
      a => a.approverEmail === session.user.email && a.status === 'PENDING'
    )

    if (!userApproval) {
      return NextResponse.json(
        { error: 'You are not authorized to approve this request or it has already been processed.' },
        { status: 403 }
      )
    }

    // Update the user's approval
    await prisma.resourceApproval.update({
      where: { id: userApproval.id },
      data: {
        status: decision,
        decision,
        comments: comments || null,
        decidedAt: new Date()
      }
    })

    // Get updated approvals
    const updatedApprovals = await prisma.resourceApproval.findMany({
      where: { requestId: id }
    })

    // Check if all required approvals are complete
    const allApproved = updatedApprovals.every(a => a.status === 'APPROVED')
    const anyRejected = updatedApprovals.some(a => a.status === 'REJECTED')

    let newRequestStatus = accessRequest.status
    let assignmentCreated = false

    if (anyRejected) {
      // If any approval is rejected, reject the entire request
      newRequestStatus = 'REJECTED'

      await prisma.resourceAccessRequest.update({
        where: { id },
        data: { status: 'REJECTED' }
      })

      // ✅ Create audit log for rejection
      try {
        const approverUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { employee: true }
        })

        if (approverUser) {
          await prisma.auditLog.create({
            data: {
              action: 'REJECT_ACCESS',
              entityType: 'ResourceAccessRequest',
              entityId: id,
              userId: approverUser.id,
              employeeId: approverUser.employee?.id || null,
              oldValues: {
                status: accessRequest.status
              },
              newValues: {
                status: 'REJECTED',
                resourceType: accessRequest.resourceType,
                resourceName: accessRequest.resourceName,
                requesterEmail: accessRequest.requesterEmail,
                accessLevel: accessRequest.accessLevel,
                rejectedBy: session.user.email,
                reason: comments
              },
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
              userAgent: request.headers.get('user-agent')
            }
          })
          console.log('✅ Audit log created for REJECT_ACCESS')
        }
      } catch (auditError) {
        console.error('❌ Failed to create rejection audit log:', auditError)
      }

      // ✅ Send rejection notification email
      try {
        await sendAccessRejectedNotification(accessRequest.requesterEmail, {
          requesterName: accessRequest.requesterName,
          resourceName: accessRequest.resourceName,
          resourceType: accessRequest.resourceType,
          accessLevel: accessRequest.accessLevel,
          rejectedBy: session.user.email,
          reason: comments || undefined
        })
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError)
        // Don't fail the request if email fails
      }

    } else if (allApproved) {
      // If all approvals are complete, create assignment
      newRequestStatus = 'APPROVED'

      await prisma.resourceAccessRequest.update({
        where: { id },
        data: { status: 'APPROVED' }
      })

      // ✅ NEW: Create ResourceAssignment
      const assignment = await prisma.resourceAssignment.create({
        data: {
          requestId: id,
          resourceType: accessRequest.resourceType,
          resourceId: accessRequest.resourceId,
          resourceName: accessRequest.resourceName,
          assigneeId: accessRequest.requesterId,
          assigneeName: accessRequest.requesterName,
          assigneeEmail: accessRequest.requesterEmail,
          assigneeDepartment: accessRequest.requesterDepartment,
          accessLevel: accessRequest.accessLevel,
          accessCredentials: accessCredentials ? JSON.parse(JSON.stringify(accessCredentials)) : null,
          accessDetails: accessRequest.accessDetails as any,
          grantedBy: session.user.email,
          grantedAt: new Date(),
          validFrom: accessRequest.validFrom || new Date(),
          validTo: accessRequest.validTo,
          status: 'ACTIVE',
          isActive: true
        }
      })

      assignmentCreated = true

      // ✅ NEW: Create audit log
      try {
        // Get the actual user record with employee info to ensure valid userId and employeeId
        const approverUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            employee: true
          }
        })

        console.log('Audit log - approver user lookup:', {
          email: session.user.email,
          found: !!approverUser,
          userId: approverUser?.id,
          employeeId: approverUser?.employee?.id
        })

        if (approverUser) {
          const auditData = {
            action: 'GRANT_ACCESS',
            entityType: 'ResourceAssignment',
            entityId: assignment.id,
            userId: approverUser.id,
            employeeId: approverUser.employee?.id || null,
            newValues: {
              resourceType: accessRequest.resourceType,
              resourceName: accessRequest.resourceName,
              assigneeEmail: accessRequest.requesterEmail,
              accessLevel: accessRequest.accessLevel,
              grantedBy: session.user.email
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }

          console.log('Audit log - creating with data:', auditData)

          const auditLog = await prisma.auditLog.create({
            data: auditData
          })

          console.log('✅ Audit log created successfully:', auditLog.id)
        } else {
          console.error('❌ Audit log SKIPPED - approver user not found for email:', session.user.email)
        }
      } catch (auditError) {
        console.error('❌ Failed to create audit log - ERROR DETAILS:', {
          error: auditError,
          message: auditError instanceof Error ? auditError.message : 'Unknown error',
          stack: auditError instanceof Error ? auditError.stack : undefined
        })
        // Don't fail the approval if audit log fails
      }

      // ✅ Send access granted email with credentials
      try {
        await sendAccessGrantedNotification(accessRequest.requesterEmail, {
          requesterName: accessRequest.requesterName,
          resourceName: accessRequest.resourceName,
          resourceType: accessRequest.resourceType,
          accessLevel: accessRequest.accessLevel,
          validFrom: accessRequest.validFrom,
          validTo: accessRequest.validTo,
          credentials: accessCredentials || undefined,
          grantedBy: session.user.email
        })
      } catch (emailError) {
        console.error('Failed to send access granted email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: decision === 'APPROVED'
        ? (assignmentCreated ? 'Access request approved and assignment created.' : 'Your approval has been recorded. Waiting for other approvers.')
        : 'Access request rejected.',
      requestStatus: newRequestStatus,
      assignmentCreated
    })

  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json(
      { error: 'Failed to process approval decision' },
      { status: 500 }
    )
  }
}
