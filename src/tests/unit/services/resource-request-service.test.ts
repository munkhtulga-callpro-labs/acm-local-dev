import { describe, it, expect, vi, beforeEach } from 'vitest'

const { sendAccessRequestNotification } = vi.hoisted(() => ({
  sendAccessRequestNotification: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/email', () => ({ sendAccessRequestNotification }))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(null) }),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resourceOwner: { findMany: vi.fn() },
    resourceAccessRequest: { create: vi.fn() },
    resourceApproval: { create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { createResourceAccessRequest } from '@/services/resource-request-service'

const employee = {
  id: 'emp-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@company.com',
  department: 'Development',
}

const baseArgs = {
  employee,
  resourceType: 'CODE_REPOSITORY',
  resourceId: 'repo-1',
  resourceName: 'onlime-backend-monorepo',
  accessLevel: 'Write',
  businessJustification: 'Automatic default access for onboarding.',
  validFrom: new Date('2026-01-01'),
}

describe('createResourceAccessRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.resourceAccessRequest.create).mockResolvedValue({ id: 'req-1' } as any)
  })

  it('errors when no owners are configured for the resource', async () => {
    vi.mocked(prisma.resourceOwner.findMany).mockResolvedValue([])

    const result = await createResourceAccessRequest(baseArgs)

    expect(result).toEqual({ error: 'No owners found for this resource. Please contact IT.' })
    expect(prisma.resourceAccessRequest.create).not.toHaveBeenCalled()
  })

  it('errors when owners exist but none have an email', async () => {
    vi.mocked(prisma.resourceOwner.findMany).mockResolvedValue([
      { id: 'owner-1', ownerEmail: null, ownershipType: 'MAIN_OWNER' },
    ] as any)

    const result = await createResourceAccessRequest(baseArgs)

    expect(result).toEqual({
      error: 'No individual owners found for this resource. Please contact IT.',
    })
  })

  it('creates the request, an approval per owner, and notifies owners', async () => {
    vi.mocked(prisma.resourceOwner.findMany).mockResolvedValue([
      { id: 'owner-1', ownerEmail: 'owner@company.com', ownershipType: 'MAIN_OWNER' },
    ] as any)

    const result = await createResourceAccessRequest(baseArgs)

    expect(prisma.resourceAccessRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resourceType: 'CODE_REPOSITORY',
          resourceId: 'repo-1',
          requesterId: 'emp-1',
          requesterDepartment: 'Development',
          status: 'PENDING',
        }),
      })
    )
    expect(prisma.resourceApproval.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ requestId: 'req-1', approverEmail: 'owner@company.com' }),
      })
    )
    expect(sendAccessRequestNotification).toHaveBeenCalledWith(
      'owner@company.com',
      expect.objectContaining({ resourceName: 'onlime-backend-monorepo' })
    )
    expect(result).toEqual({ accessRequest: { id: 'req-1' } })
  })
})
