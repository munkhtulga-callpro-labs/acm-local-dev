import { prisma } from '@/lib/prisma'
import { AccessRequestWithRelations } from '@/types'
import { AuditService } from './audit-service'
import { AccessService } from './access-service'
import { EmailService } from './email-service'

export class ApprovalService {
  static async createAccessRequest({
    employeeId,
    requestType,
    title,
    description,
    priority,
    systems,
    requestedBy,
  }: {
    employeeId: string
    requestType: string
    title: string
    description?: string
    priority: string
    systems: Array<{
      systemId: string
      accessLevel: string
      isRequired: boolean
    }>
    requestedBy: string
  }): Promise<AccessRequestWithRelations> {
    const request = await prisma.accessRequest.create({
      data: {
        employeeId,
        requestType: requestType as any,
        title,
        description,
        priority: priority as any,
        requestedBy,
        systems: {
          create: systems.map(system => ({
            systemId: system.systemId,
            accessLevel: system.accessLevel,
            isRequired: system.isRequired,
          })),
        },
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        systems: {
          include: {
            system: true,
          },
        },
        approvals: true,
      },
    })

    // Log the action
    await AuditService.logAction({
      action: 'CREATE_REQUEST',
      entityType: 'AccessRequest',
      entityId: request.id,
      newValues: request,
      userId: requestedBy,
      employeeId,
    })

    // Start approval workflow
    await this.startApprovalWorkflow(request.id)

    return request
  }

  static async startApprovalWorkflow(requestId: string): Promise<void> {
    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: true,
        systems: {
          include: {
            system: true,
          },
        },
      },
    })

    if (!request) return

    // Get approval workflow based on request type and systems
    const workflow = await this.getApprovalWorkflow(request.requestType, request.systems)

    // Create approval steps
    for (const step of workflow.steps) {
      await prisma.approval.create({
        data: {
          accessRequestId: requestId,
          approverId: step.approverId,
          step: step.step,
          status: 'PENDING',
        },
      })
    }

    // Send notifications to first approvers
    await this.notifyApprovers(requestId)
  }

  static async getApprovalWorkflow(requestType: string, systems: any[]): Promise<{
    steps: Array<{
      step: number
      approverId: string
      role: string
    }>
  }> {
    // This is a simplified workflow - in production, this would be more complex
    // based on the request type, systems involved, and company policies

    const steps: Array<{ step: number; approverId: string; role: string }> = []

    // Get IT staff users
    const technicalSystems = systems.filter(s =>
      s.system.category === 'INFRASTRUCTURE' ||
      s.system.category === 'DEVELOPMENT'
    )

    if (technicalSystems.length > 0) {
      // Find first available IT staff member
      const itStaff = await prisma.user.findFirst({
        where: {
          role: 'IT_STAFF',
          isActive: true,
        },
      })

      if (itStaff) {
        steps.push({
          step: steps.length + 1,
          approverId: itStaff.id,
          role: 'IT_STAFF',
        })
      }
    }

    // Get HR manager for sensitive systems or onboarding/offboarding
    const sensitiveSystems = systems.filter(s =>
      s.system.category === 'FINANCE' ||
      s.system.category === 'CUSTOMER_SERVICE'
    )

    const needsHRApproval = sensitiveSystems.length > 0 ||
                           requestType === 'ONBOARDING' ||
                           requestType === 'OFFBOARDING'

    if (needsHRApproval) {
      const hrManager = await prisma.user.findFirst({
        where: {
          role: 'HR_MANAGER',
          isActive: true,
        },
      })

      if (hrManager) {
        steps.push({
          step: steps.length + 1,
          approverId: hrManager.id,
          role: 'HR_MANAGER',
        })
      }
    }

    // If no specific approvers found, default to admin
    if (steps.length === 0) {
      const admin = await prisma.user.findFirst({
        where: {
          role: 'ADMIN',
          isActive: true,
        },
      })

      if (admin) {
        steps.push({
          step: 1,
          approverId: admin.id,
          role: 'ADMIN',
        })
      }
    }

    return { steps }
  }

  static async approveRequest({
    requestId,
    approverId,
    comments,
  }: {
    requestId: string
    approverId: string
    comments?: string
  }): Promise<AccessRequestWithRelations> {
    const approval = await prisma.approval.findFirst({
      where: {
        accessRequestId: requestId,
        approverId,
        status: 'PENDING',
      },
    })

    if (!approval) {
      throw new Error('No pending approval found for this user')
    }

    // Update approval
    await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: 'APPROVED',
        comments,
        approvedAt: new Date(),
      },
    })

    // Check if all approvals are complete
    const request = await this.checkAndCompleteRequest(requestId)

    // Log the action
    await AuditService.logAction({
      action: 'APPROVE_REQUEST',
      entityType: 'AccessRequest',
      entityId: requestId,
      newValues: { status: 'APPROVED', approverId, comments },
      userId: approverId,
      employeeId: request.employeeId,
    })

    return request
  }

  static async rejectRequest({
    requestId,
    approverId,
    comments,
  }: {
    requestId: string
    approverId: string
    comments: string
  }): Promise<AccessRequestWithRelations> {
    const approval = await prisma.approval.findFirst({
      where: {
        accessRequestId: requestId,
        approverId,
        status: 'PENDING',
      },
    })

    if (!approval) {
      throw new Error('No pending approval found for this user')
    }

    // Update approval
    await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: 'REJECTED',
        comments,
        approvedAt: new Date(),
      },
    })

    // Update request status
    const request = await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        completedAt: new Date(),
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        systems: {
          include: {
            system: true,
          },
        },
        approvals: true,
      },
    })

    // Log the action
    await AuditService.logAction({
      action: 'REJECT_REQUEST',
      entityType: 'AccessRequest',
      entityId: requestId,
      newValues: { status: 'REJECTED', approverId, comments },
      userId: approverId,
      employeeId: request.employeeId,
    })

    return request
  }

  static async checkAndCompleteRequest(requestId: string): Promise<AccessRequestWithRelations> {
    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        systems: {
          include: {
            system: true,
          },
        },
        approvals: true,
      },
    })

    if (!request) {
      throw new Error('Request not found')
    }

    // Check if all required approvals are complete
    const pendingApprovals = request.approvals.filter((a: any) => a.status === 'PENDING')
    const rejectedApprovals = request.approvals.filter((a: any) => a.status === 'REJECTED')

    if (rejectedApprovals.length > 0) {
      // Request is rejected
      return await prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
        },
        include: {
          employee: {
            include: {
              user: true,
            },
          },
          systems: {
            include: {
              system: true,
            },
          },
          approvals: true,
        },
      })
    }

    if (pendingApprovals.length === 0) {
      // All approvals complete - provision access
      await this.provisionAccess(requestId)
      
      return await prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        include: {
          employee: {
            include: {
              user: true,
            },
          },
          systems: {
            include: {
              system: true,
            },
          },
          approvals: true,
        },
      })
    }

    return request
  }

  static async provisionAccess(requestId: string): Promise<void> {
    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        systems: {
          include: {
            system: true,
          },
        },
      },
    })

    if (!request) return

    // Create access permissions for each system
    for (const requestSystem of request.systems) {
      await AccessService.createAccessPermission({
        employeeId: request.employeeId,
        systemId: requestSystem.systemId,
        accessLevel: requestSystem.accessLevel,
        grantedBy: request.requestedBy,
      })
    }

    // Send notification email
    await EmailService.sendAccessGrantedNotification({
      employee: request.employee,
      systems: request.systems.map((rs: any) => ({
        system: rs.system,
        accessLevel: rs.accessLevel,
      })),
    })
  }

  static async notifyApprovers(requestId: string): Promise<void> {
    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: true,
        systems: {
          include: {
            system: true,
          },
        },
        approvals: {
          where: { status: 'PENDING' },
          orderBy: { step: 'asc' },
          take: 1,
        },
      },
    })

    if (!request || request.approvals.length === 0) return

    // Send notification to first pending approver
    await EmailService.sendApprovalRequiredNotification({
      request,
      approverId: request.approvals[0].approverId,
    })
  }

  static async getPendingApprovals(userId: string): Promise<AccessRequestWithRelations[]> {
    return await prisma.accessRequest.findMany({
      where: {
        status: 'PENDING',
        approvals: {
          some: {
            approverId: userId,
            status: 'PENDING',
          },
        },
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        systems: {
          include: {
            system: true,
          },
        },
        approvals: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getRequestById(id: string): Promise<AccessRequestWithRelations | null> {
    return await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        systems: {
          include: {
            system: true,
          },
        },
        approvals: true,
      },
    })
  }
}
