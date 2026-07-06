import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'

const { sendAccessRequestNotification } = vi.hoisted(() => ({
  sendAccessRequestNotification: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/email', () => ({ sendAccessRequestNotification }))

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }))
vi.mock('next-auth', () => ({ getServerSession }))

const { headers } = vi.hoisted(() => ({
  headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(null) }),
}))
vi.mock('next/headers', () => ({ headers }))

import { prisma } from '@/lib/prisma'
import { createAccessRequest } from '@/lib/actions/access-requests'

describe('createAccessRequest action (real Postgres)', () => {
  let user: { id: string; email: string }
  let employee: { id: string }
  const resourceType = 'SOFTWARE_LICENSE'
  const resourceId = 'integration-test-resource'
  const requestIds: string[] = []
  const ownerIds: string[] = []

  const validBody = {
    resourceType,
    resourceId,
    resourceName: 'Integration Test License',
    accessLevel: 'READ',
    businessJustification: 'Need access for the integration test suite to verify behavior',
    validFrom: '2099-01-01',
  }

  beforeAll(async () => {
    user = await prisma.user.create({
      data: { email: 'access-requests-action@integration.test', role: 'EMPLOYEE', isActive: true },
    })

    employee = await prisma.employee.create({
      data: {
        employeeId: 'INT-ACC-REQ-ACTION',
        firstName: 'Rex',
        lastName: 'Requester',
        email: user.email,
        department: 'Engineering',
        position: 'Developer',
        startDate: new Date(),
        userId: user.id,
      },
    })
  })

  afterEach(async () => {
    sendAccessRequestNotification.mockClear()
    getServerSession.mockReset()

    if (requestIds.length > 0) {
      await prisma.resourceApproval.deleteMany({ where: { requestId: { in: requestIds } } })
      await prisma.resourceAccessRequest.deleteMany({ where: { id: { in: requestIds } } })
      requestIds.length = 0
    }
    if (ownerIds.length > 0) {
      await prisma.resourceOwner.deleteMany({ where: { id: { in: ownerIds } } })
      ownerIds.length = 0
    }
    await prisma.auditLog.deleteMany({ where: { entityType: 'ResourceAccessRequest' } })
  })

  afterAll(async () => {
    await prisma.employee.delete({ where: { id: employee.id } })
    await prisma.user.delete({ where: { id: user.id } })
  })

  async function createOwner(ownerEmail: string | null) {
    const owner = await prisma.resourceOwner.create({
      data: {
        resourceType,
        resourceId,
        ownershipType: 'MAIN_OWNER',
        ownerEmail,
        isActive: true,
      },
    })
    ownerIds.push(owner.id)
    return owner
  }

  it('returns Unauthorized and creates nothing when there is no session', async () => {
    getServerSession.mockResolvedValue(null)

    const result = await createAccessRequest(validBody)

    expect(result).toEqual({ error: 'Unauthorized' })
    const count = await prisma.resourceAccessRequest.count({ where: { resourceId } })
    expect(count).toBe(0)
  })

  it('returns an error when the employee record cannot be found', async () => {
    getServerSession.mockResolvedValue({ user: { email: 'nobody@integration.test' } })

    const result = await createAccessRequest(validBody)

    expect(result).toEqual({ error: 'Employee record not found' })
  })

  it('returns an error when the resource has no owners', async () => {
    getServerSession.mockResolvedValue({ user: { email: user.email } })

    const result = await createAccessRequest(validBody)

    expect(result).toEqual({ error: 'No owners found for this resource. Please contact IT.' })
  })

  it('returns an error when no owner has an email address', async () => {
    await createOwner(null)
    getServerSession.mockResolvedValue({ user: { email: user.email } })

    const result = await createAccessRequest(validBody)

    expect(result).toEqual({
      error: 'No individual owners found for this resource. Please contact IT.',
    })
  })

  it('creates the request, one approval per owner, an audit log, and sends notifications', async () => {
    const ownerA = await createOwner('owner-a@integration.test')
    const ownerB = await createOwner('owner-b@integration.test')
    getServerSession.mockResolvedValue({ user: { email: user.email } })

    const result = await createAccessRequest(validBody)
    expect(result).toBeUndefined()

    const request = await prisma.resourceAccessRequest.findFirst({ where: { resourceId } })
    expect(request).not.toBeNull()
    requestIds.push(request!.id)
    expect(request?.status).toBe('PENDING')
    expect(request?.requesterId).toBe(employee.id)
    expect(request?.requesterEmail).toBe(user.email)

    const approvals = await prisma.resourceApproval.findMany({ where: { requestId: request!.id } })
    expect(approvals).toHaveLength(2)
    expect(approvals.map(a => a.approverEmail).sort()).toEqual(
      [ownerA.ownerEmail, ownerB.ownerEmail].sort()
    )
    expect(approvals.every(a => a.status === 'PENDING')).toBe(true)

    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: request!.id, entityType: 'ResourceAccessRequest' },
    })
    expect(auditLog).not.toBeNull()
    expect(auditLog?.action).toBe('CREATE_ACCESS_REQUEST')
    expect(auditLog?.userId).toBe(user.id)

    expect(sendAccessRequestNotification).toHaveBeenCalledTimes(2)
    expect(sendAccessRequestNotification).toHaveBeenCalledWith(
      ownerA.ownerEmail,
      expect.objectContaining({ resourceName: validBody.resourceName, requestId: request!.id })
    )
  })

  it('ignores owners with a blank ownerEmail but still requests for owners with a real one', async () => {
    const blankOwner = await createOwner('   ')
    const realOwner = await createOwner('owner-real@integration.test')
    getServerSession.mockResolvedValue({ user: { email: user.email } })

    const result = await createAccessRequest(validBody)
    expect(result).toBeUndefined()

    const request = await prisma.resourceAccessRequest.findFirst({ where: { resourceId } })
    requestIds.push(request!.id)

    const approvals = await prisma.resourceApproval.findMany({ where: { requestId: request!.id } })
    expect(approvals).toHaveLength(1)
    expect(approvals[0].approverEmail).toBe(realOwner.ownerEmail)
    expect(approvals[0].approverEmail).not.toBe(blankOwner.ownerEmail)
  })
})
