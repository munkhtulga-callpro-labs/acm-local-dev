'use server'

import z from "zod";
import { getServerSession } from "next-auth";
import { updateTag } from "next/cache";
import { authOptions } from "../auth";
import { prisma } from "../prisma";
import { createFileStorageSchema, updateFileStorageSchema } from "../schemas/file-storage";

const PRIVILEGED_ROLES = ['ADMIN', 'IT_STAFF']

async function requirePrivilege() {
  const session = await getServerSession(authOptions)
  if (!session) return 'Unauthorized' as const
  if (!PRIVILEGED_ROLES.includes(session.user.role)) return 'Forbidden' as const
  return null
}

export async function createFileStorage(body: unknown) {
  const denied = await requirePrivilege()
  if (denied) return { error: denied }

  const result = createFileStorageSchema.safeParse(body);
  if (!result.success) return { error: z.flattenError(result.error) }

  await prisma.fileStorage.create({ data: result.data })
  updateTag('file-storage')
}

export async function updateFileStorage(id: string, body: unknown) {
  const denied = await requirePrivilege()
  if (denied) return { error: denied }

  const result = updateFileStorageSchema.safeParse(body);
  if (!result.success) return { error: z.flattenError(result.error) }

  await prisma.fileStorage.update({ where: { id }, data: result.data });
  updateTag('file-storage')
}

export async function deleteFileStorage(id: string) {
  const denied = await requirePrivilege()
  if (denied) return { error: denied }

  await prisma.fileStorage.delete({ where: { id } })
  updateTag('file-storage')
}
