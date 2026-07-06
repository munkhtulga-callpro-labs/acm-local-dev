import { describe, it, expect, vi, afterEach } from 'vitest'

const nextAuthMock = vi.hoisted(() => ({ getServerSession: vi.fn() }))
vi.mock('next-auth', () => ({ getServerSession: nextAuthMock.getServerSession }))

const cacheMock = vi.hoisted(() => ({ updateTag: vi.fn() }))
vi.mock('next/cache', () => ({ updateTag: cacheMock.updateTag }))

import { prisma } from '@/lib/prisma'
import {
  createFileStorage,
  updateFileStorage,
  deleteFileStorage,
} from '@/lib/actions/file-storage'

function mockSession(role: string) {
  nextAuthMock.getServerSession.mockResolvedValue({
    user: { id: 'user-1', email: 'it@integration.test', role },
  })
}

const validBody = {
  storageType: 'S3',
  pathLocation: 's3://integration-test-bucket/path',
  permissionLevel: 'Read',
  status: 'ACTIVE',
}

describe('file-storage actions (real Postgres)', () => {
  const recordIds: string[] = []

  afterEach(async () => {
    nextAuthMock.getServerSession.mockReset()
    cacheMock.updateTag.mockClear()
    if (recordIds.length > 0) {
      await prisma.fileStorage.deleteMany({ where: { id: { in: recordIds } } })
      recordIds.length = 0
    }
  })

  describe('createFileStorage', () => {
    it('returns Unauthorized with no session and creates nothing', async () => {
      nextAuthMock.getServerSession.mockResolvedValue(null)
      const result = await createFileStorage(validBody)
      expect(result).toEqual({ error: 'Unauthorized' })
      expect(
        await prisma.fileStorage.count({ where: { pathLocation: validBody.pathLocation } })
      ).toBe(0)
    })

    it('returns Forbidden for a non-privileged role and creates nothing', async () => {
      mockSession('EMPLOYEE')
      const result = await createFileStorage(validBody)
      expect(result).toEqual({ error: 'Forbidden' })
      expect(
        await prisma.fileStorage.count({ where: { pathLocation: validBody.pathLocation } })
      ).toBe(0)
    })

    it('returns validation errors for an invalid body', async () => {
      mockSession('ADMIN')
      const result = await createFileStorage({ storageType: 'Dropbox' })
      expect(result).toHaveProperty('error')
    })

    it('creates a real row for a privileged role and normalizes optional fields', async () => {
      mockSession('ADMIN')
      const result = await createFileStorage(validBody)
      expect(result).toBeUndefined()

      const stored = await prisma.fileStorage.findFirst({
        where: { pathLocation: validBody.pathLocation },
      })
      expect(stored).not.toBeNull()
      recordIds.push(stored!.id)
      expect(stored?.storageType).toBe('S3')
      expect(stored?.quotaLimit).toBeNull()
      expect(stored?.assignedTo).toBeNull()
      expect(stored?.expiryDate).toBeNull()
      expect(cacheMock.updateTag).toHaveBeenCalledWith('file-storage')
    })

    it('accepts IT_STAFF as a privileged role', async () => {
      mockSession('IT_STAFF')
      const result = await createFileStorage({
        ...validBody,
        pathLocation: 's3://integration-test-bucket/path-2',
      })
      expect(result).toBeUndefined()
      const stored = await prisma.fileStorage.findFirst({
        where: { pathLocation: 's3://integration-test-bucket/path-2' },
      })
      expect(stored).not.toBeNull()
      recordIds.push(stored!.id)
    })
  })

  describe('updateFileStorage', () => {
    it('updates a real row for a privileged role', async () => {
      mockSession('ADMIN')
      await createFileStorage(validBody)
      const created = await prisma.fileStorage.findFirst({
        where: { pathLocation: validBody.pathLocation },
      })
      recordIds.push(created!.id)

      const result = await updateFileStorage(created!.id, {
        ...validBody,
        permissionLevel: 'Full Control',
      })
      expect(result).toBeUndefined()

      const updated = await prisma.fileStorage.findUnique({ where: { id: created!.id } })
      expect(updated?.permissionLevel).toBe('Full Control')
    })

    it('returns Forbidden for a non-privileged role and does not modify the row', async () => {
      mockSession('ADMIN')
      await createFileStorage(validBody)
      const created = await prisma.fileStorage.findFirst({
        where: { pathLocation: validBody.pathLocation },
      })
      recordIds.push(created!.id)

      mockSession('DEPARTMENT_MANAGER')
      const result = await updateFileStorage(created!.id, {
        ...validBody,
        permissionLevel: 'Full Control',
      })
      expect(result).toEqual({ error: 'Forbidden' })

      const unchanged = await prisma.fileStorage.findUnique({ where: { id: created!.id } })
      expect(unchanged?.permissionLevel).toBe('Read')
    })
  })

  describe('deleteFileStorage', () => {
    it('deletes a real row for a privileged role', async () => {
      mockSession('ADMIN')
      await createFileStorage(validBody)
      const created = await prisma.fileStorage.findFirst({
        where: { pathLocation: validBody.pathLocation },
      })

      const result = await deleteFileStorage(created!.id)
      expect(result).toBeUndefined()
      expect(await prisma.fileStorage.findUnique({ where: { id: created!.id } })).toBeNull()
    })

    it('returns Forbidden and does not delete for a non-privileged role', async () => {
      mockSession('ADMIN')
      await createFileStorage(validBody)
      const created = await prisma.fileStorage.findFirst({
        where: { pathLocation: validBody.pathLocation },
      })
      recordIds.push(created!.id)

      mockSession('EMPLOYEE')
      const result = await deleteFileStorage(created!.id)
      expect(result).toEqual({ error: 'Forbidden' })
      expect(await prisma.fileStorage.findUnique({ where: { id: created!.id } })).not.toBeNull()
    })
  })
})
