import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FileStorageModal } from '@/components/file-storage-modal'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const fileStorage = {
  id: 'fs-1',
  storageType: 'S3',
  pathLocation: '/data/bucket',
  permissionLevel: 'Write',
  status: 'ACTIVE',
}

describe('FileStorageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves a new record with valid data and closes the modal', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <FileStorageModal isOpen mode="create" onClose={onClose} onSave={onSave} />
    )

    await user.type(screen.getByLabelText(/pathLocation/), '/mnt/new-share')
    await user.click(screen.getByRole('button', { name: 'addStorage' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ pathLocation: '/mnt/new-share' }))
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('keeps the modal open when onSave resolves false', async () => {
    const onSave = vi.fn().mockResolvedValue(false)
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <FileStorageModal isOpen mode="create" onClose={onClose} onSave={onSave} />
    )

    await user.type(screen.getByLabelText(/pathLocation/), '/mnt/new-share')
    await user.click(screen.getByRole('button', { name: 'addStorage' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows a required-field validation error and skips onSave when pathLocation is empty', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()

    render(
      <FileStorageModal isOpen mode="create" onClose={vi.fn()} onSave={onSave} />
    )

    await user.click(screen.getByRole('button', { name: 'addStorage' }))

    expect(await screen.findByText('Path / location is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('populates fields from the existing record when editing', () => {
    render(
      <FileStorageModal isOpen mode="edit" fileStorage={fileStorage} onClose={vi.fn()} onSave={vi.fn()} />
    )

    expect(screen.getByLabelText(/pathLocation/)).toHaveValue('/data/bucket')
  })

  it('disables fields and hides the submit button in view mode', () => {
    render(
      <FileStorageModal isOpen mode="view" fileStorage={fileStorage} onClose={vi.fn()} onSave={vi.fn()} />
    )

    expect(screen.getByLabelText(/pathLocation/)).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'addStorage' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument()
  })
})
