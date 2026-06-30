import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('next/cache', () => ({ updateTag: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    physicalAccess: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import {
  createPhysicalAccess,
  updatePhysicalAccess,
  deletePhysicalAccess,
} from '@/lib/actions/physical-access'

const mockSession = (role: string) =>
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: 'user-1', email: 'it@example.com', role },
  } as any)

const validBody = {
  location: 'Server Room A',
  accessType: 'Badge',
  accessSchedule: '24/7',
  accessZones: 'Zone A',
  validFrom: '2024-01-01',
  status: 'ACTIVE',
  escortRequired: false,
}

beforeEach(() => vi.clearAllMocks())

describe('createPhysicalAccess', () => {
  it('returns Unauthorized with no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await createPhysicalAccess(validBody)).toEqual({ error: 'Unauthorized' })
  })

  it('returns Forbidden for EMPLOYEE', async () => {
    mockSession('EMPLOYEE')
    expect(await createPhysicalAccess(validBody)).toEqual({ error: 'Forbidden' })
  })

  it('returns Forbidden for DEPARTMENT_MANAGER', async () => {
    mockSession('DEPARTMENT_MANAGER')
    expect(await createPhysicalAccess(validBody)).toEqual({ error: 'Forbidden' })
  })

  it('returns validation errors for invalid body', async () => {
    mockSession('ADMIN')
    const result = await createPhysicalAccess({ location: '' })
    expect(result).toHaveProperty('error')
    expect(result!.error).not.toBe('Unauthorized')
    expect(result!.error).not.toBe('Forbidden')
  })

  it('calls prisma.physicalAccess.create on success', async () => {
    mockSession('ADMIN')
    vi.mocked(prisma.physicalAccess.create).mockResolvedValue({} as any)
    const result = await createPhysicalAccess(validBody)
    expect(prisma.physicalAccess.create).toHaveBeenCalledOnce()
    expect(result).toBeUndefined()
  })

  it('accepts IT_STAFF role', async () => {
    mockSession('IT_STAFF')
    vi.mocked(prisma.physicalAccess.create).mockResolvedValue({} as any)
    await createPhysicalAccess(validBody)
    expect(prisma.physicalAccess.create).toHaveBeenCalledOnce()
  })
})

describe('updatePhysicalAccess', () => {
  it('returns Unauthorized with no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await updatePhysicalAccess('id-1', validBody)).toEqual({ error: 'Unauthorized' })
  })

  it('returns Forbidden for non-privileged role', async () => {
    mockSession('HR_MANAGER')
    expect(await updatePhysicalAccess('id-1', validBody)).toEqual({ error: 'Forbidden' })
  })

  it('calls prisma.physicalAccess.update with the correct id', async () => {
    mockSession('IT_STAFF')
    vi.mocked(prisma.physicalAccess.update).mockResolvedValue({} as any)
    await updatePhysicalAccess('phys-7', validBody)
    expect(prisma.physicalAccess.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'phys-7' } })
    )
  })
})

describe('deletePhysicalAccess', () => {
  it('returns Unauthorized with no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await deletePhysicalAccess('id-1')).toEqual({ error: 'Unauthorized' })
  })

  it('returns Forbidden for non-privileged role', async () => {
    mockSession('EMPLOYEE')
    expect(await deletePhysicalAccess('id-1')).toEqual({ error: 'Forbidden' })
  })

  it('calls prisma.physicalAccess.delete with the correct id', async () => {
    mockSession('ADMIN')
    vi.mocked(prisma.physicalAccess.delete).mockResolvedValue({} as any)
    await deletePhysicalAccess('phys-3')
    expect(prisma.physicalAccess.delete).toHaveBeenCalledWith({ where: { id: 'phys-3' } })
  })
})
