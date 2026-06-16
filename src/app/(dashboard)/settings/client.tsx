'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings, Save, Shield, Bell, Server } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  generalSettingsSchema,
  securitySettingsSchema,
  notificationsSettingsSchema,
  systemSettingsSchema,
  type GeneralSettingsData,
  type SecuritySettingsData,
  type NotificationsSettingsData,
  type SystemSettingsData,
} from '@/lib/schemas/settings'

type InitialSettings = {
  companyName: string
  systemName: string
  timezone: string
  dateFormat: string
  language: string
  autoLogout: number
  passwordMinLength: number
  requireSpecialChars: boolean
  requireNumbers: boolean
  requireUppercase: boolean
  sessionTimeout: number
  twoFactorAuth: boolean
  ipWhitelist: boolean
  auditLogging: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  approvalReminders: boolean
  expiryWarnings: boolean
  securityAlerts: boolean
  systemUpdates: boolean
  reminderDays: number
  maxFileSize: number
  backupFrequency: string
  logRetention: number
  maintenanceMode: boolean
  debugMode: boolean
  apiRateLimit: number
}

type SaveResult = { error: unknown } | undefined

interface SettingsClientProps {
  initialSettings: InitialSettings
  onSave: (section: 'general' | 'security' | 'notifications' | 'system', data: unknown) => Promise<SaveResult>
}

function handleSaveResult(result: SaveResult, router: ReturnType<typeof useRouter>) {
  if (result?.error) {
    if (typeof result.error === 'string') {
      toast.error(result.error === 'Forbidden'
        ? "You don't have permission to change settings"
        : 'Session expired, please log in again')
    } else {
      toast.error('Please fix the form errors and try again')
    }
    return false
  }
  toast.success('Settings saved successfully')
  router.refresh()
  return true
}

export function SettingsClient({ initialSettings, onSave }: SettingsClientProps) {
  const router = useRouter()

  const generalForm = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: initialSettings.companyName,
      systemName: initialSettings.systemName,
      timezone: initialSettings.timezone,
      dateFormat: initialSettings.dateFormat,
      language: initialSettings.language,
      autoLogout: initialSettings.autoLogout,
    },
  })

  const securityForm = useForm<SecuritySettingsData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      passwordMinLength: initialSettings.passwordMinLength,
      requireSpecialChars: initialSettings.requireSpecialChars,
      requireNumbers: initialSettings.requireNumbers,
      requireUppercase: initialSettings.requireUppercase,
      sessionTimeout: initialSettings.sessionTimeout,
      twoFactorAuth: initialSettings.twoFactorAuth,
      ipWhitelist: initialSettings.ipWhitelist,
      auditLogging: initialSettings.auditLogging,
    },
  })

  const notificationsForm = useForm<NotificationsSettingsData>({
    resolver: zodResolver(notificationsSettingsSchema),
    defaultValues: {
      emailNotifications: initialSettings.emailNotifications,
      smsNotifications: initialSettings.smsNotifications,
      approvalReminders: initialSettings.approvalReminders,
      expiryWarnings: initialSettings.expiryWarnings,
      securityAlerts: initialSettings.securityAlerts,
      systemUpdates: initialSettings.systemUpdates,
      reminderDays: initialSettings.reminderDays,
    },
  })

  const systemForm = useForm<SystemSettingsData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      maxFileSize: initialSettings.maxFileSize,
      backupFrequency: initialSettings.backupFrequency as SystemSettingsData['backupFrequency'],
      logRetention: initialSettings.logRetention,
      maintenanceMode: initialSettings.maintenanceMode,
      debugMode: initialSettings.debugMode,
      apiRateLimit: initialSettings.apiRateLimit,
    },
  })

  const onSubmitGeneral = generalForm.handleSubmit(async (data) => {
    handleSaveResult(await onSave('general', data), router)
  })

  const onSubmitSecurity = securityForm.handleSubmit(async (data) => {
    handleSaveResult(await onSave('security', data), router)
  })

  const onSubmitNotifications = notificationsForm.handleSubmit(async (data) => {
    handleSaveResult(await onSave('notifications', data), router)
  })

  const onSubmitSystem = systemForm.handleSubmit(async (data) => {
    handleSaveResult(await onSave('system', data), router)
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Configure system preferences and security settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Configure basic system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitGeneral} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" {...generalForm.register('companyName')} />
                    {generalForm.formState.errors.companyName && (
                      <p className="text-sm text-destructive">{generalForm.formState.errors.companyName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemName">System Name</Label>
                    <Input id="systemName" {...generalForm.register('systemName')} />
                    {generalForm.formState.errors.systemName && (
                      <p className="text-sm text-destructive">{generalForm.formState.errors.systemName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Controller
                      control={generalForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Ulaanbaatar">Asia/Ulaanbaatar (Mongolia)</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Controller
                      control={generalForm.control}
                      name="language"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="mn">Монгол</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="autoLogout">Auto Logout (minutes)</Label>
                    <Input id="autoLogout" type="number" {...generalForm.register('autoLogout', { valueAsNumber: true })} />
                    {generalForm.formState.errors.autoLogout && (
                      <p className="text-sm text-destructive">{generalForm.formState.errors.autoLogout.message}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={generalForm.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {generalForm.formState.isSubmitting ? 'Saving...' : 'Save General Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure password policies and security features</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitSecurity} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input id="passwordMinLength" type="number" {...securityForm.register('passwordMinLength', { valueAsNumber: true })} />
                    {securityForm.formState.errors.passwordMinLength && (
                      <p className="text-sm text-destructive">{securityForm.formState.errors.passwordMinLength.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" {...securityForm.register('sessionTimeout', { valueAsNumber: true })} />
                    {securityForm.formState.errors.sessionTimeout && (
                      <p className="text-sm text-destructive">{securityForm.formState.errors.sessionTimeout.message}</p>
                    )}
                  </div>
                  {([
                    ['requireSpecialChars', 'Require Special Characters', 'Passwords must contain special characters'],
                    ['requireNumbers', 'Require Numbers', 'Passwords must contain numbers'],
                    ['requireUppercase', 'Require Uppercase', 'Passwords must contain uppercase letters'],
                    ['twoFactorAuth', 'Two-Factor Authentication', 'Enable 2FA for all users'],
                    ['ipWhitelist', 'IP Whitelist', 'Restrict access to specific IP addresses'],
                    ['auditLogging', 'Audit Logging', 'Log all system activities for compliance'],
                  ] as const).map(([name, label, desc]) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{label}</Label>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                      <Controller
                        control={securityForm.control}
                        name={name}
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>
                  ))}
                </div>
                <Button type="submit" disabled={securityForm.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {securityForm.formState.isSubmitting ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure email and notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitNotifications} className="space-y-6">
                <div className="space-y-4">
                  {([
                    ['emailNotifications', 'Email Notifications', 'Send notifications via email'],
                    ['smsNotifications', 'SMS Notifications', 'Send notifications via SMS'],
                    ['approvalReminders', 'Approval Reminders', 'Send reminders for pending approvals'],
                    ['expiryWarnings', 'Expiry Warnings', 'Notify before access expires'],
                    ['securityAlerts', 'Security Alerts', 'Send alerts for security events'],
                    ['systemUpdates', 'System Updates', 'Notify about system updates'],
                  ] as const).map(([name, label, desc]) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{label}</Label>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                      <Controller
                        control={notificationsForm.control}
                        name={name}
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Label htmlFor="reminderDays">Reminder Days Before Expiry</Label>
                    <Input id="reminderDays" type="number" {...notificationsForm.register('reminderDays', { valueAsNumber: true })} />
                    {notificationsForm.formState.errors.reminderDays && (
                      <p className="text-sm text-destructive">{notificationsForm.formState.errors.reminderDays.message}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={notificationsForm.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {notificationsForm.formState.isSubmitting ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>Configure system performance and maintenance settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitSystem} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                    <Input id="maxFileSize" type="number" {...systemForm.register('maxFileSize', { valueAsNumber: true })} />
                    {systemForm.formState.errors.maxFileSize && (
                      <p className="text-sm text-destructive">{systemForm.formState.errors.maxFileSize.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Backup Frequency</Label>
                    <Controller
                      control={systemForm.control}
                      name="backupFrequency"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logRetention">Log Retention (days)</Label>
                    <Input id="logRetention" type="number" {...systemForm.register('logRetention', { valueAsNumber: true })} />
                    {systemForm.formState.errors.logRetention && (
                      <p className="text-sm text-destructive">{systemForm.formState.errors.logRetention.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                    <Input id="apiRateLimit" type="number" {...systemForm.register('apiRateLimit', { valueAsNumber: true })} />
                    {systemForm.formState.errors.apiRateLimit && (
                      <p className="text-sm text-destructive">{systemForm.formState.errors.apiRateLimit.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  {([
                    ['maintenanceMode', 'Maintenance Mode', 'Put system in maintenance mode'],
                    ['debugMode', 'Debug Mode', 'Enable debug logging'],
                  ] as const).map(([name, label, desc]) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{label}</Label>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                      <Controller
                        control={systemForm.control}
                        name={name}
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>
                  ))}
                </div>
                <Button type="submit" disabled={systemForm.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {systemForm.formState.isSubmitting ? 'Saving...' : 'Save System Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
