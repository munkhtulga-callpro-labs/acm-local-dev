import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { FileStorageClient } from '@/app/(dashboard)/resources/file-storage/client'
import { createFileStorage, deleteFileStorage } from '@/lib/actions/file-storage'
import type { FileStorageResource } from '@/components/file-storage-data-table'
import type { FileStorageFormData } from '@/lib/schemas/file-storage'

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

vi.mock('@/lib/actions/file-storage', () => ({
  createFileStorage: vi.fn(),
  updateFileStorage: vi.fn(),
  deleteFileStorage: vi.fn(),
}))

vi.mock('@/components/file-storage-data-table', () => ({
  FileStorageDataTable: ({ data, onEdit, onDelete }: {
    data: FileStorageResource[]
    onEdit?: (item: FileStorageResource) => void
    onDelete?: (id: string, name: string) => void
  }) => (
    <div>
      {data.map((item) => (
        <div key={item.id}>
          <span>{item.pathLocation}</span>
          <button onClick={() => onEdit?.(item)}>edit-{item.id}</button>
          <button onClick={() => onDelete?.(item.id!, item.pathLocation)}>delete-{item.id}</button>
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/components/file-storage-modal', () => ({
  FileStorageModal: ({ isOpen, onSave }: { isOpen: boolean; onSave: (data: FileStorageFormData) => Promise<boolean> }) =>
    isOpen ? <button onClick={() => onSave({ storageType: 'Network Share', pathLocation: '/new', permissionLevel: 'Read', status: 'ACTIVE' })}>save-modal</button> : null,
}))

const fileStorage: Partial<FileStorageResource> = {
  id: 'fs-1',
  storageType: 'Network Share',
  pathLocation: '/data/share',
  permissionLevel: 'Read',
  status: 'ACTIVE',
}

describe('FileStorageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a file storage record and shows a success toast', async () => {
    vi.mocked(deleteFileStorage).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<FileStorageClient initialData={[fileStorage] as FileStorageResource[]} />)

    await user.click(screen.getByRole('button', { name: 'delete-fs-1' }))
    await user.click(screen.getByRole('button', { name: 'deleteDialog.confirm' }))

    await waitFor(() => {
      expect(deleteFileStorage).toHaveBeenCalledWith('fs-1')
    })
    expect(toast.success).toHaveBeenCalledWith('success.deleted:{"name":"/data/share"}')
    expect(refresh).toHaveBeenCalled()
  })

  it('shows a forbidden error toast and does not refresh when delete is rejected', async () => {
    vi.mocked(deleteFileStorage).mockResolvedValue({ error: 'Forbidden' })
    const user = userEvent.setup()

    render(<FileStorageClient initialData={[fileStorage] as FileStorageResource[]} />)

    await user.click(screen.getByRole('button', { name: 'delete-fs-1' }))
    await user.click(screen.getByRole('button', { name: 'deleteDialog.confirm' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.deleteForbidden')
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('shows a generic delete error toast when deleteFileStorage throws', async () => {
    vi.mocked(deleteFileStorage).mockRejectedValue(new Error('network down'))
    const user = userEvent.setup()

    render(<FileStorageClient initialData={[fileStorage] as FileStorageResource[]} />)

    await user.click(screen.getByRole('button', { name: 'delete-fs-1' }))
    await user.click(screen.getByRole('button', { name: 'deleteDialog.confirm' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.deleteError')
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('creates a new file storage record via the modal and shows a success toast', async () => {
    vi.mocked(createFileStorage).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<FileStorageClient initialData={[]} />)

    await user.click(screen.getByRole('button', { name: /addStorage/ }))
    await user.click(screen.getByRole('button', { name: 'save-modal' }))

    await waitFor(() => {
      expect(createFileStorage).toHaveBeenCalledWith(expect.objectContaining({ pathLocation: '/new' }))
    })
    expect(toast.success).toHaveBeenCalledWith('success.added')
    expect(refresh).toHaveBeenCalled()
  })

  it('shows a form errors toast and keeps the modal open when create returns field errors', async () => {
    vi.mocked(createFileStorage).mockResolvedValue({
      error: { formErrors: [], fieldErrors: { pathLocation: ['required'] } },
    })
    const user = userEvent.setup()

    render(<FileStorageClient initialData={[]} />)

    await user.click(screen.getByRole('button', { name: /addStorage/ }))
    await user.click(screen.getByRole('button', { name: 'save-modal' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.formErrors')
    })
    expect(refresh).not.toHaveBeenCalled()
  })
})
