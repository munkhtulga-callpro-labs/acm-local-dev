import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { isPrivilegedRole } from '@/lib/roles'

const SETTINGS_ID = 'settings'

const generalSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  systemName: z.string().min(1, 'System name is required'),
  timezone: z.string().min(1),
  dateFormat: z.string().min(1),
  language: z.string().min(1),
  autoLogout: z.number().int().min(1),
})

const securitySchema = z.object({
  passwordMinLength: z.number().int().min(6).max(128),
  requireSpecialChars: z.boolean(),
  requireNumbers: z.boolean(),
  requireUppercase: z.boolean(),
  sessionTimeout: z.number().int().min(1),
  twoFactorAuth: z.boolean(),
  ipWhitelist: z.boolean(),
  auditLogging: z.boolean(),
})

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  approvalReminders: z.boolean(),
  expiryWarnings: z.boolean(),
  securityAlerts: z.boolean(),
  systemUpdates: z.boolean(),
  reminderDays: z.number().int().min(1),
})

const systemSchema = z.object({
  maxFileSize: z.number().int().min(1),
  backupFrequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  logRetention: z.number().int().min(1),
  maintenanceMode: z.boolean(),
  debugMode: z.boolean(),
  apiRateLimit: z.number().int().min(1),
})

const sectionSchemas = {
  general: generalSchema,
  security: securitySchema,
  notifications: notificationsSchema,
  system: systemSchema,
} as const

type Section = keyof typeof sectionSchemas

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.systemSettings.findUnique({ where: { id: SETTINGS_ID } })
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: { id: SETTINGS_ID } })
    }

    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isPrivilegedRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') as Section | null

    if (!section || !(section in sectionSchemas)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }

    const body = await request.json()
    const schema = sectionSchemas[section]
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: z.flattenError(result.error as z.ZodError).fieldErrors },
        { status: 400 }
      )
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...result.data },
      update: result.data,
    })

    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
