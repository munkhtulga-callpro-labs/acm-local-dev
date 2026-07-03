import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AccessPermissionWithRelations } from '@/types'
import type { AuditLog } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: { findFirst: vi.fn(), create: vi.fn() },
    accessPermission: { update: vi.fn() },
  },
}))

vi.mock('@/services/access-service', () => ({
  AccessService: { getExpiringAccess: vi.fn(), getExpiredAccess: vi.fn(), revokeExpiredAccess: vi.fn() },
}))

vi.mock('@/services/email-service', () => ({
  EmailService: { sendExpiryReminderNotification: vi.fn() },
}))

import { prisma } from '@/lib/prisma'
import { AccessService } from '@/services/access-service'
import { EmailService } from '@/services/email-service'
import { ExpiryService } from '@/services/expiry-service'

function permissionExpiringInDays(days: number): AccessPermissionWithRelations {
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return {
    id: `perm-${days}`,
    expiresAt,
    employee: { id: 'emp-1' },
    system: { id: 'sys-1' },
  } as unknown as AccessPermissionWithRelations
}

describe('ExpiryService.checkExpiringAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null)
  })

  it.each([8, 0, -1])(
    'does not send a reminder when %i days remain (outside all reminder windows)',
    async (days) => {
      vi.mocked(AccessService.getExpiringAccess).mockResolvedValue([permissionExpiringInDays(days)])

      await ExpiryService.checkExpiringAccess(7)

      expect(EmailService.sendExpiryReminderNotification).not.toHaveBeenCalled()
    }
  )

  it.each([7, 3, 1])('sends a reminder when %i days remain', async (days) => {
    vi.mocked(AccessService.getExpiringAccess).mockResolvedValue([permissionExpiringInDays(days)])

    await ExpiryService.checkExpiringAccess(7)

    expect(EmailService.sendExpiryReminderNotification).toHaveBeenCalledTimes(1)
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'EXPIRY_REMINDER_SENT', entityId: `perm-${days}` }),
      })
    )
  })

  it('skips sending a reminder if one was already sent within the last 24 hours', async () => {
    vi.mocked(AccessService.getExpiringAccess).mockResolvedValue([permissionExpiringInDays(3)])
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue({ id: 'log-1' } as unknown as AuditLog)

    await ExpiryService.checkExpiringAccess(7)

    expect(EmailService.sendExpiryReminderNotification).not.toHaveBeenCalled()
    expect(prisma.auditLog.create).not.toHaveBeenCalled()
  })
})

describe('ExpiryService.revokeExpiredAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates to AccessService and returns the revoked count', async () => {
    vi.mocked(AccessService.revokeExpiredAccess).mockResolvedValue(4)

    const count = await ExpiryService.revokeExpiredAccess()

    expect(count).toBe(4)
    expect(AccessService.revokeExpiredAccess).toHaveBeenCalledTimes(1)
  })
})

describe('ExpiryService.getExpiryReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pairs expiring permissions with their days-until-expiry and includes expired ones as-is', async () => {
    const expiring = permissionExpiringInDays(5)
    const expired = permissionExpiringInDays(-10)
    vi.mocked(AccessService.getExpiringAccess).mockResolvedValue([expiring])
    vi.mocked(AccessService.getExpiredAccess).mockResolvedValue([expired])

    const report = await ExpiryService.getExpiryReport()

    expect(AccessService.getExpiringAccess).toHaveBeenCalledWith(30)
    expect(report.expiring).toHaveLength(1)
    expect(report.expiring[0].permission).toBe(expiring)
    expect(report.expiring[0].daysUntilExpiry).toBeGreaterThanOrEqual(4)
    expect(report.expiring[0].daysUntilExpiry).toBeLessThanOrEqual(5)
    expect(report.expired).toEqual([expired])
  })
})

describe('ExpiryService.extendAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates the expiry date and logs an EXTEND_ACCESS audit entry', async () => {
    const newExpiryDate = new Date('2027-01-01')

    await ExpiryService.extendAccess({
      permissionId: 'perm-1',
      newExpiryDate,
      extendedBy: 'admin-1',
    })

    expect(prisma.accessPermission.update).toHaveBeenCalledWith({
      where: { id: 'perm-1' },
      data: { expiresAt: newExpiryDate },
    })
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'EXTEND_ACCESS',
          entityId: 'perm-1',
          userId: 'admin-1',
          newValues: { expiresAt: newExpiryDate },
        }),
      })
    )
  })
})

describe('ExpiryService.scheduleExpiryChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('checks the 7/3/1 day windows in order and then revokes expired access', async () => {
    const checkSpy = vi.spyOn(ExpiryService, 'checkExpiringAccess').mockResolvedValue(undefined)
    const revokeSpy = vi.spyOn(ExpiryService, 'revokeExpiredAccess').mockResolvedValue(0)

    await ExpiryService.scheduleExpiryChecks()

    expect(checkSpy.mock.calls).toEqual([[7], [3], [1]])
    expect(revokeSpy).toHaveBeenCalledTimes(1)
  })
})
