'use server'

import z from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth'
import { prisma } from '../prisma'
import { isPrivilegedRole } from '../roles'
import {
  generalSettingsSchema,
  securitySettingsSchema,
  notificationsSettingsSchema,
  systemSettingsSchema,
} from '../schemas/settings'

const SETTINGS_ID = 'settings'

async function requirePrivilege() {
  const session = await getServerSession(authOptions)
  if (!session) return 'Unauthorized' as const
  if (!isPrivilegedRole(session.user.role)) return 'Forbidden' as const
  return null
}

const sectionSchemas = {
  general: generalSettingsSchema,
  security: securitySettingsSchema,
  notifications: notificationsSettingsSchema,
  system: systemSettingsSchema,
} as const

type Section = keyof typeof sectionSchemas

export async function updateSettings(section: Section, data: unknown) {
  const denied = await requirePrivilege()
  if (denied) return { error: denied }

  const result = sectionSchemas[section].safeParse(data)
  if (!result.success) return { error: z.flattenError(result.error as z.ZodError) }

  await prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...result.data },
    update: result.data,
  })
}
