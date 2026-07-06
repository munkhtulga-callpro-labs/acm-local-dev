import { describe, it, expect, vi, afterEach } from 'vitest'

const nextAuthMock = vi.hoisted(() => ({ getServerSession: vi.fn() }))
vi.mock('next-auth', () => ({ getServerSession: nextAuthMock.getServerSession }))

import { prisma } from '@/lib/prisma'
import { updateSettings } from '@/lib/actions/settings'

function mockSession(role: string) {
  nextAuthMock.getServerSession.mockResolvedValue({ user: { id: 'user-1', role } })
}

const sectionPayloads = {
  general: {
    companyName: 'Integration Test Co',
    systemName: 'Integration ACM',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    language: 'en',
    autoLogout: 45,
  },
  security: {
    passwordMinLength: 14,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: false,
    sessionTimeout: 90,
    twoFactorAuth: true,
    ipWhitelist: true,
    auditLogging: true,
  },
  notifications: {
    emailNotifications: false,
    smsNotifications: true,
    approvalReminders: false,
    expiryWarnings: true,
    securityAlerts: true,
    systemUpdates: true,
    reminderDays: 3,
  },
  system: {
    maxFileSize: 25,
    backupFrequency: 'weekly',
    logRetention: 180,
    maintenanceMode: true,
    debugMode: true,
    apiRateLimit: 500,
  },
} as const

describe('updateSettings action (real Postgres)', () => {
  afterEach(async () => {
    nextAuthMock.getServerSession.mockReset()
    await prisma.systemSettings.deleteMany({ where: { id: 'settings' } })
  })

  it('returns Unauthorized with no session and writes no row', async () => {
    nextAuthMock.getServerSession.mockResolvedValue(null)
    const result = await updateSettings('general', sectionPayloads.general)
    expect(result).toEqual({ error: 'Unauthorized' })
    expect(await prisma.systemSettings.findUnique({ where: { id: 'settings' } })).toBeNull()
  })

  it('returns Forbidden for a non-privileged role and writes no row', async () => {
    mockSession('EMPLOYEE')
    const result = await updateSettings('general', sectionPayloads.general)
    expect(result).toEqual({ error: 'Forbidden' })
    expect(await prisma.systemSettings.findUnique({ where: { id: 'settings' } })).toBeNull()
  })

  it('returns a validation error for an invalid section payload and writes no row', async () => {
    mockSession('ADMIN')
    const result = await updateSettings('security', { passwordMinLength: 3 })
    expect(result).toHaveProperty('error')
    expect(await prisma.systemSettings.findUnique({ where: { id: 'settings' } })).toBeNull()
  })

  it('creates the singleton row on first write, applying schema defaults to untouched sections', async () => {
    mockSession('ADMIN')
    const result = await updateSettings('general', sectionPayloads.general)
    expect(result).toBeUndefined()

    const row = await prisma.systemSettings.findUnique({ where: { id: 'settings' } })
    expect(row).not.toBeNull()
    expect(row?.companyName).toBe('Integration Test Co')
    expect(row?.autoLogout).toBe(45)
    // untouched sections should still carry their schema defaults
    expect(row?.passwordMinLength).toBe(8)
    expect(row?.emailNotifications).toBe(true)
    expect(row?.backupFrequency).toBe('daily')
  })

  it('updates only the targeted section on subsequent writes, leaving other sections intact', async () => {
    mockSession('ADMIN')
    await updateSettings('general', sectionPayloads.general)
    await updateSettings('security', sectionPayloads.security)

    const row = await prisma.systemSettings.findUnique({ where: { id: 'settings' } })
    expect(row?.passwordMinLength).toBe(14)
    expect(row?.twoFactorAuth).toBe(true)
    // general section written earlier must still be intact
    expect(row?.companyName).toBe('Integration Test Co')
    expect(row?.autoLogout).toBe(45)
    // sections never written should still be at their defaults
    expect(row?.emailNotifications).toBe(true)
    expect(row?.maxFileSize).toBe(10)
  })

  it('accumulates writes across all four sections into a single row', async () => {
    mockSession('IT_STAFF')
    for (const [section, payload] of Object.entries(sectionPayloads)) {
      const result = await updateSettings(section as keyof typeof sectionPayloads, payload as any)
      expect(result).toBeUndefined()
    }

    const rows = await prisma.systemSettings.findMany()
    expect(rows).toHaveLength(1)

    const row = rows[0]
    expect(row.companyName).toBe(sectionPayloads.general.companyName)
    expect(row.passwordMinLength).toBe(sectionPayloads.security.passwordMinLength)
    expect(row.reminderDays).toBe(sectionPayloads.notifications.reminderDays)
    expect(row.backupFrequency).toBe(sectionPayloads.system.backupFrequency)
  })
})
