import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'

const { sendEmail } = vi.hoisted(() => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test' }),
}))
vi.mock('@/lib/email', () => ({ sendEmail }))

import { prisma } from '@/lib/prisma'
import { AccessService } from '@/services/access-service'
import { ExpiryService } from '@/services/expiry-service'

function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

describe('ExpiryService (real Postgres)', () => {
  let employee: { id: string; email: string }
  let system: { id: string }
  let systemB: { id: string }
  let user: { id: string }
  const permissionIds: string[] = []

  beforeAll(async () => {
    user = await prisma.user.create({
      data: { email: 'expiry-svc@integration.test', role: 'EMPLOYEE', isActive: true },
    })

    employee = await prisma.employee.create({
      data: {
        employeeId: 'INT-EXPIRY-SVC',
        firstName: 'Eve',
        lastName: 'Expiry',
        email: 'expiry-svc@integration.test',
        department: 'Engineering',
        position: 'Developer',
        startDate: new Date(),
        userId: user.id,
      },
    })

    system = await prisma.system.create({
      data: { name: 'Expiry Service Test System', category: 'INFRASTRUCTURE' },
    })
    systemB = await prisma.system.create({
      data: { name: 'Expiry Service Test System B', category: 'DEVELOPMENT' },
    })
  })

  afterEach(async () => {
    sendEmail.mockClear()
    if (permissionIds.length === 0) return
    await prisma.auditLog.deleteMany({ where: { entityId: { in: permissionIds } } })
    await prisma.accessPermission.deleteMany({ where: { id: { in: permissionIds } } })
    permissionIds.length = 0
  })

  afterAll(async () => {
    await prisma.employee.delete({ where: { id: employee.id } })
    await prisma.system.delete({ where: { id: system.id } })
    await prisma.system.delete({ where: { id: systemB.id } })
    await prisma.user.delete({ where: { id: user.id } })
  })

  it('sends a reminder and logs EXPIRY_REMINDER_SENT for a permission expiring within the window', async () => {
    const permission = await AccessService.createAccessPermission({
      employeeId: employee.id,
      systemId: system.id,
      accessLevel: 'READ',
      grantedBy: user.id,
      expiresAt: daysFromNow(3),
    })
    permissionIds.push(permission.id)

    await ExpiryService.checkExpiringAccess(7)

    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0][0].to).toBe(employee.email)

    const logs = await prisma.auditLog.findMany({
      where: { entityId: permission.id, action: 'EXPIRY_REMINDER_SENT' },
    })
    expect(logs).toHaveLength(1)
  })

  it('does not send a duplicate reminder within 24 hours of the last one', async () => {
    const permission = await AccessService.createAccessPermission({
      employeeId: employee.id,
      systemId: system.id,
      accessLevel: 'READ',
      grantedBy: user.id,
      expiresAt: daysFromNow(1),
    })
    permissionIds.push(permission.id)

    await ExpiryService.checkExpiringAccess(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)

    sendEmail.mockClear()
    await ExpiryService.checkExpiringAccess(1)
    expect(sendEmail).not.toHaveBeenCalled()

    const logs = await prisma.auditLog.findMany({
      where: { entityId: permission.id, action: 'EXPIRY_REMINDER_SENT' },
    })
    expect(logs).toHaveLength(1)
  })

  it('does not send a reminder for a permission far outside any milestone window', async () => {
    const permission = await AccessService.createAccessPermission({
      employeeId: employee.id,
      systemId: system.id,
      accessLevel: 'READ',
      grantedBy: user.id,
      expiresAt: daysFromNow(20),
    })
    permissionIds.push(permission.id)

    await ExpiryService.checkExpiringAccess(7)

    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('revokes expired access without crashing on the automated actor path', async () => {
    const expired = await AccessService.createAccessPermission({
      employeeId: employee.id,
      systemId: system.id,
      accessLevel: 'READ',
      grantedBy: user.id,
      expiresAt: daysFromNow(-1),
    })
    permissionIds.push(expired.id)

    const count = await ExpiryService.revokeExpiredAccess()
    expect(count).toBeGreaterThanOrEqual(1)

    const stored = await prisma.accessPermission.findUnique({ where: { id: expired.id } })
    expect(stored?.isActive).toBe(false)
    expect(stored?.revokedBy).toBeNull()
  })

  it('builds an expiry report combining expiring and expired permissions', async () => {
    const expiring = await AccessService.createAccessPermission({
      employeeId: employee.id,
      systemId: system.id,
      accessLevel: 'READ',
      grantedBy: user.id,
      expiresAt: daysFromNow(10),
    })
    const expired = await AccessService.createAccessPermission({
      employeeId: employee.id,
      systemId: systemB.id,
      accessLevel: 'WRITE',
      grantedBy: user.id,
      expiresAt: daysFromNow(-3),
    })
    permissionIds.push(expiring.id, expired.id)

    const report = await ExpiryService.getExpiryReport()

    const expiringEntry = report.expiring.find(e => e.permission.id === expiring.id)
    expect(expiringEntry).toBeDefined()
    expect(expiringEntry?.daysUntilExpiry).toBeGreaterThanOrEqual(9)

    expect(report.expired.map((p: any) => p.id)).toContain(expired.id)
    expect(report.expiring.map(e => e.permission.id)).not.toContain(expired.id)
  })

  it('extends access and logs EXTEND_ACCESS with the real actor id', async () => {
    const permission = await AccessService.createAccessPermission({
      employeeId: employee.id,
      systemId: system.id,
      accessLevel: 'READ',
      grantedBy: user.id,
      expiresAt: daysFromNow(2),
    })
    permissionIds.push(permission.id)

    const newExpiry = daysFromNow(60)
    await ExpiryService.extendAccess({
      permissionId: permission.id,
      newExpiryDate: newExpiry,
      extendedBy: user.id,
    })

    const stored = await prisma.accessPermission.findUnique({ where: { id: permission.id } })
    expect(stored?.expiresAt?.toDateString()).toBe(newExpiry.toDateString())

    const log = await prisma.auditLog.findFirst({
      where: { entityId: permission.id, action: 'EXTEND_ACCESS' },
    })
    expect(log?.userId).toBe(user.id)
  })

  it('runs the full scheduled check without crashing end to end', async () => {
    const expiringSoon = await AccessService.createAccessPermission({
      employeeId: employee.id,
      systemId: system.id,
      accessLevel: 'READ',
      grantedBy: user.id,
      expiresAt: daysFromNow(1),
    })
    const alreadyExpired = await AccessService.createAccessPermission({
      employeeId: employee.id,
      systemId: systemB.id,
      accessLevel: 'WRITE',
      grantedBy: user.id,
      expiresAt: daysFromNow(-1),
    })
    permissionIds.push(expiringSoon.id, alreadyExpired.id)

    await expect(ExpiryService.scheduleExpiryChecks()).resolves.not.toThrow()

    expect(sendEmail).toHaveBeenCalled()

    const revoked = await prisma.accessPermission.findUnique({ where: { id: alreadyExpired.id } })
    expect(revoked?.isActive).toBe(false)
  })
})
