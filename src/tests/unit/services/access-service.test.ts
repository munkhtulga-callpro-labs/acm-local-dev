import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AccessPermission, Employee, System } from '@prisma/client'

type ExpiryFindManyArgs = {
  where: { isActive: boolean; expiresAt: { gte?: Date; lte?: Date; lt?: Date } }
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    accessPermission: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    employee: { findMany: vi.fn() },
    system: { findMany: vi.fn() },
  },
}))

vi.mock('@/services/audit-service', () => ({
  AuditService: { logAction: vi.fn() },
}))

import { prisma } from '@/lib/prisma'
import { AuditService } from '@/services/audit-service'
import { AccessService } from '@/services/access-service'

describe('AccessService.getAccessPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.accessPermission.findMany).mockResolvedValue([])
  })

  it('queries with an empty where clause when no filters are given', async () => {
    await AccessService.getAccessPermissions()

    expect(prisma.accessPermission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it('filters by employeeId alone', async () => {
    await AccessService.getAccessPermissions({ employeeId: 'emp-1' })

    expect(prisma.accessPermission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { employeeId: 'emp-1' } })
    )
  })

  it('filters by systemId alone', async () => {
    await AccessService.getAccessPermissions({ systemId: 'sys-1' })

    expect(prisma.accessPermission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { systemId: 'sys-1' } })
    )
  })

  it('filters by isActive: false without it being dropped as falsy', async () => {
    await AccessService.getAccessPermissions({ isActive: false })

    expect(prisma.accessPermission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: false } })
    )
  })

  it('combines all three filters when provided together', async () => {
    await AccessService.getAccessPermissions({
      employeeId: 'emp-1',
      systemId: 'sys-1',
      isActive: true,
    })

    expect(prisma.accessPermission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { employeeId: 'emp-1', systemId: 'sys-1', isActive: true },
      })
    )
  })
})

describe('AccessService.createAccessPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the permission and logs a CREATE_ACCESS audit entry', async () => {
    vi.mocked(prisma.accessPermission.create).mockResolvedValue({
      id: 'perm-1',
      employeeId: 'emp-1',
      systemId: 'sys-1',
      accessLevel: 'READ',
    } as unknown as AccessPermission)

    const result = await AccessService.createAccessPermission({
      employeeId: 'emp-1',
      systemId: 'sys-1',
      accessLevel: 'READ',
      grantedBy: 'admin-1',
    })

    expect(AuditService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE_ACCESS',
        entityType: 'AccessPermission',
        entityId: 'perm-1',
        userId: 'admin-1',
        employeeId: 'emp-1',
      })
    )
    expect(result.id).toBe('perm-1')
  })
})

describe('AccessService.updateAccessPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs old and new values on update', async () => {
    vi.mocked(prisma.accessPermission.findUnique).mockResolvedValue({
      id: 'perm-1',
      accessLevel: 'READ',
    } as unknown as AccessPermission)
    vi.mocked(prisma.accessPermission.update).mockResolvedValue({
      id: 'perm-1',
      employeeId: 'emp-1',
      accessLevel: 'WRITE',
    } as unknown as AccessPermission)

    const result = await AccessService.updateAccessPermission({
      id: 'perm-1',
      accessLevel: 'WRITE',
      updatedBy: 'admin-1',
    })

    expect(AuditService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE_ACCESS',
        entityId: 'perm-1',
        oldValues: expect.objectContaining({ accessLevel: 'READ' }),
        newValues: expect.objectContaining({ accessLevel: 'WRITE' }),
        userId: 'admin-1',
        employeeId: 'emp-1',
      })
    )
    expect(result.accessLevel).toBe('WRITE')
  })
})

describe('AccessService.revokeAccessPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deactivates the permission and logs a REVOKE_ACCESS audit entry', async () => {
    vi.mocked(prisma.accessPermission.findUnique).mockResolvedValue({
      id: 'perm-1',
      isActive: true,
    } as unknown as AccessPermission)
    vi.mocked(prisma.accessPermission.update).mockResolvedValue({
      id: 'perm-1',
      employeeId: 'emp-1',
      isActive: false,
      revokedBy: 'admin-1',
    } as unknown as AccessPermission)

    const result = await AccessService.revokeAccessPermission({
      id: 'perm-1',
      revokedBy: 'admin-1',
    })

    expect(prisma.accessPermission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'perm-1' },
        data: expect.objectContaining({ isActive: false, revokedBy: 'admin-1' }),
      })
    )
    expect(AuditService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'REVOKE_ACCESS', entityId: 'perm-1', userId: 'admin-1' })
    )
    expect(result.isActive).toBe(false)
  })
})

describe('AccessService.getAccessMatrix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pairs each active employee with a permission (or none) per active system', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([
      {
        id: 'emp-1',
        accessPermissions: [{ systemId: 'sys-1', accessLevel: 'READ' }],
      },
      {
        id: 'emp-2',
        accessPermissions: [],
      },
    ] as unknown as Employee[])
    vi.mocked(prisma.system.findMany).mockResolvedValue([
      { id: 'sys-1', name: 'GitHub' },
      { id: 'sys-2', name: 'AWS' },
    ] as unknown as System[])

    const matrix = await AccessService.getAccessMatrix()

    expect(matrix).toHaveLength(2)
    expect(matrix[0].systems).toEqual([
      { system: { id: 'sys-1', name: 'GitHub' }, permission: { systemId: 'sys-1', accessLevel: 'READ' } },
      { system: { id: 'sys-2', name: 'AWS' }, permission: undefined },
    ])
    expect(matrix[1].systems.every((s) => s.permission === undefined)).toBe(true)
  })
})

describe('AccessService.getExpiringAccess / getExpiredAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queries for active permissions expiring within the given window', async () => {
    vi.mocked(prisma.accessPermission.findMany).mockResolvedValue([])

    await AccessService.getExpiringAccess(14)

    const call = vi.mocked(prisma.accessPermission.findMany).mock
      .calls[0][0] as unknown as ExpiryFindManyArgs
    expect(call.where.isActive).toBe(true)
    expect(call.where.expiresAt.gte).toBeInstanceOf(Date)
    expect(call.where.expiresAt.lte).toBeInstanceOf(Date)
    expect(call.where.expiresAt.lte!.getTime()).toBeGreaterThan(call.where.expiresAt.gte!.getTime())
  })

  it('queries for active permissions with an expiresAt in the past', async () => {
    vi.mocked(prisma.accessPermission.findMany).mockResolvedValue([])

    await AccessService.getExpiredAccess()

    const call = vi.mocked(prisma.accessPermission.findMany).mock
      .calls[0][0] as unknown as ExpiryFindManyArgs
    expect(call.where.isActive).toBe(true)
    expect(call.where.expiresAt.lt).toBeInstanceOf(Date)
  })
})

describe('AccessService.revokeExpiredAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revokes every expired permission and returns the count', async () => {
    vi.mocked(prisma.accessPermission.findMany).mockResolvedValue([
      { id: 'perm-1' },
      { id: 'perm-2' },
    ] as unknown as AccessPermission[])
    vi.mocked(prisma.accessPermission.findUnique).mockResolvedValue(
      { id: 'perm-x' } as unknown as AccessPermission
    )
    vi.mocked(prisma.accessPermission.update).mockResolvedValue({
      id: 'perm-x',
      employeeId: 'emp-1',
    } as unknown as AccessPermission)

    const count = await AccessService.revokeExpiredAccess()

    expect(count).toBe(2)
    expect(prisma.accessPermission.update).toHaveBeenCalledTimes(2)
    expect(prisma.accessPermission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'perm-1' },
        data: expect.objectContaining({ revokedBy: null }),
      })
    )
    expect(prisma.accessPermission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'perm-2' },
        data: expect.objectContaining({ revokedBy: null }),
      })
    )
  })

  it('returns 0 and revokes nothing when there is no expired access', async () => {
    vi.mocked(prisma.accessPermission.findMany).mockResolvedValue([])

    const count = await AccessService.revokeExpiredAccess()

    expect(count).toBe(0)
    expect(prisma.accessPermission.update).not.toHaveBeenCalled()
  })
})
