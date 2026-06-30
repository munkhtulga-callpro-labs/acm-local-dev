import { describe, it, expect } from 'vitest'
import {
  generalSettingsSchema,
  securitySettingsSchema,
  notificationsSettingsSchema,
  systemSettingsSchema,
} from '@/lib/schemas/settings'

describe('generalSettingsSchema', () => {
  const valid = {
    companyName: 'Acme Corp',
    systemName: 'ACM',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    language: 'en',
    autoLogout: 30,
  }

  it('accepts a valid payload', () => {
    expect(() => generalSettingsSchema.parse(valid)).not.toThrow()
  })

  it('rejects missing companyName', () => {
    expect(() => generalSettingsSchema.parse({ ...valid, companyName: '' })).toThrow()
  })

  it('rejects autoLogout of 0', () => {
    expect(() => generalSettingsSchema.parse({ ...valid, autoLogout: 0 })).toThrow()
  })

  it('rejects non-integer autoLogout', () => {
    expect(() => generalSettingsSchema.parse({ ...valid, autoLogout: 1.5 })).toThrow()
  })

  it('accepts autoLogout of 1 (minimum)', () => {
    expect(() => generalSettingsSchema.parse({ ...valid, autoLogout: 1 })).not.toThrow()
  })
})

describe('securitySettingsSchema', () => {
  const valid = {
    passwordMinLength: 12,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    sessionTimeout: 60,
    twoFactorAuth: false,
    ipWhitelist: false,
    auditLogging: true,
  }

  it('accepts a valid payload', () => {
    expect(() => securitySettingsSchema.parse(valid)).not.toThrow()
  })

  it('rejects passwordMinLength below 6', () => {
    expect(() => securitySettingsSchema.parse({ ...valid, passwordMinLength: 5 })).toThrow()
  })

  it('rejects passwordMinLength above 128', () => {
    expect(() => securitySettingsSchema.parse({ ...valid, passwordMinLength: 129 })).toThrow()
  })

  it('accepts passwordMinLength at boundaries (6 and 128)', () => {
    expect(() => securitySettingsSchema.parse({ ...valid, passwordMinLength: 6 })).not.toThrow()
    expect(() => securitySettingsSchema.parse({ ...valid, passwordMinLength: 128 })).not.toThrow()
  })

  it('rejects sessionTimeout of 0', () => {
    expect(() => securitySettingsSchema.parse({ ...valid, sessionTimeout: 0 })).toThrow()
  })
})

describe('notificationsSettingsSchema', () => {
  const valid = {
    emailNotifications: true,
    smsNotifications: false,
    approvalReminders: true,
    expiryWarnings: true,
    securityAlerts: true,
    systemUpdates: false,
    reminderDays: 7,
  }

  it('accepts a valid payload', () => {
    expect(() => notificationsSettingsSchema.parse(valid)).not.toThrow()
  })

  it('rejects reminderDays of 0', () => {
    expect(() => notificationsSettingsSchema.parse({ ...valid, reminderDays: 0 })).toThrow()
  })

  it('rejects non-integer reminderDays', () => {
    expect(() => notificationsSettingsSchema.parse({ ...valid, reminderDays: 1.5 })).toThrow()
  })

  it('accepts reminderDays of 1 (minimum)', () => {
    expect(() => notificationsSettingsSchema.parse({ ...valid, reminderDays: 1 })).not.toThrow()
  })
})

describe('systemSettingsSchema', () => {
  const valid = {
    maxFileSize: 10,
    backupFrequency: 'daily' as const,
    logRetention: 90,
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: 1000,
  }

  it('accepts a valid payload', () => {
    expect(() => systemSettingsSchema.parse(valid)).not.toThrow()
  })

  it('rejects maxFileSize of 0', () => {
    expect(() => systemSettingsSchema.parse({ ...valid, maxFileSize: 0 })).toThrow()
  })

  it('rejects logRetention of 0', () => {
    expect(() => systemSettingsSchema.parse({ ...valid, logRetention: 0 })).toThrow()
  })

  it('rejects apiRateLimit of 0', () => {
    expect(() => systemSettingsSchema.parse({ ...valid, apiRateLimit: 0 })).toThrow()
  })

  const frequencies = ['hourly', 'daily', 'weekly', 'monthly'] as const
  it.each(frequencies)('accepts backupFrequency %s', (backupFrequency) => {
    expect(() => systemSettingsSchema.parse({ ...valid, backupFrequency })).not.toThrow()
  })

  it('rejects unknown backupFrequency', () => {
    expect(() => systemSettingsSchema.parse({ ...valid, backupFrequency: 'yearly' })).toThrow()
  })
})
