import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { AccessClient } from '@/app/(dashboard)/access/client'
import type { AccessAssignment } from '@/components/access-control-data-table'

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

vi.mock('@/components/access-control-data-table', () => ({
  AccessControlDataTable: ({ data }: { data: AccessAssignment[] }) => (
    <div data-testid="data-table">{data.length} rows</div>
  ),
}))

vi.mock('@/components/request-access-modal', () => ({
  RequestAccessModal: ({ isOpen, onSuccess }: { isOpen: boolean; onSuccess: () => void }) =>
    isOpen ? <button onClick={onSuccess}>confirm-request</button> : null,
}))

function makeAssignment(overrides: Partial<AccessAssignment>): AccessAssignment {
  const now = new Date().toISOString()
  return {
    id: 'a-1',
    resourceType: 'API_KEY',
    resourceId: 'res-1',
    resourceName: 'Resource',
    assigneeId: 'user-1',
    assigneeName: 'User',
    assigneeEmail: 'user@example.com',
    assigneeDepartment: null,
    accessLevel: 'READ',
    grantedBy: 'admin',
    grantedAt: now,
    validFrom: now,
    validTo: null,
    status: 'ACTIVE',
    isActive: true,
    ...overrides,
  }
}

describe('AccessClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an empty-state alert instead of the data table when there is no data', () => {
    render(<AccessClient initialData={[]} />)

    expect(screen.getByText('noAssignments')).toBeInTheDocument()
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument()
  })

  it('renders the data table when assignments exist', () => {
    render(<AccessClient initialData={[makeAssignment({})]} />)

    expect(screen.getByTestId('data-table')).toHaveTextContent('1 rows')
    expect(screen.queryByText('noAssignments')).not.toBeInTheDocument()
  })

  it('computes active, revoked, expired, and expiring-soon counts from the assignments', () => {
    const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

    const data = [
      makeAssignment({ id: 'active', status: 'ACTIVE', isActive: true, validTo: null }),
      makeAssignment({ id: 'revoked', status: 'REVOKED', isActive: false, validTo: null }),
      makeAssignment({ id: 'expired', status: 'ACTIVE', isActive: true, validTo: tenDaysAgo }),
      makeAssignment({ id: 'expiring-soon', status: 'ACTIVE', isActive: true, validTo: tenDaysFromNow }),
    ]

    render(<AccessClient initialData={data} />)

    const stats = screen.getAllByText(/^\d+$/).map((el) => el.textContent)
    expect(stats).toEqual(['3', '1', '1', '1'])
  })

  it('shows a success toast and refreshes after a successful access request', async () => {
    const user = userEvent.setup()

    render(<AccessClient initialData={[]} />)

    await user.click(screen.getByRole('button', { name: 'requestAccess' }))
    await user.click(screen.getByRole('button', { name: 'confirm-request' }))

    expect(toast.success).toHaveBeenCalledWith('successToast')
    expect(refresh).toHaveBeenCalled()
  })
})
