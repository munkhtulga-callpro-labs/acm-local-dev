'use server'

import z from "zod";
import { createApiKeySchema, updateApiKeySchema } from "../schemas/api-key"
import { prisma } from "../prisma";
import { updateTag } from "next/cache";

export async function createApiKey(body: unknown) {
  const result = createApiKeySchema.safeParse(body);
  if (!result.success) return { error: z.flattenError(result.error) }
  
  await prisma.aPIKey.create({ data: result.data })
  updateTag('api-keys')
}

export async function updateApiKey(id: string, body: unknown) {
  const result = updateApiKeySchema.safeParse(body);

  if (!result.success) return { error: z.flattenError(result.error) }

  const { apiKeyToken, ...rest } = result.data;

  await prisma.aPIKey.update({ where: { id }, data: apiKeyToken ? { ...rest, apiKeyToken } : rest });
  updateTag('api-keys')
}

export async function deleteApiKey(id: string) {
  await prisma.aPIKey.delete({ where: { id } });
  updateTag('api-keys')
}
