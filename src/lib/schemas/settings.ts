import { z } from 'zod'

export const generalSettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  systemName: z.string().min(1, 'System name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  dateFormat: z.string().min(1, 'Date format is required'),
  language: z.string().min(1, 'Language is required'),
  autoLogout: z.number().int().min(1, 'Must be at least 1 minute'),
})

export const securitySettingsSchema = z.object({
  passwordMinLength: z.number().int().min(6, 'Minimum 6').max(128, 'Maximum 128'),
  requireSpecialChars: z.boolean(),
  requireNumbers: z.boolean(),
  requireUppercase: z.boolean(),
  sessionTimeout: z.number().int().min(1, 'Must be at least 1 minute'),
  twoFactorAuth: z.boolean(),
  ipWhitelist: z.boolean(),
  auditLogging: z.boolean(),
})

export const notificationsSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  approvalReminders: z.boolean(),
  expiryWarnings: z.boolean(),
  securityAlerts: z.boolean(),
  systemUpdates: z.boolean(),
  reminderDays: z.number().int().min(1, 'Must be at least 1 day'),
})

export const systemSettingsSchema = z.object({
  maxFileSize: z.number().int().min(1, 'Must be at least 1 MB'),
  backupFrequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  logRetention: z.number().int().min(1, 'Must be at least 1 day'),
  maintenanceMode: z.boolean(),
  debugMode: z.boolean(),
  apiRateLimit: z.number().int().min(1, 'Must be at least 1'),
})

export type GeneralSettingsData = z.infer<typeof generalSettingsSchema>
export type SecuritySettingsData = z.infer<typeof securitySettingsSchema>
export type NotificationsSettingsData = z.infer<typeof notificationsSettingsSchema>
export type SystemSettingsData = z.infer<typeof systemSettingsSchema>
