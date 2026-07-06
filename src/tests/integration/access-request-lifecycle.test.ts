import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test' }),
}))

import { prisma } from '@/lib/prisma'
import { ApprovalService } from '@/services/approval-service'

describe('access request lifecycle (real Postgres)', () => {
  let itStaffUser: { id: string }
  let requesterUser: { id: string }
  let employee: { id: string }
  let system: { id: string }
  const requestIds: string[] = []

  beforeAll(async () => {
    itStaffUser = await prisma.user.create({
      data: { email: 'it-staff@integration.test', role: 'IT_STAFF', isActive: true },
    })

    requesterUser = await prisma.user.create({
      data: { email: 'requester@integration.test', role: 'EMPLOYEE', isActive: true },
    })

    employee = await prisma.employee.create({
      data: {
        employeeId: 'INT-TEST-1',
        firstName: 'Test',
        lastName: 'Requester',
        email: 'requester@integration.test',
        department: 'Engineering',
        position: 'Developer',
        startDate: new Date(),
        userId: requesterUser.id,
      },
    })

    system = await prisma.system.create({
      data: {
        name: 'Integration Test System',
        category: 'INFRASTRUCTURE',
      },
    })
  })

  afterAll(async () => {
    await prisma.accessPermission.deleteMany({ where: { employeeId: employee.id } })
    await prisma.auditLog.deleteMany({ where: { employeeId: employee.id } })
    for (const id of requestIds) {
      await prisma.accessRequest.deleteMany({ where: { id } })
    }
    await prisma.employee.delete({ where: { id: employee.id } })
    await prisma.system.delete({ where: { id: system.id } })
    await prisma.user.delete({ where: { id: requesterUser.id } })
    await prisma.user.delete({ where: { id: itStaffUser.id } })
  })

  it('provisions access once the sole IT approver approves the request', async () => {
    const request = await ApprovalService.createAccessRequest({
      employeeId: employee.id,
      requestType: 'ACCESS_MODIFICATION',
      title: 'Grant access to Integration Test System',
      priority: 'MEDIUM',
      requestedBy: requesterUser.id,
      systems: [{ systemId: system.id, accessLevel: 'READ', isRequired: true }],
    })
    requestIds.push(request.id)

    const approvals = await prisma.approval.findMany({ where: { accessRequestId: request.id } })
    expect(approvals).toHaveLength(1)
    expect(approvals[0].approverId).toBe(itStaffUser.id)
    expect(approvals[0].status).toBe('PENDING')

    const pendingForApprover = await ApprovalService.getPendingApprovals(itStaffUser.id)
    expect(pendingForApprover.map(r => r.id)).toContain(request.id)

    const completed = await ApprovalService.approveRequest({
      requestId: request.id,
      approverId: itStaffUser.id,
      comments: 'Looks good',
    })

    expect(completed.status).toBe('COMPLETED')
    expect(completed.completedAt).not.toBeNull()

    const permission = await prisma.accessPermission.findFirst({
      where: { employeeId: employee.id, systemId: system.id },
    })
    expect(permission).not.toBeNull()
    expect(permission?.accessLevel).toBe('READ')
    expect(permission?.isActive).toBe(true)

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: request.id, entityType: 'AccessRequest' },
      orderBy: { createdAt: 'asc' },
    })
    expect(auditLogs.map(l => l.action)).toEqual(['CREATE_REQUEST', 'APPROVE_REQUEST'])
  })

  it('rejects the request and does not provision access when the approver rejects', async () => {
    const request = await ApprovalService.createAccessRequest({
      employeeId: employee.id,
      requestType: 'ACCESS_MODIFICATION',
      title: 'Grant access to Integration Test System (round 2)',
      priority: 'LOW',
      requestedBy: requesterUser.id,
      systems: [{ systemId: system.id, accessLevel: 'WRITE', isRequired: true }],
    })
    requestIds.push(request.id)

    const rejected = await ApprovalService.rejectRequest({
      requestId: request.id,
      approverId: itStaffUser.id,
      comments: 'Not justified',
    })

    expect(rejected.status).toBe('REJECTED')

    const permission = await prisma.accessPermission.findFirst({
      where: { employeeId: employee.id, systemId: system.id, accessLevel: 'WRITE' },
    })
    expect(permission).toBeNull()
  })
})
