'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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

const SECURITY_TOGGLES = [
  'requireSpecialChars',
  'requireNumbers',
  'requireUppercase',
  'twoFactorAuth',
  'ipWhitelist',
  'auditLogging',
] as const

const NOTIFICATION_TOGGLES = [
  'emailNotifications',
  'smsNotifications',
  'approvalReminders',
  'expiryWarnings',
  'securityAlerts',
  'systemUpdates',
] as const

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

type TFunc = ReturnType<typeof useTranslations<'settings'>>

interface SettingsClientProps {
  initialSettings: InitialSettings
  onSave: (section: 'general' | 'security' | 'notifications' | 'system', data: unknown) => Promise<SaveResult>
}

function handleSaveResult(result: SaveResult, router: ReturnType<typeof useRouter>, t: TFunc) {
  if (result?.error) {
    if (typeof result.error === 'string') {
      toast.error(result.error === 'Forbidden'
        ? t('errors.forbidden')
        : t('errors.sessionExpired'))
    } else {
      toast.error(t('errors.formErrors'))
    }
    return false
  }
  toast.success(t('success'))
  router.refresh()
  return true
}

export function SettingsClient({ initialSettings, onSave }: SettingsClientProps) {
  const t = useTranslations('settings')
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
    handleSaveResult(await onSave('general', data), router, t)
  })

  const onSubmitSecurity = securityForm.handleSubmit(async (data) => {
    handleSaveResult(await onSave('security', data), router, t)
  })

  const onSubmitNotifications = notificationsForm.handleSubmit(async (data) => {
    handleSaveResult(await onSave('notifications', data), router, t)
  })

  const onSubmitSystem = systemForm.handleSubmit(async (data) => {
    handleSaveResult(await onSave('system', data), router, t)
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('tabs.general')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('tabs.security')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            {t('tabs.system')}
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('general.title')}
              </CardTitle>
              <CardDescription>{t('general.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitGeneral} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">{t('general.companyName')}</Label>
                    <Input id="companyName" {...generalForm.register('companyName')} />
                    {generalForm.formState.errors.companyName && (
                      <p className="text-sm text-destructive">{generalForm.formState.errors.companyName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemName">{t('general.systemName')}</Label>
                    <Input id="systemName" {...generalForm.register('systemName')} />
                    {generalForm.formState.errors.systemName && (
                      <p className="text-sm text-destructive">{generalForm.formState.errors.systemName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('general.timezone')}</Label>
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
                    <Label>{t('general.language')}</Label>
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
                    <Label htmlFor="autoLogout">{t('general.autoLogout')}</Label>
                    <Input id="autoLogout" type="number" {...generalForm.register('autoLogout', { valueAsNumber: true })} />
                    {generalForm.formState.errors.autoLogout && (
                      <p className="text-sm text-destructive">{generalForm.formState.errors.autoLogout.message}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={generalForm.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {generalForm.formState.isSubmitting ? t('saving') : t('general.save')}
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
                {t('security.title')}
              </CardTitle>
              <CardDescription>{t('security.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitSecurity} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">{t('security.passwordMinLength')}</Label>
                    <Input id="passwordMinLength" type="number" {...securityForm.register('passwordMinLength', { valueAsNumber: true })} />
                    {securityForm.formState.errors.passwordMinLength && (
                      <p className="text-sm text-destructive">{securityForm.formState.errors.passwordMinLength.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">{t('security.sessionTimeout')}</Label>
                    <Input id="sessionTimeout" type="number" {...securityForm.register('sessionTimeout', { valueAsNumber: true })} />
                    {securityForm.formState.errors.sessionTimeout && (
                      <p className="text-sm text-destructive">{securityForm.formState.errors.sessionTimeout.message}</p>
                    )}
                  </div>
                  {SECURITY_TOGGLES.map((name) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t(`security.toggles.${name}.label`)}</Label>
                        <p className="text-sm text-muted-foreground">{t(`security.toggles.${name}.desc`)}</p>
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
                  {securityForm.formState.isSubmitting ? t('saving') : t('security.save')}
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
                {t('notifications.title')}
              </CardTitle>
              <CardDescription>{t('notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitNotifications} className="space-y-6">
                <div className="space-y-4">
                  {NOTIFICATION_TOGGLES.map((name) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t(`notifications.toggles.${name}.label`)}</Label>
                        <p className="text-sm text-muted-foreground">{t(`notifications.toggles.${name}.desc`)}</p>
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
                    <Label htmlFor="reminderDays">{t('notifications.reminderDays')}</Label>
                    <Input id="reminderDays" type="number" {...notificationsForm.register('reminderDays', { valueAsNumber: true })} />
                    {notificationsForm.formState.errors.reminderDays && (
                      <p className="text-sm text-destructive">{notificationsForm.formState.errors.reminderDays.message}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={notificationsForm.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {notificationsForm.formState.isSubmitting ? t('saving') : t('notifications.save')}
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
                {t('system.title')}
              </CardTitle>
              <CardDescription>{t('system.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitSystem} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">{t('system.maxFileSize')}</Label>
                    <Input id="maxFileSize" type="number" {...systemForm.register('maxFileSize', { valueAsNumber: true })} />
                    {systemForm.formState.errors.maxFileSize && (
                      <p className="text-sm text-destructive">{systemForm.formState.errors.maxFileSize.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('system.backupFrequency')}</Label>
                    <Controller
                      control={systemForm.control}
                      name="backupFrequency"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">{t('system.backupOptions.hourly')}</SelectItem>
                            <SelectItem value="daily">{t('system.backupOptions.daily')}</SelectItem>
                            <SelectItem value="weekly">{t('system.backupOptions.weekly')}</SelectItem>
                            <SelectItem value="monthly">{t('system.backupOptions.monthly')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logRetention">{t('system.logRetention')}</Label>
                    <Input id="logRetention" type="number" {...systemForm.register('logRetention', { valueAsNumber: true })} />
                    {systemForm.formState.errors.logRetention && (
                      <p className="text-sm text-destructive">{systemForm.formState.errors.logRetention.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiRateLimit">{t('system.apiRateLimit')}</Label>
                    <Input id="apiRateLimit" type="number" {...systemForm.register('apiRateLimit', { valueAsNumber: true })} />
                    {systemForm.formState.errors.apiRateLimit && (
                      <p className="text-sm text-destructive">{systemForm.formState.errors.apiRateLimit.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  {(['maintenanceMode', 'debugMode'] as const).map((name) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t(`system.toggles.${name}.label`)}</Label>
                        <p className="text-sm text-muted-foreground">{t(`system.toggles.${name}.desc`)}</p>
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
                  {systemForm.formState.isSubmitting ? t('saving') : t('system.save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
