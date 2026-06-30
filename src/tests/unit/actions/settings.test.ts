import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSettings: { upsert: vi.fn() },
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { updateSettings } from '@/lib/actions/settings'

const mockSession = (role: string) =>
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: 'user-1', role },
  } as any)

beforeEach(() => vi.clearAllMocks())

const sectionPayloads = {
  general: {
    companyName: 'Acme',
    systemName: 'ACM',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    language: 'en',
    autoLogout: 30,
  },
  security: {
    passwordMinLength: 12,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    sessionTimeout: 60,
    twoFactorAuth: false,
    ipWhitelist: false,
    auditLogging: true,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    approvalReminders: true,
    expiryWarnings: true,
    securityAlerts: true,
    systemUpdates: false,
    reminderDays: 7,
  },
  system: {
    maxFileSize: 10,
    backupFrequency: 'daily',
    logRetention: 90,
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: 1000,
  },
} as const

describe('updateSettings — auth', () => {
  it('returns Unauthorized with no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await updateSettings('general', sectionPayloads.general)).toEqual({ error: 'Unauthorized' })
  })

  it('returns Forbidden for EMPLOYEE', async () => {
    mockSession('EMPLOYEE')
    expect(await updateSettings('general', sectionPayloads.general)).toEqual({ error: 'Forbidden' })
  })

  it('returns Forbidden for HR_MANAGER', async () => {
    mockSession('HR_MANAGER')
    expect(await updateSettings('general', sectionPayloads.general)).toEqual({ error: 'Forbidden' })
  })

  it('returns Forbidden for DEPARTMENT_MANAGER', async () => {
    mockSession('DEPARTMENT_MANAGER')
    expect(await updateSettings('general', sectionPayloads.general)).toEqual({ error: 'Forbidden' })
  })
})

describe('updateSettings — validation', () => {
  it('returns validation error for invalid general payload', async () => {
    mockSession('ADMIN')
    const result = await updateSettings('general', { autoLogout: 0 })
    expect(result).toHaveProperty('error')
    expect(result!.error).not.toBe('Unauthorized')
  })

  it('returns validation error for invalid security payload', async () => {
    mockSession('ADMIN')
    const result = await updateSettings('security', { passwordMinLength: 3 })
    expect(result).toHaveProperty('error')
  })

  it('returns validation error for invalid notifications payload', async () => {
    mockSession('IT_STAFF')
    const result = await updateSettings('notifications', { reminderDays: 0 })
    expect(result).toHaveProperty('error')
  })

  it('returns validation error for invalid system payload', async () => {
    mockSession('ADMIN')
    const result = await updateSettings('system', { backupFrequency: 'yearly' })
    expect(result).toHaveProperty('error')
  })
})

describe('updateSettings — success (all sections)', () => {
  it.each(Object.keys(sectionPayloads) as Array<keyof typeof sectionPayloads>)(
    'upserts %s settings',
    async (section) => {
      mockSession('ADMIN')
      vi.mocked(prisma.systemSettings.upsert).mockResolvedValue({} as any)
      const result = await updateSettings(section, sectionPayloads[section])
      expect(result).toBeUndefined()
      expect(prisma.systemSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'settings' } })
      )
    }
  )

  it('accepts IT_STAFF role', async () => {
    mockSession('IT_STAFF')
    vi.mocked(prisma.systemSettings.upsert).mockResolvedValue({} as any)
    const result = await updateSettings('general', sectionPayloads.general)
    expect(result).toBeUndefined()
  })
})
