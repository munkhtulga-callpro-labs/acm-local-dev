import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'

const nextAuthMock = vi.hoisted(() => ({ getServerSession: vi.fn() }))
vi.mock('next-auth', () => ({ getServerSession: nextAuthMock.getServerSession }))

const headersMock = vi.hoisted(() => ({
  headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(null) }),
}))
vi.mock('next/headers', () => ({ headers: headersMock.headers }))

const cacheMock = vi.hoisted(() => ({ updateTag: vi.fn() }))
vi.mock('next/cache', () => ({ updateTag: cacheMock.updateTag }))

import { prisma } from '@/lib/prisma'
import {
  createApiKey,
  updateApiKey,
  deleteApiKey,
  getApiKeyToken,
} from '@/lib/actions/api-keys'

function mockSession(id: string, email: string, role: string) {
  nextAuthMock.getServerSession.mockResolvedValue({ user: { id, email, role } })
}

describe('api-keys actions (real Postgres)', () => {
  let adminUser: { id: string; email: string }
  let ownerUser: { id: string; email: string }
  let strangerUser: { id: string; email: string }
  const keyIds: string[] = []

  const validBody = {
    serviceName: 'Stripe',
    apiKeyToken: 'sk_live_abc',
    keyType: 'Production',
    scopePermissions: 'read:all',
    status: 'ACTIVE',
  }

  beforeAll(async () => {
    adminUser = await prisma.user.create({
      data: { email: 'api-keys-admin@integration.test', role: 'ADMIN', isActive: true },
    })
    ownerUser = await prisma.user.create({
      data: { email: 'api-keys-owner@integration.test', role: 'EMPLOYEE', isActive: true },
    })
    strangerUser = await prisma.user.create({
      data: { email: 'api-keys-stranger@integration.test', role: 'EMPLOYEE', isActive: true },
    })
  })

  afterEach(async () => {
    nextAuthMock.getServerSession.mockReset()
    cacheMock.updateTag.mockClear()
    if (keyIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { entityId: { in: keyIds } } })
      await prisma.aPIKey.deleteMany({ where: { id: { in: keyIds } } })
      keyIds.length = 0
    }
  })

  afterAll(async () => {
    await prisma.user.delete({ where: { id: adminUser.id } })
    await prisma.user.delete({ where: { id: ownerUser.id } })
    await prisma.user.delete({ where: { id: strangerUser.id } })
  })

  describe('createApiKey', () => {
    it('returns Unauthorized with no session and creates nothing', async () => {
      nextAuthMock.getServerSession.mockResolvedValue(null)
      const result = await createApiKey(validBody)
      expect(result).toEqual({ error: 'Unauthorized' })
      expect(await prisma.aPIKey.count({ where: { serviceName: 'Stripe' } })).toBe(0)
    })

    it('returns Forbidden for a non-privileged role and creates nothing', async () => {
      mockSession(ownerUser.id, ownerUser.email, 'EMPLOYEE')
      const result = await createApiKey(validBody)
      expect(result).toEqual({ error: 'Forbidden' })
      expect(await prisma.aPIKey.count({ where: { serviceName: 'Stripe' } })).toBe(0)
    })

    it('returns validation errors for an invalid body', async () => {
      mockSession(adminUser.id, adminUser.email, 'ADMIN')
      const result = await createApiKey({ serviceName: '' })
      expect(result).toHaveProperty('error')
    })

    it('creates a real row for a privileged ADMIN and normalizes optional fields', async () => {
      mockSession(adminUser.id, adminUser.email, 'ADMIN')
      const result = await createApiKey(validBody)
      expect(result).toBeUndefined()

      const stored = await prisma.aPIKey.findFirst({ where: { serviceName: 'Stripe' } })
      expect(stored).not.toBeNull()
      keyIds.push(stored!.id)
      expect(stored?.apiKeyToken).toBe('sk_live_abc')
      expect(stored?.rateLimit).toBeNull()
      expect(stored?.assignedTo).toBeNull()
      expect(cacheMock.updateTag).toHaveBeenCalledWith('api-keys')
    })

    it('also allows IT_STAFF to create a key', async () => {
      mockSession(adminUser.id, 'it-staff@integration.test', 'IT_STAFF')
      const result = await createApiKey({ ...validBody, serviceName: 'Twilio' })
      expect(result).toBeUndefined()
      const stored = await prisma.aPIKey.findFirst({ where: { serviceName: 'Twilio' } })
      expect(stored).not.toBeNull()
      keyIds.push(stored!.id)
    })
  })

  describe('updateApiKey', () => {
    it('updates a real row and preserves the existing token when none is provided', async () => {
      mockSession(adminUser.id, adminUser.email, 'ADMIN')
      await createApiKey(validBody)
      const created = await prisma.aPIKey.findFirst({ where: { serviceName: 'Stripe' } })
      keyIds.push(created!.id)

      const { apiKeyToken: _omit, ...withoutToken } = validBody
      const result = await updateApiKey(created!.id, { ...withoutToken, serviceName: 'Stripe Updated' })
      expect(result).toBeUndefined()

      const updated = await prisma.aPIKey.findUnique({ where: { id: created!.id } })
      expect(updated?.serviceName).toBe('Stripe Updated')
      expect(updated?.apiKeyToken).toBe('sk_live_abc')
    })

    it('returns Forbidden for a non-privileged role and does not modify the row', async () => {
      mockSession(adminUser.id, adminUser.email, 'ADMIN')
      await createApiKey(validBody)
      const created = await prisma.aPIKey.findFirst({ where: { serviceName: 'Stripe' } })
      keyIds.push(created!.id)

      mockSession(ownerUser.id, ownerUser.email, 'HR_MANAGER')
      const result = await updateApiKey(created!.id, { ...validBody, serviceName: 'Hacked' })
      expect(result).toEqual({ error: 'Forbidden' })

      const unchanged = await prisma.aPIKey.findUnique({ where: { id: created!.id } })
      expect(unchanged?.serviceName).toBe('Stripe')
    })
  })

  describe('deleteApiKey', () => {
    it('deletes a real row for a privileged role', async () => {
      mockSession(adminUser.id, adminUser.email, 'ADMIN')
      await createApiKey(validBody)
      const created = await prisma.aPIKey.findFirst({ where: { serviceName: 'Stripe' } })

      const result = await deleteApiKey(created!.id)
      expect(result).toBeUndefined()
      expect(await prisma.aPIKey.findUnique({ where: { id: created!.id } })).toBeNull()
    })

    it('returns Forbidden and does not delete for a non-privileged role', async () => {
      mockSession(adminUser.id, adminUser.email, 'ADMIN')
      await createApiKey(validBody)
      const created = await prisma.aPIKey.findFirst({ where: { serviceName: 'Stripe' } })
      keyIds.push(created!.id)

      mockSession(ownerUser.id, ownerUser.email, 'DEPARTMENT_MANAGER')
      const result = await deleteApiKey(created!.id)
      expect(result).toEqual({ error: 'Forbidden' })
      expect(await prisma.aPIKey.findUnique({ where: { id: created!.id } })).not.toBeNull()
    })
  })

  describe('getApiKeyToken', () => {
    it('returns Not found for a missing key', async () => {
      mockSession(adminUser.id, adminUser.email, 'ADMIN')
      const result = await getApiKeyToken('does-not-exist')
      expect(result).toEqual({ error: 'Not found' })
    })

    it('returns Forbidden when caller is neither owner nor privileged, and writes no audit log', async () => {
      mockSession(adminUser.id, adminUser.email, 'ADMIN')
      await createApiKey({ ...validBody, assignedTo: ownerUser.email })
      const created = await prisma.aPIKey.findFirst({ where: { serviceName: 'Stripe' } })
      keyIds.push(created!.id)

      mockSession(strangerUser.id, strangerUser.email, 'EMPLOYEE')
      const result = await getApiKeyToken(created!.id)
      expect(result).toEqual({ error: 'Forbidden' })

      const logs = await prisma.auditLog.findMany({ where: { entityId: created!.id } })
      expect(logs).toHaveLength(0)
    })

    it('returns the token and writes a VIEW_TOKEN audit log when caller is the assigned owner', async () => {
      mockSession(adminUser.id, adminUser.email, 'ADMIN')
      await createApiKey({ ...validBody, assignedTo: ownerUser.email })
      const created = await prisma.aPIKey.findFirst({ where: { serviceName: 'Stripe' } })
      keyIds.push(created!.id)

      mockSession(ownerUser.id, ownerUser.email, 'EMPLOYEE')
      const result = await getApiKeyToken(created!.id)
      expect(result).toEqual({ token: 'sk_live_abc' })

      const log = await prisma.auditLog.findFirst({ where: { entityId: created!.id } })
      expect(log?.action).toBe('VIEW_TOKEN')
      expect(log?.userId).toBe(ownerUser.id)
    })

    it('returns the token when caller is privileged even without being the owner', async () => {
      mockSession(adminUser.id, adminUser.email, 'ADMIN')
      await createApiKey({ ...validBody, assignedTo: ownerUser.email })
      const created = await prisma.aPIKey.findFirst({ where: { serviceName: 'Stripe' } })
      keyIds.push(created!.id)

      const result = await getApiKeyToken(created!.id)
      expect(result).toEqual({ token: 'sk_live_abc' })
    })
  })
})
