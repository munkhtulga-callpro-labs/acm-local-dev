import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sendAccessRequestNotification } from '@/lib/email'

export type ResourceAccessRequesterEmployee = {
  id: string
  firstName: string
  lastName: string
  email: string
  department: string
}

export async function createResourceAccessRequest({
  employee,
  resourceType,
  resourceId,
  resourceName,
  accessLevel,
  businessJustification,
  accessRequestTicketId,
  validFrom,
  validTo,
  priority = 'MEDIUM',
  initiatedByUserId,
}: {
  employee: ResourceAccessRequesterEmployee
  resourceType: string
  resourceId: string
  resourceName: string
  accessLevel: string
  businessJustification: string
  accessRequestTicketId?: string | null
  validFrom: Date
  validTo?: Date | null
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  initiatedByUserId?: string | null
}) {
  const owners = await prisma.resourceOwner.findMany({
    where: { resourceType, resourceId, isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  if (owners.length === 0) {
    return { error: 'No owners found for this resource. Please contact IT.' as const }
  }

  const ownersWithEmail = owners.filter(o => o.ownerEmail?.trim())
  if (ownersWithEmail.length === 0) {
    return { error: 'No individual owners found for this resource. Please contact IT.' as const }
  }

  const accessRequest = await prisma.resourceAccessRequest.create({
    data: {
      requestType: 'ACCESS_GRANT',
      resourceType,
      resourceId,
      resourceName,
      requesterId: employee.id,
      requesterName: `${employee.firstName} ${employee.lastName}`,
      requesterEmail: employee.email,
      requesterDepartment: employee.department,
      accessLevel,
      businessJustification,
      accessRequestTicketId: accessRequestTicketId ?? null,
      validFrom,
      validTo: validTo ?? null,
      status: 'PENDING',
      priority,
      currentApproverId: null,
    },
  })

  await Promise.all(
    ownersWithEmail.map(owner =>
      prisma.resourceApproval.create({
        data: {
          requestId: accessRequest.id,
          approverId: owner.ownerEmail!,
          approverName: owner.ownerEmail!,
          approverEmail: owner.ownerEmail!,
          approverRole: owner.ownershipType,
          status: 'PENDING',
        },
      })
    )
  )

  try {
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_ACCESS_REQUEST',
        entityType: 'ResourceAccessRequest',
        entityId: accessRequest.id,
        userId: initiatedByUserId ?? null,
        employeeId: employee.id,
        newValues: {
          resourceType,
          resourceName,
          accessLevel,
          requesterEmail: employee.email,
          businessJustification,
        },
        ipAddress: await getRequestIp(),
        userAgent: await getRequestUserAgent(),
      },
    })
  } catch (auditError) {
    console.error('Failed to create audit log:', auditError)
  }

  try {
    await Promise.all(
      ownersWithEmail.map(owner =>
        sendAccessRequestNotification(owner.ownerEmail!, {
          requesterName: `${employee.firstName} ${employee.lastName}`,
          requesterEmail: employee.email,
          resourceName,
          resourceType,
          accessLevel,
          businessJustification,
          requestId: accessRequest.id,
        })
      )
    )
  } catch (emailError) {
    console.error('Failed to send access request notifications:', emailError)
  }

  return { accessRequest }
}

async function getRequestIp() {
  try {
    const hdrs = await headers()
    return hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? undefined
  } catch {
    return undefined
  }
}

async function getRequestUserAgent() {
  try {
    const hdrs = await headers()
    return hdrs.get('user-agent') ?? undefined
  } catch {
    return undefined
  }
}
