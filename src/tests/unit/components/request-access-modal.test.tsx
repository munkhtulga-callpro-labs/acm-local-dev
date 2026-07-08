import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { RequestAccessModal } from '@/components/request-access-modal'
import { createAccessRequest } from '@/lib/actions/access-requests'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/actions/access-requests', () => ({
  createAccessRequest: vi.fn(),
}))

const justification = 'This access is needed for the quarterly audit review process.'

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole('combobox')[0])
  await user.click(screen.getByRole('option', { name: 'resourceTypes.DATABASE' }))
  await user.type(screen.getByLabelText(/resourceName/), 'Payroll DB')
  await user.click(screen.getAllByRole('combobox')[1])
  await user.click(screen.getByRole('option', { name: 'Read' }))
  await user.type(screen.getByLabelText(/justification/), justification)
}

describe('RequestAccessModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits a request for a manually chosen resource and calls onSuccess', async () => {
    vi.mocked(createAccessRequest).mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<RequestAccessModal isOpen onClose={vi.fn()} onSuccess={onSuccess} />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(createAccessRequest).toHaveBeenCalledWith(expect.objectContaining({
        resourceType: 'DATABASE',
        resourceName: 'Payroll DB',
        accessLevel: 'Read',
        businessJustification: justification,
      }))
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('shows validation errors and skips the request when required fields are missing', async () => {
    const user = userEvent.setup()

    render(<RequestAccessModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'submit' }))

    expect(await screen.findByText('errors.resourceTypeRequired')).toBeInTheDocument()
    expect(screen.getByText('errors.resourceNameRequired')).toBeInTheDocument()
    expect(screen.getByText('errors.accessLevelRequired')).toBeInTheDocument()
    expect(screen.getByText('errors.justificationRequired')).toBeInTheDocument()
    expect(createAccessRequest).not.toHaveBeenCalled()
  })

  it('treats a justification shorter than 20 characters as invalid', async () => {
    const user = userEvent.setup()

    render(<RequestAccessModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />)

    await user.click(screen.getAllByRole('combobox')[0])
    await user.click(screen.getByRole('option', { name: 'resourceTypes.DATABASE' }))
    await user.type(screen.getByLabelText(/resourceName/), 'Payroll DB')
    await user.click(screen.getAllByRole('combobox')[1])
    await user.click(screen.getByRole('option', { name: 'Read' }))
    await user.type(screen.getByLabelText(/justification/), 'too short')
    await user.click(screen.getByRole('button', { name: 'submit' }))

    expect(await screen.findByText('errors.justificationRequired')).toBeInTheDocument()
    expect(createAccessRequest).not.toHaveBeenCalled()
  })

  it('does not show resource type/name fields when a resource is pre-selected', async () => {
    vi.mocked(createAccessRequest).mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(
      <RequestAccessModal
        isOpen
        onClose={vi.fn()}
        onSuccess={onSuccess}
        resource={{ id: 'res-1', displayName: 'Payroll DB', resourceType: 'DATABASE' }}
      />
    )

    expect(screen.queryByLabelText(/resourceName/)).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('combobox')[0])
    await user.click(screen.getByRole('option', { name: 'Read' }))
    await user.type(screen.getByLabelText(/justification/), justification)
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(createAccessRequest).toHaveBeenCalledWith(expect.objectContaining({
        resourceType: 'DATABASE',
        resourceId: 'res-1',
        resourceName: 'Payroll DB',
      }))
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('shows the server error message and does not call onSuccess when the request is rejected', async () => {
    vi.mocked(createAccessRequest).mockResolvedValue({ error: 'Unauthorized' })
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<RequestAccessModal isOpen onClose={vi.fn()} onSuccess={onSuccess} />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unauthorized')
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('shows a submit error toast when createAccessRequest throws', async () => {
    vi.mocked(createAccessRequest).mockRejectedValue(new Error('network down'))
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<RequestAccessModal isOpen onClose={vi.fn()} onSuccess={onSuccess} />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.submitError')
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
