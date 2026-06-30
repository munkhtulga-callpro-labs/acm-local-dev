import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('next/headers', () => ({ headers: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/email', () => ({ sendAccessRequestNotification: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: { findUnique: vi.fn() },
    resourceOwner: { findMany: vi.fn() },
    resourceAccessRequest: { create: vi.fn() },
    resourceApproval: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sendAccessRequestNotification } from '@/lib/email'
import { createAccessRequest } from '@/lib/actions/access-requests'

const validBody = {
  resourceType: 'SaaS',
  resourceId: 'res-1',
  resourceName: 'GitHub',
  accessLevel: 'READ',
  businessJustification: 'Need access for code reviews in the project',
  validFrom: '2099-01-01',
}

const mockEmployee = {
  id: 'emp-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  department: 'Engineering',
}

const mockOwnerWithEmail = {
  id: 'owner-1',
  ownerEmail: 'owner@example.com',
  ownershipType: 'PRIMARY',
  resourceType: 'SaaS',
  resourceId: 'res-1',
  isActive: true,
  createdAt: new Date(),
}

const mockAccessRequest = { id: 'req-1', ...validBody }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(headers).mockResolvedValue({ get: vi.fn().mockReturnValue(null) } as any)
  vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
  vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)
  vi.mocked(prisma.resourceApproval.create).mockResolvedValue({} as any)
  vi.mocked(sendAccessRequestNotification).mockResolvedValue(undefined as any)
})

describe('createAccessRequest — auth', () => {
  it('returns Unauthorized when there is no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await createAccessRequest(validBody)).toEqual({ error: 'Unauthorized' })
  })

  it('returns Unauthorized when session has no email', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { email: null } } as any)
    expect(await createAccessRequest(validBody)).toEqual({ error: 'Unauthorized' })
  })
})

describe('createAccessRequest — validation', () => {
  it('returns field errors for an invalid body', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'jane@example.com' },
    } as any)
    const result = await createAccessRequest({ businessJustification: 'short' })
    expect(result).toHaveProperty('error')
    expect(result!.error).not.toBe('Unauthorized')
  })
})

describe('createAccessRequest — business logic errors', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'jane@example.com' },
    } as any)
  })

  it('returns error when employee record is not found', async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(null)
    expect(await createAccessRequest(validBody)).toEqual({
      error: 'Employee record not found',
    })
  })

  it('returns error when resource has no owners', async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any)
    vi.mocked(prisma.resourceOwner.findMany).mockResolvedValue([])
    expect(await createAccessRequest(validBody)).toEqual({
      error: 'No owners found for this resource. Please contact IT.',
    })
  })

  it('returns error when no owner has an email address', async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any)
    vi.mocked(prisma.resourceOwner.findMany).mockResolvedValue([
      { ...mockOwnerWithEmail, ownerEmail: null },
      { ...mockOwnerWithEmail, ownerEmail: '   ' },
    ] as any)
    expect(await createAccessRequest(validBody)).toEqual({
      error: 'No individual owners found for this resource. Please contact IT.',
    })
  })
})

describe('createAccessRequest — happy path', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'jane@example.com' },
    } as any)
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any)
    vi.mocked(prisma.resourceOwner.findMany).mockResolvedValue([mockOwnerWithEmail] as any)
    vi.mocked(prisma.resourceAccessRequest.create).mockResolvedValue(mockAccessRequest as any)
  })

  it('returns undefined on success', async () => {
    const result = await createAccessRequest(validBody)
    expect(result).toBeUndefined()
  })

  it('creates the access request record', async () => {
    await createAccessRequest(validBody)
    expect(prisma.resourceAccessRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resourceType: validBody.resourceType,
          resourceName: validBody.resourceName,
          accessLevel: validBody.accessLevel,
          status: 'PENDING',
        }),
      })
    )
  })

  it('creates one approval record per owner with email', async () => {
    const secondOwner = { ...mockOwnerWithEmail, id: 'owner-2', ownerEmail: 'owner2@example.com' }
    vi.mocked(prisma.resourceOwner.findMany).mockResolvedValue([
      mockOwnerWithEmail,
      secondOwner,
    ] as any)
    await createAccessRequest(validBody)
    expect(prisma.resourceApproval.create).toHaveBeenCalledTimes(2)
  })

  it('sends a notification email to each owner', async () => {
    await createAccessRequest(validBody)
    expect(sendAccessRequestNotification).toHaveBeenCalledWith(
      mockOwnerWithEmail.ownerEmail,
      expect.objectContaining({ resourceName: validBody.resourceName })
    )
  })

  it('does not fail when email sending throws', async () => {
    vi.mocked(sendAccessRequestNotification).mockRejectedValue(new Error('SMTP down'))
    await expect(createAccessRequest(validBody)).resolves.toBeUndefined()
  })

  it('does not fail when audit log creation throws', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', employee: null } as any)
    vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error('DB error'))
    await expect(createAccessRequest(validBody)).resolves.toBeUndefined()
  })
})
