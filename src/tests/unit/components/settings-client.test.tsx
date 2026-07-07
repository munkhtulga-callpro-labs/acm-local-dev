import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { SettingsClient } from '@/app/(dashboard)/settings/client'

const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const initialSettings = {
  companyName: 'CallPro',
  systemName: 'ACM',
  timezone: 'UTC',
  dateFormat: 'yyyy-MM-dd',
  language: 'en',
  autoLogout: 30,
  passwordMinLength: 8,
  requireSpecialChars: false,
  requireNumbers: false,
  requireUppercase: false,
  sessionTimeout: 60,
  twoFactorAuth: false,
  ipWhitelist: false,
  auditLogging: false,
  emailNotifications: false,
  smsNotifications: false,
  approvalReminders: false,
  expiryWarnings: false,
  securityAlerts: false,
  systemUpdates: false,
  reminderDays: 7,
  maxFileSize: 10,
  backupFrequency: 'daily',
  logRetention: 30,
  maintenanceMode: false,
  debugMode: false,
  apiRateLimit: 100,
}

describe('SettingsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits the general settings form and shows a success toast', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<SettingsClient initialSettings={initialSettings} onSave={onSave} />)

    const companyNameInput = screen.getByLabelText('general.companyName')
    await user.clear(companyNameInput)
    await user.type(companyNameInput, 'New Company')
    await user.click(screen.getByRole('button', { name: 'general.save' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('general', expect.objectContaining({ companyName: 'New Company' }))
    })
    expect(toast.success).toHaveBeenCalledWith('success')
    expect(refresh).toHaveBeenCalled()
  })

  it('shows a forbidden error toast without refreshing when the save is rejected', async () => {
    const onSave = vi.fn().mockResolvedValue({ error: 'Forbidden' })
    const user = userEvent.setup()

    render(<SettingsClient initialSettings={initialSettings} onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: 'general.save' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.forbidden')
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('shows a session expired error toast for a non-forbidden error', async () => {
    const onSave = vi.fn().mockResolvedValue({ error: 'SomethingElse' });
    const user = userEvent.setup()

    render(<SettingsClient initialSettings={initialSettings} onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: 'general.save' }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.sessionExpired')
    })
    expect(refresh).not.toHaveBeenCalledWith()
  })

  it('shows a form error toast when onsave returns a non-string error', async () => {
    const onSave = vi.fn().mockResolvedValue({ error: { companyName: ['bad'] } })
    const user = userEvent.setup()

    render(<SettingsClient initialSettings={initialSettings} onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: 'general.save' }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.formErrors')
    })
  })

  it('includes the selected timezone in the general form payload', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<SettingsClient initialSettings={initialSettings} onSave={onSave} />)

    await user.click(screen.getAllByRole('combobox')[0])
    await user.click(screen.getByRole('option', { name: 'UTC' }))
    await user.click(screen.getByRole('button', { name: 'general.save' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('general', expect.objectContaining({ timezone: 'UTC' }))
    })
  })

  it('disables the submit button and shows the saving label while onSave is pending', async () => {
    let resolveSave: (value: undefined) => void = () => {}
    const onSave = vi.fn(() => new Promise<undefined>((resolve) => { resolveSave = resolve }))
    const user = userEvent.setup()

    render(<SettingsClient initialSettings={initialSettings} onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: 'general.save' }))

    const savingButton = await screen.findByRole('button', { name: 'saving' })
    expect(savingButton).toBeDisabled()

    resolveSave(undefined)
    expect(await screen.findByRole('button', { name: 'general.save' })).not.toBeDisabled()
  })

  it('shows a validation error and skips onSave when companyName is cleared', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<SettingsClient initialSettings={initialSettings} onSave={onSave} />)

    await user.clear(screen.getByLabelText('general.companyName'))
    await user.click(screen.getByRole('button', { name: 'general.save' }))

    expect(await screen.findByText('Company name is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('submits the security settings form with a toggled switch', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<SettingsClient initialSettings={initialSettings} onSave={onSave} />)

    await user.click(screen.getByRole('tab', { name: 'tabs.security' }))
    await user.click(screen.getAllByRole('switch')[3])
    await user.click(screen.getByRole('button', { name: 'security.save' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('security', expect.objectContaining({ twoFactorAuth: true }))
    })
    expect(toast.success).toHaveBeenCalledWith('success')
  })

  it('submits the notifications settings form with a toggled switch', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<SettingsClient initialSettings={initialSettings} onSave={onSave} />)

    await user.click(screen.getByRole('tab', { name: 'tabs.notifications' }))
    await user.click(screen.getAllByRole('switch')[3])
    await user.click(screen.getByRole('button', { name: 'notifications.save' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('notifications', expect.objectContaining({ expiryWarnings: true }))
    })
    expect(toast.success).toHaveBeenCalledWith('success')
  })

  it('submits the system settings form with a toggled switch', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<SettingsClient initialSettings={initialSettings} onSave={onSave} />)

    await user.click(screen.getByRole('tab', { name: 'tabs.system' }))
    await user.click(screen.getAllByRole('switch')[0])
    await user.click(screen.getByRole('button', { name: 'system.save' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('system', expect.objectContaining({ maintenanceMode: true }))
    })
    expect(toast.success).toHaveBeenCalledWith('success')
  })
})
