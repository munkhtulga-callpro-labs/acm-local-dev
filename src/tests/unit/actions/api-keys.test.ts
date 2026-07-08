import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('next/headers', () => ({ headers: vi.fn() }))
vi.mock('next/cache', () => ({ updateTag: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    aPIKey: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  },
}))

import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createApiKey, updateApiKey, deleteApiKey, getApiKeyToken } from '@/lib/actions/api-keys'

const mockSession = (role: string) =>
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: 'user-1', email: 'admin@example.com', role },
  } as any)

const mockHeaders = () =>
  vi.mocked(headers).mockResolvedValue({
    get: vi.fn().mockReturnValue(null),
  } as any)

const validBody = {
  serviceName: 'Stripe',
  apiKeyToken: 'sk_live_abc',
  keyType: 'Production',
  scopePermissions: 'read:all',
  status: 'ACTIVE',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockHeaders()
})

describe('createApiKey', () => {
  it('returns Unauthorized when there is no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const result = await createApiKey(validBody)
    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('returns Forbidden for a non-privileged role', async () => {
    mockSession('EMPLOYEE')
    const result = await createApiKey(validBody)
    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('returns validation errors for invalid body', async () => {
    mockSession('ADMIN')
    const result = await createApiKey({ serviceName: '' })
    expect(result).toHaveProperty('error')
    expect(result!.error).not.toBe('Unauthorized')
    expect(result!.error).not.toBe('Forbidden')
  })

  it('calls prisma.aPIKey.create and returns undefined on success', async () => {
    mockSession('ADMIN')
    vi.mocked(prisma.aPIKey.create).mockResolvedValue({} as any)
    const result = await createApiKey(validBody)
    expect(prisma.aPIKey.create).toHaveBeenCalledOnce()
    expect(result).toBeUndefined()
  })

  it('also accepts IT_STAFF role', async () => {
    mockSession('IT_STAFF')
    vi.mocked(prisma.aPIKey.create).mockResolvedValue({} as any)
    const result = await createApiKey(validBody)
    expect(result).toBeUndefined()
  })
})

describe('updateApiKey', () => {
  it('returns Unauthorized when there is no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await updateApiKey('id-1', validBody)).toEqual({ error: 'Unauthorized' })
  })

  it('returns Forbidden for non-privileged role', async () => {
    mockSession('HR_MANAGER')
    expect(await updateApiKey('id-1', validBody)).toEqual({ error: 'Forbidden' })
  })

  it('calls prisma.aPIKey.update on success', async () => {
    mockSession('ADMIN')
    vi.mocked(prisma.aPIKey.update).mockResolvedValue({} as any)
    await updateApiKey('id-1', validBody)
    expect(prisma.aPIKey.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'id-1' } })
    )
  })

  it('excludes apiKeyToken from update when not provided', async () => {
    mockSession('ADMIN')
    vi.mocked(prisma.aPIKey.update).mockResolvedValue({} as any)
    const { apiKeyToken: _, ...withoutToken } = validBody
    await updateApiKey('id-1', withoutToken)
    const updateCall = vi.mocked(prisma.aPIKey.update).mock.calls[0][0]
    expect(updateCall.data).not.toHaveProperty('apiKeyToken')
  })
})

describe('deleteApiKey', () => {
  it('returns Unauthorized when there is no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await deleteApiKey('id-1')).toEqual({ error: 'Unauthorized' })
  })

  it('returns Forbidden for non-privileged role', async () => {
    mockSession('DEPARTMENT_MANAGER')
    expect(await deleteApiKey('id-1')).toEqual({ error: 'Forbidden' })
  })

  it('calls prisma.aPIKey.delete on success', async () => {
    mockSession('ADMIN')
    vi.mocked(prisma.aPIKey.delete).mockResolvedValue({} as any)
    await deleteApiKey('id-1')
    expect(prisma.aPIKey.delete).toHaveBeenCalledWith({ where: { id: 'id-1' } })
  })
})

describe('getApiKeyToken', () => {
  const mockKey = {
    id: 'key-1',
    serviceName: 'Stripe',
    apiKeyToken: 'sk_live_secret',
    assignedTo: 'owner@example.com',
  }

  it('returns Unauthorized when there is no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await getApiKeyToken('key-1')).toEqual({ error: 'Unauthorized' })
  })

  it('returns Not found when key does not exist', async () => {
    mockSession('ADMIN')
    vi.mocked(prisma.aPIKey.findUnique).mockResolvedValue(null)
    expect(await getApiKeyToken('missing')).toEqual({ error: 'Not found' })
  })

  it('returns Forbidden when caller is not owner and not privileged', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-2', email: 'other@example.com', role: 'EMPLOYEE' },
    } as any)
    vi.mocked(prisma.aPIKey.findUnique).mockResolvedValue(mockKey as any)
    expect(await getApiKeyToken('key-1')).toEqual({ error: 'Forbidden' })
  })

  it('returns the token when caller is the owner', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-3', email: 'owner@example.com', role: 'EMPLOYEE' },
    } as any)
    vi.mocked(prisma.aPIKey.findUnique).mockResolvedValue(mockKey as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)
    const result = await getApiKeyToken('key-1')
    expect(result).toEqual({ token: 'sk_live_secret' })
  })

  it('returns the token when caller is privileged (not the owner)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-4', email: 'admin@example.com', role: 'ADMIN' },
    } as any)
    vi.mocked(prisma.aPIKey.findUnique).mockResolvedValue(mockKey as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)
    const result = await getApiKeyToken('key-1')
    expect(result).toEqual({ token: 'sk_live_secret' })
  })

  it('creates an audit log on token view', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-4', email: 'admin@example.com', role: 'ADMIN' },
    } as any)
    vi.mocked(prisma.aPIKey.findUnique).mockResolvedValue(mockKey as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)
    await getApiKeyToken('key-1')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'VIEW_TOKEN', entityType: 'APIKey' }),
      })
    )
  })
})
