import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AccessRequest, Approval, User } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    accessRequest: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    approval: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    user: { findFirst: vi.fn() },
  },
}))

vi.mock('@/services/audit-service', () => ({
  AuditService: { logAction: vi.fn() },
}))

vi.mock('@/services/access-service', () => ({
  AccessService: { createAccessPermission: vi.fn() },
}))

vi.mock('@/services/email-service', () => ({
  EmailService: {
    sendAccessGrantedNotification: vi.fn(),
    sendApprovalRequiredNotification: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import { AuditService } from '@/services/audit-service'
import { AccessService } from '@/services/access-service'
import { EmailService } from '@/services/email-service'
import { ApprovalService } from '@/services/approval-service'

const itStaffUser = { id: 'it-1', role: 'IT_STAFF' }
const hrManagerUser = { id: 'hr-1', role: 'HR_MANAGER' }
const adminUser = { id: 'admin-1', role: 'ADMIN' }

const infraSystem = { system: { category: 'INFRASTRUCTURE' } }
const financeSystem = { system: { category: 'FINANCE' } }
const hrSystem = { system: { category: 'CUSTOMER_SUPPORT' } }

describe('ApprovalService.getApprovalWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes technical systems to an IT staff approver', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(itStaffUser as unknown as User)

    const workflow = await ApprovalService.getApprovalWorkflow('ACCESS_REQUEST', [infraSystem])

    expect(workflow.steps).toEqual([{ step: 1, approverId: 'it-1', role: 'IT_STAFF' }])
  })

  it('routes finance systems to an HR manager approver', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(hrManagerUser as unknown as User)

    const workflow = await ApprovalService.getApprovalWorkflow('ACCESS_REQUEST', [financeSystem])

    expect(workflow.steps).toEqual([{ step: 1, approverId: 'hr-1', role: 'HR_MANAGER' }])
  })

  it('requires HR approval for onboarding requests regardless of system category', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(hrManagerUser as unknown as User)

    const workflow = await ApprovalService.getApprovalWorkflow('ONBOARDING', [])

    expect(workflow.steps).toEqual([{ step: 1, approverId: 'hr-1', role: 'HR_MANAGER' }])
  })

  it('stacks IT then HR steps when both technical and sensitive systems are present', async () => {
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce(itStaffUser as unknown as User)
      .mockResolvedValueOnce(hrManagerUser as unknown as User)

    const workflow = await ApprovalService.getApprovalWorkflow('ACCESS_REQUEST', [
      infraSystem,
      financeSystem,
    ])

    expect(workflow.steps).toEqual([
      { step: 1, approverId: 'it-1', role: 'IT_STAFF' },
      { step: 2, approverId: 'hr-1', role: 'HR_MANAGER' },
    ])
  })

  it('falls back to an admin approver when no specific approver is matched', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(adminUser as unknown as User)

    const workflow = await ApprovalService.getApprovalWorkflow('ACCESS_REQUEST', [hrSystem])

    expect(workflow.steps).toEqual([{ step: 1, approverId: 'admin-1', role: 'ADMIN' }])
  })

  it('produces no steps when no matching approver exists for any role', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)

    const workflow = await ApprovalService.getApprovalWorkflow('ACCESS_REQUEST', [infraSystem])

    expect(workflow.steps).toEqual([])
  })
})

describe('ApprovalService.approveRequest / rejectRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when there is no pending approval for the approver', async () => {
    vi.mocked(prisma.approval.findFirst).mockResolvedValue(null)

    await expect(
      ApprovalService.approveRequest({ requestId: 'req-1', approverId: 'user-1' })
    ).rejects.toThrow('No pending approval found for this user')
  })

  it('rejectRequest also throws when there is no pending approval', async () => {
    vi.mocked(prisma.approval.findFirst).mockResolvedValue(null)

    await expect(
      ApprovalService.rejectRequest({ requestId: 'req-1', approverId: 'user-1', comments: 'no' })
    ).rejects.toThrow('No pending approval found for this user')
  })

  it('approving marks the approval APPROVED and logs the action', async () => {
    vi.mocked(prisma.approval.findFirst).mockResolvedValue({ id: 'appr-1' } as unknown as Approval)
    vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue({
      id: 'req-1',
      employeeId: 'emp-1',
      approvals: [],
      systems: [],
      employee: { id: 'emp-1' },
    } as unknown as AccessRequest)
    vi.mocked(prisma.accessRequest.update).mockResolvedValue({
      id: 'req-1',
      employeeId: 'emp-1',
      status: 'COMPLETED',
    } as unknown as AccessRequest)

    const result = await ApprovalService.approveRequest({
      requestId: 'req-1',
      approverId: 'user-1',
      comments: 'looks good',
    })

    expect(prisma.approval.update).toHaveBeenCalledWith({
      where: { id: 'appr-1' },
      data: expect.objectContaining({ status: 'APPROVED', comments: 'looks good' }),
    })
    expect(AuditService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'APPROVE_REQUEST', employeeId: 'emp-1' })
    )
    expect(result.status).toBe('COMPLETED')
  })

  it('rejecting marks the approval REJECTED and updates the request status', async () => {
    vi.mocked(prisma.approval.findFirst).mockResolvedValue({ id: 'appr-1' } as unknown as Approval)
    vi.mocked(prisma.accessRequest.update).mockResolvedValue({
      id: 'req-1',
      employeeId: 'emp-1',
      status: 'REJECTED',
    } as unknown as AccessRequest)

    const result = await ApprovalService.rejectRequest({
      requestId: 'req-1',
      approverId: 'user-1',
      comments: 'not needed',
    })

    expect(prisma.approval.update).toHaveBeenCalledWith({
      where: { id: 'appr-1' },
      data: expect.objectContaining({ status: 'REJECTED', comments: 'not needed' }),
    })
    expect(AuditService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'REJECT_REQUEST', employeeId: 'emp-1' })
    )
    expect(result.status).toBe('REJECTED')
  })
})

describe('ApprovalService.checkAndCompleteRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when the request does not exist', async () => {
    vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue(null)

    await expect(ApprovalService.checkAndCompleteRequest('missing')).rejects.toThrow(
      'Request not found'
    )
  })

  it('marks the request REJECTED when any approval was rejected', async () => {
    vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue({
      id: 'req-1',
      employeeId: 'emp-1',
      approvals: [{ status: 'REJECTED' }, { status: 'APPROVED' }],
    } as unknown as AccessRequest)
    vi.mocked(prisma.accessRequest.update).mockResolvedValue({ status: 'REJECTED' } as unknown as AccessRequest)

    const result = await ApprovalService.checkAndCompleteRequest('req-1')

    expect(prisma.accessRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED' }) })
    )
    expect(AccessService.createAccessPermission).not.toHaveBeenCalled()
    expect(result.status).toBe('REJECTED')
  })

  it('leaves the request untouched while approvals are still pending', async () => {
    const pendingRequest = {
      id: 'req-1',
      employeeId: 'emp-1',
      approvals: [{ status: 'APPROVED' }, { status: 'PENDING' }],
    }
    vi.mocked(prisma.accessRequest.findUnique).mockResolvedValue(pendingRequest as unknown as AccessRequest)

    const result = await ApprovalService.checkAndCompleteRequest('req-1')

    expect(prisma.accessRequest.update).not.toHaveBeenCalled()
    expect(result).toEqual(pendingRequest)
  })

  it('provisions access and marks the request COMPLETED once all approvals are in', async () => {
    vi.mocked(prisma.accessRequest.findUnique)
      .mockResolvedValueOnce({
        id: 'req-1',
        employeeId: 'emp-1',
        approvals: [{ status: 'APPROVED' }],
      } as unknown as AccessRequest)
      .mockResolvedValueOnce({
        id: 'req-1',
        employeeId: 'emp-1',
        requestedBy: 'requester-1',
        systems: [{ systemId: 'sys-1', accessLevel: 'READ', system: { id: 'sys-1' } }],
        employee: { id: 'emp-1' },
      } as unknown as AccessRequest)
    vi.mocked(prisma.accessRequest.update).mockResolvedValue({ status: 'COMPLETED' } as unknown as AccessRequest)

    const result = await ApprovalService.checkAndCompleteRequest('req-1')

    expect(AccessService.createAccessPermission).toHaveBeenCalledWith({
      employeeId: 'emp-1',
      systemId: 'sys-1',
      accessLevel: 'READ',
      grantedBy: 'requester-1',
    })
    expect(EmailService.sendAccessGrantedNotification).toHaveBeenCalled()
    expect(prisma.accessRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) })
    )
    expect(result.status).toBe('COMPLETED')
  })
})
