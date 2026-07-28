'use server'

import z from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth'
import { prisma } from '../prisma'
import { createAccessRequestSchema } from '../schemas/access-request'
import { createResourceAccessRequest } from '@/services/resource-request-service'

export async function createAccessRequest(body: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return { error: 'Unauthorized' as const }

  const result = createAccessRequestSchema.safeParse(body)
  if (!result.success) return { error: z.flattenError(result.error as z.ZodError) }

  const data = result.data

  const employee = await prisma.employee.findUnique({ where: { email: session.user.email } })
  if (!employee) {
    return { error: 'Employee record not found' as const }
  }

  const requesterUser = await prisma.user.findUnique({ where: { email: session.user.email } })

  const creationResult = await createResourceAccessRequest({
    employee,
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    resourceName: data.resourceName,
    accessLevel: data.accessLevel,
    businessJustification: data.businessJustification,
    accessRequestTicketId: data.accessRequestTicketId,
    validFrom: new Date(data.validFrom),
    validTo: data.validTo ? new Date(data.validTo) : null,
    priority: data.priority,
    initiatedByUserId: requesterUser?.id ?? null,
  })

  if ('error' in creationResult) return creationResult
}
