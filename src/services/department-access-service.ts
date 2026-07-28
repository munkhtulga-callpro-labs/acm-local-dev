import { prisma } from '@/lib/prisma'
import { ApprovalService } from './approval-service'
import { createResourceAccessRequest } from './resource-request-service'

type OnboardingEmployee = {
  id: string
  firstName: string
  lastName: string
  email: string
  department: string
  company: string | null
}

export class DepartmentAccessService {
  static async provisionDefaultAccess({
    employee,
    requestedByUserId,
  }: {
    employee: OnboardingEmployee
    requestedByUserId?: string | null
  }): Promise<void> {
    const department = await prisma.department.findFirst({
      where: {
        name: employee.department,
        ...(employee.company ? { company: employee.company } : {}),
        isActive: true,
      },
    })

    if (!department) {
      console.warn(
        `No department match for "${employee.department}" — skipping default access provisioning for employee ${employee.id}`
      )
      return
    }

    const templates = await prisma.departmentAccessTemplate.findMany({
      where: { departmentId: department.id, isActive: true },
    })

    if (templates.length === 0) return

    const systemTemplates = templates.filter(t => t.kind === 'SYSTEM' && t.systemId)
    const resourceTemplates = templates.filter(
      t => t.kind === 'RESOURCE' && t.resourceType && t.resourceId
    )

    if (systemTemplates.length > 0 && requestedByUserId) {
      await ApprovalService.createAccessRequest({
        employeeId: employee.id,
        requestType: 'ONBOARDING',
        title: `Default onboarding access — ${department.name}`,
        description: `Automatically requested standard access for the ${department.name} department.`,
        priority: 'MEDIUM',
        requestedBy: requestedByUserId,
        systems: systemTemplates.map(t => ({
          systemId: t.systemId!,
          accessLevel: t.accessLevel,
          isRequired: t.isRequired,
        })),
      })
    }

    for (const template of resourceTemplates) {
      await createResourceAccessRequest({
        employee,
        resourceType: template.resourceType!,
        resourceId: template.resourceId!,
        resourceName: template.resourceName ?? template.resourceType!,
        accessLevel: template.accessLevel,
        businessJustification: `Default access granted automatically for new employee onboarding in the ${department.name} department.`,
        validFrom: new Date(),
        initiatedByUserId: requestedByUserId ?? null,
      })
    }
  }
}
