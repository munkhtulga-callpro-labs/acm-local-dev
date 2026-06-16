'use server'

import z from "zod";
import { getServerSession } from "next-auth";
import { updateTag } from "next/cache";
import { authOptions } from "../auth";
import { prisma } from "../prisma";
import { isPrivilegedRole } from "../roles";
import { createPhysicalAccessSchema, updatePhysicalAccessSchema } from "../schemas/physical-access";

async function requirePrivilege() {
  const session = await getServerSession(authOptions)
  if (!session) return 'Unauthorized' as const
  if (!isPrivilegedRole(session.user.role)) return 'Forbidden' as const
  return null
}

export async function createPhysicalAccess(body: unknown) {
  const denied = await requirePrivilege()
  if (denied) return { error: denied }

  const result = createPhysicalAccessSchema.safeParse(body);
  if (!result.success) return { error: z.flattenError(result.error) }

  await prisma.physicalAccess.create({ data: result.data })
  updateTag('physical-access')
}

export async function updatePhysicalAccess(id: string, body: unknown) {
  const denied = await requirePrivilege()
  if (denied) return { error: denied }

  const result = updatePhysicalAccessSchema.safeParse(body);
  if (!result.success) return { error: z.flattenError(result.error) }

  await prisma.physicalAccess.update({ where: { id }, data: result.data });
  updateTag('physical-access')
}

export async function deletePhysicalAccess(id: string) {
  const denied = await requirePrivilege()
  if (denied) return { error: denied }

  await prisma.physicalAccess.delete({ where: { id } })
  updateTag('physical-access')
}
