import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { APIKeyModal } from '@/components/api-key-modal'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const apiKey = {
  id: 'key-1',
  serviceName: 'Stripe',
  apiKeyToken: 'sk_live_existing',
  keyType: 'Production',
  scopePermissions: 'read:payments',
  status: 'ACTIVE',
}

describe('APIKeyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks submit and shows a token-required toast when creating without a token', async () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <APIKeyModal isOpen mode="create" onClose={onClose} onSave={onSave} onRevealToken={vi.fn()} />
    )

    await user.type(screen.getByLabelText(/serviceName/), 'Twilio')
    await user.type(screen.getByLabelText(/scopePermissions/), 'read:sms')
    await user.click(screen.getByRole('button', { name: 'addApiKey' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.tokenRequired')
    })
    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('creates a new api key with valid data and closes the modal', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <APIKeyModal isOpen mode="create" onClose={onClose} onSave={onSave} onRevealToken={vi.fn()} />
    )

    await user.type(screen.getByLabelText(/serviceName/), 'Twilio')
    await user.type(screen.getByLabelText(/apiKeyToken/), 'sk_live_new')
    await user.type(screen.getByLabelText(/scopePermissions/), 'read:sms')
    await user.click(screen.getByRole('button', { name: 'addApiKey' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        serviceName: 'Twilio',
        apiKeyToken: 'sk_live_new',
        scopePermissions: 'read:sms',
      }))
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('shows a required-field validation error and skips onSave when serviceName is empty', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()

    render(
      <APIKeyModal isOpen mode="create" onClose={vi.fn()} onSave={onSave} onRevealToken={vi.fn()} />
    )

    await user.type(screen.getByLabelText(/apiKeyToken/), 'sk_live_new')
    await user.type(screen.getByLabelText(/scopePermissions/), 'read:sms')
    await user.click(screen.getByRole('button', { name: 'addApiKey' }))

    expect(await screen.findByText('Service name is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('populates fields from the existing api key when editing', () => {
    render(
      <APIKeyModal isOpen mode="edit" apiKey={apiKey} onClose={vi.fn()} onSave={vi.fn()} onRevealToken={vi.fn()} />
    )

    expect(screen.getByLabelText(/serviceName/)).toHaveValue('Stripe')
    expect(screen.getByLabelText(/scopePermissions/)).toHaveValue('read:payments')
  })

  it('disables fields and hides the submit button in view mode', () => {
    render(
      <APIKeyModal isOpen mode="view" apiKey={apiKey} onClose={vi.fn()} onSave={vi.fn()} onRevealToken={vi.fn()} />
    )

    expect(screen.getByLabelText(/serviceName/)).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'addApiKey' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument()
  })

  it('reveals the token in view mode on request', async () => {
    const onRevealToken = vi.fn().mockResolvedValue({ token: 'sk_live_revealed' })
    const user = userEvent.setup()

    render(
      <APIKeyModal isOpen mode="view" apiKey={apiKey} onClose={vi.fn()} onSave={vi.fn()} onRevealToken={onRevealToken} />
    )

    await user.click(screen.getByRole('button', { name: /revealToken/ }))

    await waitFor(() => {
      expect(onRevealToken).toHaveBeenCalledWith('key-1')
    })
    expect(await screen.findByText('sk_live_revealed')).toBeInTheDocument()
  })

  it('shows a forbidden toast when revealing the token is rejected', async () => {
    const onRevealToken = vi.fn().mockResolvedValue({ error: 'Forbidden' })
    const user = userEvent.setup()

    render(
      <APIKeyModal isOpen mode="view" apiKey={apiKey} onClose={vi.fn()} onSave={vi.fn()} onRevealToken={onRevealToken} />
    )

    await user.click(screen.getByRole('button', { name: /revealToken/ }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.tokenForbidden')
    })
    expect(screen.queryByText('sk_live_revealed')).not.toBeInTheDocument()
  })
})
