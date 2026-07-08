import { describe, it, expect, vi, afterEach } from 'vitest'

const nextAuthMock = vi.hoisted(() => ({ getServerSession: vi.fn() }))
vi.mock('next-auth', () => ({ getServerSession: nextAuthMock.getServerSession }))

const cacheMock = vi.hoisted(() => ({ updateTag: vi.fn() }))
vi.mock('next/cache', () => ({ updateTag: cacheMock.updateTag }))

import { prisma } from '@/lib/prisma'
import {
  createPhysicalAccess,
  updatePhysicalAccess,
  deletePhysicalAccess,
} from '@/lib/actions/physical-access'

function mockSession(role: string) {
  nextAuthMock.getServerSession.mockResolvedValue({
    user: { id: 'user-1', email: 'it@integration.test', role },
  })
}

const validBody = {
  location: 'Server Room A',
  accessType: 'Badge',
  accessSchedule: '24/7',
  accessZones: 'Zone A',
  validFrom: '2024-01-01',
  status: 'ACTIVE',
  escortRequired: false,
}

describe('physical-access actions (real Postgres)', () => {
  const recordIds: string[] = []

  afterEach(async () => {
    nextAuthMock.getServerSession.mockReset()
    cacheMock.updateTag.mockClear()
    if (recordIds.length > 0) {
      await prisma.physicalAccess.deleteMany({ where: { id: { in: recordIds } } })
      recordIds.length = 0
    }
  })

  describe('createPhysicalAccess', () => {
    it('returns Unauthorized with no session and creates nothing', async () => {
      nextAuthMock.getServerSession.mockResolvedValue(null)
      const result = await createPhysicalAccess(validBody)
      expect(result).toEqual({ error: 'Unauthorized' })
      expect(await prisma.physicalAccess.count({ where: { location: 'Server Room A' } })).toBe(0)
    })

    it('returns Forbidden for a non-privileged role and creates nothing', async () => {
      mockSession('EMPLOYEE')
      const result = await createPhysicalAccess(validBody)
      expect(result).toEqual({ error: 'Forbidden' })
      expect(await prisma.physicalAccess.count({ where: { location: 'Server Room A' } })).toBe(0)
    })

    it('returns validation errors for an invalid body', async () => {
      mockSession('ADMIN')
      const result = await createPhysicalAccess({ location: '' })
      expect(result).toHaveProperty('error')
    })

    it('creates a real row for a privileged role and normalizes optional fields', async () => {
      mockSession('ADMIN')
      const result = await createPhysicalAccess(validBody)
      expect(result).toBeUndefined()

      const stored = await prisma.physicalAccess.findFirst({ where: { location: 'Server Room A' } })
      expect(stored).not.toBeNull()
      recordIds.push(stored!.id)
      expect(stored?.accessType).toBe('Badge')
      expect(stored?.badgeCardNumber).toBeNull()
      expect(stored?.assignedTo).toBeNull()
      expect(stored?.validFrom.toISOString().slice(0, 10)).toBe('2024-01-01')
      expect(cacheMock.updateTag).toHaveBeenCalledWith('physical-access')
    })

    it('accepts IT_STAFF as a privileged role', async () => {
      mockSession('IT_STAFF')
      const result = await createPhysicalAccess({ ...validBody, location: 'Server Room B' })
      expect(result).toBeUndefined()
      const stored = await prisma.physicalAccess.findFirst({ where: { location: 'Server Room B' } })
      expect(stored).not.toBeNull()
      recordIds.push(stored!.id)
    })
  })

  describe('updatePhysicalAccess', () => {
    it('updates a real row for a privileged role', async () => {
      mockSession('ADMIN')
      await createPhysicalAccess(validBody)
      const created = await prisma.physicalAccess.findFirst({ where: { location: 'Server Room A' } })
      recordIds.push(created!.id)

      const result = await updatePhysicalAccess(created!.id, {
        ...validBody,
        location: 'Server Room A - Renamed',
        escortRequired: true,
      })
      expect(result).toBeUndefined()

      const updated = await prisma.physicalAccess.findUnique({ where: { id: created!.id } })
      expect(updated?.location).toBe('Server Room A - Renamed')
      expect(updated?.escortRequired).toBe(true)
    })

    it('returns Forbidden for a non-privileged role and does not modify the row', async () => {
      mockSession('ADMIN')
      await createPhysicalAccess(validBody)
      const created = await prisma.physicalAccess.findFirst({ where: { location: 'Server Room A' } })
      recordIds.push(created!.id)

      mockSession('HR_MANAGER')
      const result = await updatePhysicalAccess(created!.id, { ...validBody, location: 'Hacked' })
      expect(result).toEqual({ error: 'Forbidden' })

      const unchanged = await prisma.physicalAccess.findUnique({ where: { id: created!.id } })
      expect(unchanged?.location).toBe('Server Room A')
    })
  })

  describe('deletePhysicalAccess', () => {
    it('deletes a real row for a privileged role', async () => {
      mockSession('ADMIN')
      await createPhysicalAccess(validBody)
      const created = await prisma.physicalAccess.findFirst({ where: { location: 'Server Room A' } })

      const result = await deletePhysicalAccess(created!.id)
      expect(result).toBeUndefined()
      expect(await prisma.physicalAccess.findUnique({ where: { id: created!.id } })).toBeNull()
    })

    it('returns Forbidden and does not delete for a non-privileged role', async () => {
      mockSession('ADMIN')
      await createPhysicalAccess(validBody)
      const created = await prisma.physicalAccess.findFirst({ where: { location: 'Server Room A' } })
      recordIds.push(created!.id)

      mockSession('DEPARTMENT_MANAGER')
      const result = await deletePhysicalAccess(created!.id)
      expect(result).toEqual({ error: 'Forbidden' })
      expect(await prisma.physicalAccess.findUnique({ where: { id: created!.id } })).not.toBeNull()
    })
  })
})
