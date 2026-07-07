import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PhysicalAccessModal } from '@/components/physical-access-modal'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const physicalAccess = {
  id: 'pa-1',
  location: 'Main Building',
  accessType: 'Badge',
  accessSchedule: 'Business Hours',
  accessZones: 'Zone A',
  validFrom: '2026-01-01',
  status: 'ACTIVE',
  escortRequired: true,
}

describe('PhysicalAccessModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves a new record with valid data and closes the modal', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <PhysicalAccessModal isOpen mode="create" onClose={onClose} onSave={onSave} />
    )

    await user.type(screen.getByLabelText(/location/), 'East Wing')
    await user.type(screen.getByLabelText(/accessZones/), 'Zone B')
    await user.click(screen.getByRole('button', { name: 'addAccess' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ location: 'East Wing', accessZones: 'Zone B' }))
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('keeps the modal open when onSave resolves false', async () => {
    const onSave = vi.fn().mockResolvedValue(false)
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <PhysicalAccessModal isOpen mode="create" onClose={onClose} onSave={onSave} />
    )

    await user.type(screen.getByLabelText(/location/), 'East Wing')
    await user.type(screen.getByLabelText(/accessZones/), 'Zone B')
    await user.click(screen.getByRole('button', { name: 'addAccess' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows a required-field validation error and skips onSave when location is empty', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()

    render(
      <PhysicalAccessModal isOpen mode="create" onClose={vi.fn()} onSave={onSave} />
    )

    await user.type(screen.getByLabelText(/accessZones/), 'Zone B')
    await user.click(screen.getByRole('button', { name: 'addAccess' }))

    expect(await screen.findByText('Location is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('includes a toggled escortRequired switch in the saved payload', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const user = userEvent.setup()

    render(
      <PhysicalAccessModal isOpen mode="create" onClose={vi.fn()} onSave={onSave} />
    )

    await user.type(screen.getByLabelText(/location/), 'East Wing')
    await user.type(screen.getByLabelText(/accessZones/), 'Zone B')
    await user.click(screen.getByRole('switch'))
    await user.click(screen.getByRole('button', { name: 'addAccess' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ escortRequired: true }))
    })
  })

  it('populates fields from the existing record when editing', () => {
    render(
      <PhysicalAccessModal isOpen mode="edit" physicalAccess={physicalAccess} onClose={vi.fn()} onSave={vi.fn()} />
    )

    expect(screen.getByLabelText(/^location/)).toHaveValue('Main Building')
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('disables fields and hides the submit button in view mode', () => {
    render(
      <PhysicalAccessModal isOpen mode="view" physicalAccess={physicalAccess} onClose={vi.fn()} onSave={vi.fn()} />
    )

    expect(screen.getByLabelText(/^location/)).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'addAccess' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument()
  })
})
