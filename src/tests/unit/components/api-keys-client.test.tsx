import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { APIKeysClient } from '@/app/(dashboard)/resources/api-keys/client'
import type { APIKeyResource } from '@/components/api-keys-data-table'

const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/api-keys-data-table', () => ({
  APIKeysDataTable: ({ data, onEdit, onDelete }: {
    data: APIKeyResource[]
    onEdit?: (apiKey: APIKeyResource) => void
    onDelete?: (id: string, name: string) => void
  }) => (
    <div>
      {data.map((key) => (
        <div key={key.id}>
          <span>{key.serviceName}</span>
          <button onClick={() => onEdit?.(key)}>edit-{key.id}</button>
          <button onClick={() => onDelete?.(key.id, key.serviceName)}>delete-{key.id}</button>
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/components/api-key-modal', () => ({
  APIKeyModal: ({ isOpen, onSave }: { isOpen: boolean; onSave: (data: Partial<APIKeyResource>) => void }) =>
    isOpen ? <button onClick={() => onSave({ serviceName: 'Saved Key' })}>save-modal</button> : null,
}))

const apiKey: Partial<APIKeyResource> = {
  id: 'key-1',
  serviceName: 'My Key',
  keyType: 'production',
  status: 'ACTIVE',
  createdDate: '2026-01-01',
}

describe('APIKeysClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes an api key and shows a success toast', async () => {
    const onDeleteApiKey = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <APIKeysClient
        initialData={[apiKey] as APIKeyResource[]}
        onCreateApiKey={vi.fn()}
        onUpdateApiKey={vi.fn()}
        onDeleteApiKey={onDeleteApiKey}
        onGetApiKeyToken={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'delete-key-1' }))
    await user.click(screen.getByRole('button', { name: 'deleteDialog.confirm' }))

    await waitFor(() => {
      expect(onDeleteApiKey).toHaveBeenCalledWith('key-1')
    })
    expect(toast.success).toHaveBeenCalledWith('success.deleted:{"name":"My Key"}')
    expect(refresh).toHaveBeenCalled()
  })

  it('shows a forbidden error toast and does not refresh when delete is rejected', async () => {
    const onDeleteApiKey = vi.fn().mockResolvedValue({ error: 'Forbidden' })
    const user = userEvent.setup()

    render(
      <APIKeysClient
        initialData={[apiKey] as APIKeyResource[]}
        onCreateApiKey={vi.fn()}
        onUpdateApiKey={vi.fn()}
        onDeleteApiKey={onDeleteApiKey}
        onGetApiKeyToken={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'delete-key-1' }))
    await user.click(screen.getByRole('button', { name: 'deleteDialog.confirm' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.deleteForbidden')
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('shows a generic delete error toast when onDeleteApiKey throws', async () => {
    const onDeleteApiKey = vi.fn().mockRejectedValue(new Error('network down'))
    const user = userEvent.setup()

    render(
      <APIKeysClient
        initialData={[apiKey] as APIKeyResource[]}
        onCreateApiKey={vi.fn()}
        onUpdateApiKey={vi.fn()}
        onDeleteApiKey={onDeleteApiKey}
        onGetApiKeyToken={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'delete-key-1' }))
    await user.click(screen.getByRole('button', { name: 'deleteDialog.confirm' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.deleteError')
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('creates a new api key via the modal and shows a success toast', async () => {
    const onCreateApiKey = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <APIKeysClient
        initialData={[]}
        onCreateApiKey={onCreateApiKey}
        onUpdateApiKey={vi.fn()}
        onDeleteApiKey={vi.fn()}
        onGetApiKeyToken={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /addApiKey/ }))
    await user.click(screen.getByRole('button', { name: 'save-modal' }))

    await waitFor(() => {
      expect(onCreateApiKey).toHaveBeenCalledWith({ serviceName: 'Saved Key' })
    })
    expect(toast.success).toHaveBeenCalledWith('success.added')
    expect(refresh).toHaveBeenCalled()
  })
})
