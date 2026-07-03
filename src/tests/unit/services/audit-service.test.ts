import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: { create: vi.fn(), findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { AuditService } from '@/services/audit-service'

describe('AuditService.logAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an audit log entry with the given fields', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)

    const result = await AuditService.logAction({
      action: 'CREATE_ACCESS',
      entityType: 'AccessPermission',
      entityId: 'perm-1',
      userId: 'admin-1',
      employeeId: 'emp-1',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CREATE_ACCESS',
          entityType: 'AccessPermission',
          entityId: 'perm-1',
          userId: 'admin-1',
          employeeId: 'emp-1',
        }),
      })
    )
    expect(result.id).toBe('log-1')
  })
})

describe('AuditService.getAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0)
  })

  it('builds an empty where clause and default pagination when no filters are given', async () => {
    await AuditService.getAuditLogs()

    const findManyCall = vi.mocked(prisma.auditLog.findMany).mock.calls[0][0] as any
    expect(findManyCall.where).toEqual({})
    expect(findManyCall.skip).toBe(0)
    expect(findManyCall.take).toBe(10)
    expect(prisma.auditLog.count).toHaveBeenCalledWith({ where: {} })
  })

  it('filters by action, entityType, and userId when provided', async () => {
    await AuditService.getAuditLogs({ action: 'CREATE_ACCESS', entityType: 'AccessPermission', userId: 'user-1' })

    const findManyCall = vi.mocked(prisma.auditLog.findMany).mock.calls[0][0] as any
    expect(findManyCall.where).toEqual({
      action: 'CREATE_ACCESS',
      entityType: 'AccessPermission',
      userId: 'user-1',
    })
  })

  it('builds a createdAt range filter from startDate and endDate', async () => {
    const startDate = new Date('2026-01-01')
    const endDate = new Date('2026-01-31')

    await AuditService.getAuditLogs({ startDate, endDate })

    const findManyCall = vi.mocked(prisma.auditLog.findMany).mock.calls[0][0] as any
    expect(findManyCall.where.createdAt).toEqual({ gte: startDate, lte: endDate })
  })

  it('applies only the provided half of the date range', async () => {
    const startDate = new Date('2026-01-01')

    await AuditService.getAuditLogs({ startDate })

    const findManyCall = vi.mocked(prisma.auditLog.findMany).mock.calls[0][0] as any
    expect(findManyCall.where.createdAt).toEqual({ gte: startDate })
  })

  it('paginates using page and limit to compute skip', async () => {
    await AuditService.getAuditLogs({ page: 3, limit: 20 })

    const findManyCall = vi.mocked(prisma.auditLog.findMany).mock.calls[0][0] as any
    expect(findManyCall.skip).toBe(40)
    expect(findManyCall.take).toBe(20)
  })

  it('returns data alongside pagination metadata with totalPages rounded up', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([{ id: 'log-1' }] as any)
    vi.mocked(prisma.auditLog.count).mockResolvedValue(25)

    const result = await AuditService.getAuditLogs({ page: 2, limit: 10 })

    expect(result).toEqual({
      data: [{ id: 'log-1' }],
      pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
    })
  })
})

describe('AuditService.getAuditLogById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the log when found', async () => {
    vi.mocked(prisma.auditLog.findUnique).mockResolvedValue({ id: 'log-1' } as any)

    const result = await AuditService.getAuditLogById('log-1')

    expect(prisma.auditLog.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'log-1' } })
    )
    expect(result).toEqual({ id: 'log-1' })
  })

  it('returns null when not found', async () => {
    vi.mocked(prisma.auditLog.findUnique).mockResolvedValue(null)

    const result = await AuditService.getAuditLogById('missing')

    expect(result).toBeNull()
  })
})

describe('AuditService.getRecentActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defaults to the 10 most recent entries', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

    await AuditService.getRecentActivity()

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    )
  })

  it('respects a custom limit', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])

    await AuditService.getRecentActivity(5)

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    )
  })
})
