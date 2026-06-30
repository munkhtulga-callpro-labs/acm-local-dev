import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('next/cache', () => ({ updateTag: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    fileStorage: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { createFileStorage, updateFileStorage, deleteFileStorage } from '@/lib/actions/file-storage'

const mockSession = (role: string) =>
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: 'user-1', email: 'it@example.com', role },
  } as any)

const validBody = {
  storageType: 'S3',
  pathLocation: 's3://bucket/path',
  permissionLevel: 'Read',
  status: 'ACTIVE',
}

beforeEach(() => vi.clearAllMocks())

describe('createFileStorage', () => {
  it('returns Unauthorized with no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await createFileStorage(validBody)).toEqual({ error: 'Unauthorized' })
  })

  it('returns Forbidden for EMPLOYEE role', async () => {
    mockSession('EMPLOYEE')
    expect(await createFileStorage(validBody)).toEqual({ error: 'Forbidden' })
  })

  it('returns Forbidden for HR_MANAGER role', async () => {
    mockSession('HR_MANAGER')
    expect(await createFileStorage(validBody)).toEqual({ error: 'Forbidden' })
  })

  it('returns validation errors for invalid body', async () => {
    mockSession('ADMIN')
    const result = await createFileStorage({ storageType: 'Dropbox' })
    expect(result).toHaveProperty('error')
    expect(result!.error).not.toBe('Unauthorized')
    expect(result!.error).not.toBe('Forbidden')
  })

  it('calls prisma.fileStorage.create on success for ADMIN', async () => {
    mockSession('ADMIN')
    vi.mocked(prisma.fileStorage.create).mockResolvedValue({} as any)
    const result = await createFileStorage(validBody)
    expect(prisma.fileStorage.create).toHaveBeenCalledOnce()
    expect(result).toBeUndefined()
  })

  it('calls prisma.fileStorage.create on success for IT_STAFF', async () => {
    mockSession('IT_STAFF')
    vi.mocked(prisma.fileStorage.create).mockResolvedValue({} as any)
    await createFileStorage(validBody)
    expect(prisma.fileStorage.create).toHaveBeenCalledOnce()
  })
})

describe('updateFileStorage', () => {
  it('returns Unauthorized with no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await updateFileStorage('id-1', validBody)).toEqual({ error: 'Unauthorized' })
  })

  it('returns Forbidden for non-privileged role', async () => {
    mockSession('DEPARTMENT_MANAGER')
    expect(await updateFileStorage('id-1', validBody)).toEqual({ error: 'Forbidden' })
  })

  it('calls prisma.fileStorage.update with the correct id', async () => {
    mockSession('ADMIN')
    vi.mocked(prisma.fileStorage.update).mockResolvedValue({} as any)
    await updateFileStorage('id-42', validBody)
    expect(prisma.fileStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'id-42' } })
    )
  })
})

describe('deleteFileStorage', () => {
  it('returns Unauthorized with no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    expect(await deleteFileStorage('id-1')).toEqual({ error: 'Unauthorized' })
  })

  it('returns Forbidden for non-privileged role', async () => {
    mockSession('EMPLOYEE')
    expect(await deleteFileStorage('id-1')).toEqual({ error: 'Forbidden' })
  })

  it('calls prisma.fileStorage.delete with the correct id', async () => {
    mockSession('IT_STAFF')
    vi.mocked(prisma.fileStorage.delete).mockResolvedValue({} as any)
    await deleteFileStorage('id-99')
    expect(prisma.fileStorage.delete).toHaveBeenCalledWith({ where: { id: 'id-99' } })
  })
})
