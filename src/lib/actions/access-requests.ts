'use server'

import z from 'zod'
import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth'
import { prisma } from '../prisma'
import { sendAccessRequestNotification } from '../email'
import { createAccessRequestSchema } from '../schemas/access-request'

export async function createAccessRequest(body: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return { error: 'Unauthorized' as const }

  const result = createAccessRequestSchema.safeParse(body)
  if (!result.success) return { error: z.flattenError(result.error as z.ZodError) }

  const data = result.data

  console.log(session.user.email)
  const employee = await prisma.employee.findUnique({ where: { email: session.user.email } })
  if (!employee) {
    return { error: 'Employee record not found' as const }
  }

  const owners = await prisma.resourceOwner.findMany({
    where: { resourceType: data.resourceType, resourceId: data.resourceId, isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  if (owners.length === 0) return { error: 'No owners found for this resource. Please contact IT.' as const }

  const ownersWithEmail = owners.filter(o => o.ownerEmail?.trim())
  if (ownersWithEmail.length === 0) return { error: 'No individual owners found for this resource. Please contact IT.' as const }

  const accessRequest = await prisma.resourceAccessRequest.create({
    data: {
      requestType: 'ACCESS_GRANT',
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      resourceName: data.resourceName,
      requesterId: employee.id,
      requesterName: `${employee.firstName} ${employee.lastName}`,
      requesterEmail: employee.email,
      requesterDepartment: employee.department,
      accessLevel: data.accessLevel,
      businessJustification: data.businessJustification,
      accessRequestTicketId: data.accessRequestTicketId ?? null,
      validFrom: new Date(data.validFrom),
      validTo: data.validTo ? new Date(data.validTo) : null,
      status: 'PENDING',
      priority: data.priority,
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
    const requesterUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employee: true },
    })
    if (requesterUser) {
      const hdrs = await headers()
      await prisma.auditLog.create({
        data: {
          action: 'CREATE_ACCESS_REQUEST',
          entityType: 'ResourceAccessRequest',
          entityId: accessRequest.id,
          userId: requesterUser.id,
          employeeId: requesterUser.employee?.id ?? null,
          newValues: {
            resourceType: data.resourceType,
            resourceName: data.resourceName,
            accessLevel: data.accessLevel,
            requesterEmail: employee.email,
            businessJustification: data.businessJustification,
          },
          ipAddress: hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? undefined,
          userAgent: hdrs.get('user-agent') ?? undefined,
        },
      })
    }
  } catch (auditError) {
    console.error('Failed to create audit log:', auditError)
  }

  try {
    await Promise.all(
      ownersWithEmail.map(owner =>
        sendAccessRequestNotification(owner.ownerEmail!, {
          requesterName: `${employee.firstName} ${employee.lastName}`,
          requesterEmail: employee.email,
          resourceName: data.resourceName,
          resourceType: data.resourceType,
          accessLevel: data.accessLevel,
          businessJustification: data.businessJustification,
          requestId: accessRequest.id,
        })
      )
    )
  } catch (emailError) {
    console.error('Failed to send access request notifications:', emailError)
  }
}
