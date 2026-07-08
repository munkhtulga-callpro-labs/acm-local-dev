import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'

import { prisma } from '@/lib/prisma'
import { AccessService } from '@/services/access-service'

function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

describe('AccessService (real Postgres)', () => {
  let employeeA: { id: string }
  let employeeB: { id: string }
  let systemA: { id: string }
  let systemB: { id: string }
  let userA: { id: string }
  let userB: { id: string }
  const permissionIds: string[] = []

  beforeAll(async () => {
    userA = await prisma.user.create({
      data: { email: 'access-svc-a@integration.test', role: 'EMPLOYEE', isActive: true },
    })
    userB = await prisma.user.create({
      data: { email: 'access-svc-b@integration.test', role: 'EMPLOYEE', isActive: true },
    })

    employeeA = await prisma.employee.create({
      data: {
        employeeId: 'INT-ACC-SVC-A',
        firstName: 'Ada',
        lastName: 'Alpha',
        email: 'access-svc-a@integration.test',
        department: 'Engineering',
        position: 'Developer',
        startDate: new Date(),
        userId: userA.id,
      },
    })
    employeeB = await prisma.employee.create({
      data: {
        employeeId: 'INT-ACC-SVC-B',
        firstName: 'Bea',
        lastName: 'Beta',
        email: 'access-svc-b@integration.test',
        department: 'Engineering',
        position: 'Developer',
        startDate: new Date(),
        userId: userB.id,
      },
    })

    systemA = await prisma.system.create({
      data: { name: 'Access Service Test System A', category: 'INFRASTRUCTURE' },
    })
    systemB = await prisma.system.create({
      data: { name: 'Access Service Test System B', category: 'DEVELOPMENT' },
    })
  })

  afterEach(async () => {
    if (permissionIds.length === 0) return
    await prisma.auditLog.deleteMany({ where: { entityId: { in: permissionIds } } })
    await prisma.accessPermission.deleteMany({ where: { id: { in: permissionIds } } })
    permissionIds.length = 0
  })

  afterAll(async () => {
    await prisma.employee.delete({ where: { id: employeeA.id } })
    await prisma.employee.delete({ where: { id: employeeB.id } })
    await prisma.system.delete({ where: { id: systemA.id } })
    await prisma.system.delete({ where: { id: systemB.id } })
    await prisma.user.delete({ where: { id: userA.id } })
    await prisma.user.delete({ where: { id: userB.id } })
  })

  it('creates an access permission and writes a CREATE_ACCESS audit log', async () => {
    const permission = await AccessService.createAccessPermission({
      employeeId: employeeA.id,
      systemId: systemA.id,
      accessLevel: 'READ',
      grantedBy: userA.id,
    })
    permissionIds.push(permission.id)

    const stored = await prisma.accessPermission.findUnique({ where: { id: permission.id } })
    expect(stored).not.toBeNull()
    expect(stored?.employeeId).toBe(employeeA.id)
    expect(stored?.systemId).toBe(systemA.id)
    expect(stored?.isActive).toBe(true)

    const logs = await prisma.auditLog.findMany({
      where: { entityId: permission.id, entityType: 'AccessPermission' },
    })
    expect(logs).toHaveLength(1)
    expect(logs[0].action).toBe('CREATE_ACCESS')
    expect(logs[0].userId).toBe(userA.id)
  })

  it('filters getAccessPermissions by employeeId, systemId, and isActive together', async () => {
    const permA = await AccessService.createAccessPermission({
      employeeId: employeeA.id,
      systemId: systemA.id,
      accessLevel: 'READ',
      grantedBy: userA.id,
    })
    const permB = await AccessService.createAccessPermission({
      employeeId: employeeB.id,
      systemId: systemB.id,
      accessLevel: 'WRITE',
      grantedBy: userB.id,
    })
    permissionIds.push(permA.id, permB.id)

    const byEmployee = await AccessService.getAccessPermissions({ employeeId: employeeA.id })
    expect(byEmployee.map(p => p.id)).toEqual([permA.id])

    const bySystem = await AccessService.getAccessPermissions({ systemId: systemB.id })
    expect(bySystem.map(p => p.id)).toEqual([permB.id])

    await AccessService.revokeAccessPermission({ id: permB.id, revokedBy: userA.id })

    const onlyActive = await AccessService.getAccessPermissions({ isActive: true })
    const activeIds = onlyActive.map(p => p.id)
    expect(activeIds).toContain(permA.id)
    expect(activeIds).not.toContain(permB.id)

    const onlyInactive = await AccessService.getAccessPermissions({ isActive: false })
    expect(onlyInactive.map(p => p.id)).toContain(permB.id)
  })

  it('updates an access permission and records oldValues/newValues on the audit log', async () => {
    const permission = await AccessService.createAccessPermission({
      employeeId: employeeA.id,
      systemId: systemA.id,
      accessLevel: 'READ',
      grantedBy: userA.id,
    })
    permissionIds.push(permission.id)

    const updated = await AccessService.updateAccessPermission({
      id: permission.id,
      accessLevel: 'ADMIN',
      updatedBy: userB.id,
    })

    expect(updated.accessLevel).toBe('ADMIN')

    const log = await prisma.auditLog.findFirst({
      where: { entityId: permission.id, action: 'UPDATE_ACCESS' },
    })
    expect(log).not.toBeNull()
    expect((log?.oldValues as any).accessLevel).toBe('READ')
    expect((log?.newValues as any).accessLevel).toBe('ADMIN')
    expect(log?.userId).toBe(userB.id)
  })

  it('revokes an access permission, setting isActive false and revokedBy/revokedAt', async () => {
    const permission = await AccessService.createAccessPermission({
      employeeId: employeeA.id,
      systemId: systemA.id,
      accessLevel: 'READ',
      grantedBy: userA.id,
    })
    permissionIds.push(permission.id)

    const revoked = await AccessService.revokeAccessPermission({
      id: permission.id,
      revokedBy: userB.id,
    })

    expect(revoked.isActive).toBe(false)
    expect(revoked.revokedBy).toBe(userB.id)
    expect(revoked.revokedAt).not.toBeNull()

    const log = await prisma.auditLog.findFirst({
      where: { entityId: permission.id, action: 'REVOKE_ACCESS' },
    })
    expect(log).not.toBeNull()
  })

  it('separates expiring access from expired access by date window', async () => {
    const expiringSoon = await AccessService.createAccessPermission({
      employeeId: employeeA.id,
      systemId: systemA.id,
      accessLevel: 'READ',
      grantedBy: userA.id,
      expiresAt: daysFromNow(3),
    })
    const alreadyExpired = await AccessService.createAccessPermission({
      employeeId: employeeB.id,
      systemId: systemB.id,
      accessLevel: 'READ',
      grantedBy: userB.id,
      expiresAt: daysFromNow(-1),
    })
    const farInFuture = await AccessService.createAccessPermission({
      employeeId: employeeA.id,
      systemId: systemB.id,
      accessLevel: 'READ',
      grantedBy: userA.id,
      expiresAt: daysFromNow(30),
    })
    permissionIds.push(expiringSoon.id, alreadyExpired.id, farInFuture.id)

    const expiring = await AccessService.getExpiringAccess(7)
    const expiringIds = expiring.map(p => p.id)
    expect(expiringIds).toContain(expiringSoon.id)
    expect(expiringIds).not.toContain(alreadyExpired.id)
    expect(expiringIds).not.toContain(farInFuture.id)

    const expired = await AccessService.getExpiredAccess()
    const expiredIds = expired.map(p => p.id)
    expect(expiredIds).toContain(alreadyExpired.id)
    expect(expiredIds).not.toContain(expiringSoon.id)
    expect(expiredIds).not.toContain(farInFuture.id)
  })

  it('bulk-revokes every expired permission via revokeExpiredAccess', async () => {
    const expiredOne = await AccessService.createAccessPermission({
      employeeId: employeeA.id,
      systemId: systemA.id,
      accessLevel: 'READ',
      grantedBy: userA.id,
      expiresAt: daysFromNow(-2),
    })
    const expiredTwo = await AccessService.createAccessPermission({
      employeeId: employeeB.id,
      systemId: systemB.id,
      accessLevel: 'READ',
      grantedBy: userB.id,
      expiresAt: daysFromNow(-5),
    })
    const stillValid = await AccessService.createAccessPermission({
      employeeId: employeeA.id,
      systemId: systemB.id,
      accessLevel: 'READ',
      grantedBy: userA.id,
      expiresAt: daysFromNow(10),
    })
    permissionIds.push(expiredOne.id, expiredTwo.id, stillValid.id)

    const revokedCount = await AccessService.revokeExpiredAccess()
    expect(revokedCount).toBeGreaterThanOrEqual(2)

    const [one, two, valid] = await Promise.all([
      prisma.accessPermission.findUnique({ where: { id: expiredOne.id } }),
      prisma.accessPermission.findUnique({ where: { id: expiredTwo.id } }),
      prisma.accessPermission.findUnique({ where: { id: stillValid.id } }),
    ])

    expect(one?.isActive).toBe(false)
    expect(two?.isActive).toBe(false)
    expect(valid?.isActive).toBe(true)
  })

  it('builds an access matrix covering every active employee against every active system', async () => {
    const permission = await AccessService.createAccessPermission({
      employeeId: employeeA.id,
      systemId: systemA.id,
      accessLevel: 'READ',
      grantedBy: userA.id,
    })
    permissionIds.push(permission.id)

    const matrix = await AccessService.getAccessMatrix()

    const rowA = matrix.find(row => row.employee.id === employeeA.id)
    expect(rowA).toBeDefined()
    const cellA = rowA!.systems.find(cell => cell.system.id === systemA.id)
    expect(cellA?.permission?.id).toBe(permission.id)

    const rowB = matrix.find(row => row.employee.id === employeeB.id)
    const cellB = rowB!.systems.find(cell => cell.system.id === systemA.id)
    expect(cellB?.permission).toBeUndefined()
  })
})
