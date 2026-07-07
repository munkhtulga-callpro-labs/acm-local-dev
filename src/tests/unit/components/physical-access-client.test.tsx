import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { PhysicalAccessClient } from '@/app/(dashboard)/resources/physical-access/client'
import { createPhysicalAccess, deletePhysicalAccess } from '@/lib/actions/physical-access'
import type { PhysicalAccessResource } from '@/components/physical-access-data-table'
import type { PhysicalAccessFormData } from '@/lib/schemas/physical-access'

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

vi.mock('@/lib/actions/physical-access', () => ({
  createPhysicalAccess: vi.fn(),
  updatePhysicalAccess: vi.fn(),
  deletePhysicalAccess: vi.fn(),
}))

vi.mock('@/components/physical-access-data-table', () => ({
  PhysicalAccessDataTable: ({ data, onEdit, onDelete }: {
    data: PhysicalAccessResource[]
    onEdit?: (item: PhysicalAccessResource) => void
    onDelete?: (id: string, name: string) => void
  }) => (
    <div>
      {data.map((item) => (
        <div key={item.id}>
          <span>{item.location}</span>
          <button onClick={() => onEdit?.(item)}>edit-{item.id}</button>
          <button onClick={() => onDelete?.(item.id!, item.location)}>delete-{item.id}</button>
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/components/physical-access-modal', () => ({
  PhysicalAccessModal: ({ isOpen, onSave }: { isOpen: boolean; onSave: (data: PhysicalAccessFormData) => Promise<boolean> }) =>
    isOpen ? (
      <button
        onClick={() =>
          onSave({
            location: 'New Wing',
            accessType: 'Badge',
            accessSchedule: 'Business Hours',
            accessZones: 'Zone A',
            validFrom: '2026-01-01',
            status: 'ACTIVE',
            escortRequired: false,
          })
        }
      >
        save-modal
      </button>
    ) : null,
}))

const physicalAccess: PhysicalAccessResource = {
  id: 'pa-1',
  createdAt: '2026-01-01',
  location: 'Main Building',
  accessType: 'Badge',
  accessSchedule: 'Business Hours',
  accessZones: 'Zone A',
  validFrom: '2026-01-01',
  status: 'ACTIVE',
  escortRequired: false,
}

describe('PhysicalAccessClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a physical access record and shows a success toast', async () => {
    vi.mocked(deletePhysicalAccess).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<PhysicalAccessClient initialData={[physicalAccess]} />)

    await user.click(screen.getByRole('button', { name: 'delete-pa-1' }))
    await user.click(screen.getByRole('button', { name: 'deleteDialog.confirm' }))

    await waitFor(() => {
      expect(deletePhysicalAccess).toHaveBeenCalledWith('pa-1')
    })
    expect(toast.success).toHaveBeenCalledWith('success.deleted:{"name":"Main Building"}')
    expect(refresh).toHaveBeenCalled()
  })

  it('shows a forbidden error toast and does not refresh when delete is rejected', async () => {
    vi.mocked(deletePhysicalAccess).mockResolvedValue({ error: 'Forbidden' })
    const user = userEvent.setup()

    render(<PhysicalAccessClient initialData={[physicalAccess]} />)

    await user.click(screen.getByRole('button', { name: 'delete-pa-1' }))
    await user.click(screen.getByRole('button', { name: 'deleteDialog.confirm' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.deleteForbidden')
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('shows a generic delete error toast when deletePhysicalAccess throws', async () => {
    vi.mocked(deletePhysicalAccess).mockRejectedValue(new Error('network down'))
    const user = userEvent.setup()

    render(<PhysicalAccessClient initialData={[physicalAccess]} />)

    await user.click(screen.getByRole('button', { name: 'delete-pa-1' }))
    await user.click(screen.getByRole('button', { name: 'deleteDialog.confirm' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.deleteError')
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('creates a new physical access record via the modal and shows a success toast', async () => {
    vi.mocked(createPhysicalAccess).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<PhysicalAccessClient initialData={[]} />)

    await user.click(screen.getByRole('button', { name: /addAccess/ }))
    await user.click(screen.getByRole('button', { name: 'save-modal' }))

    await waitFor(() => {
      expect(createPhysicalAccess).toHaveBeenCalledWith(expect.objectContaining({ location: 'New Wing' }))
    })
    expect(toast.success).toHaveBeenCalledWith('success.added')
    expect(refresh).toHaveBeenCalled()
  })

  it('shows a form errors toast when create returns field errors', async () => {
    vi.mocked(createPhysicalAccess).mockResolvedValue({
      error: { formErrors: [], fieldErrors: { location: ['required'] } },
    })
    const user = userEvent.setup()

    render(<PhysicalAccessClient initialData={[]} />)

    await user.click(screen.getByRole('button', { name: /addAccess/ }))
    await user.click(screen.getByRole('button', { name: 'save-modal' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.formErrors')
    })
    expect(refresh).not.toHaveBeenCalled()
  })
})
