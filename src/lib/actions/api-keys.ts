'use server'

import z from "zod";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { createApiKeySchema, updateApiKeySchema } from "../schemas/api-key"
import { prisma } from "../prisma";
import { updateTag } from "next/cache";

const PRIVILEGED_ROLES = ['ADMIN', 'IT_STAFF']

async function requirePrivilege() {
  const session = await getServerSession(authOptions)
  if (!session) return 'Unauthorized' as const
  if (!PRIVILEGED_ROLES.includes(session.user.role)) return 'Forbidden' as const
  return null
}

export async function createApiKey(body: unknown) {
  const denied = await requirePrivilege()
  if (denied) return { error: denied }

  const result = createApiKeySchema.safeParse(body);
  if (!result.success) return { error: z.flattenError(result.error) }

  await prisma.aPIKey.create({ data: result.data })
  updateTag('api-keys')
}

export async function updateApiKey(id: string, body: unknown) {
  const denied = await requirePrivilege()
  if (denied) return { error: denied }

  const result = updateApiKeySchema.safeParse(body);
  if (!result.success) return { error: z.flattenError(result.error) }

  const { apiKeyToken, ...rest } = result.data;
  await prisma.aPIKey.update({ where: { id }, data: apiKeyToken ? { ...rest, apiKeyToken } : rest });
  updateTag('api-keys')
}

export async function deleteApiKey(id: string) {
  const denied = await requirePrivilege()
  if (denied) return { error: denied }

  await prisma.aPIKey.delete({ where: { id } });
  updateTag('api-keys')
}

export async function getApiKeyToken(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) return { error: 'Unauthorized' as const }

  const apiKey = await prisma.aPIKey.findUnique({
    where: { id },
    select: { id: true, serviceName: true, apiKeyToken: true, assignedTo: true },
  })

  if (!apiKey) return { error: 'Not found' as const }

  const isPrivileged = PRIVILEGED_ROLES.includes(session.user.role)
  const isOwner = apiKey.assignedTo === session.user.email

  if (!isPrivileged && !isOwner) return { error: 'Forbidden' as const }

  const hdrs = await headers()
  await prisma.auditLog.create({
    data: {
      action: 'VIEW_TOKEN',
      entityType: 'APIKey',
      entityId: id,
      userId: session.user.id,
      ipAddress: hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? undefined,
      userAgent: hdrs.get('user-agent') ?? undefined,
      newValues: { serviceName: apiKey.serviceName },
    },
  })

  return { token: apiKey.apiKeyToken }
}
