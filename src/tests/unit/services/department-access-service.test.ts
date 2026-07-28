import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    department: { findFirst: vi.fn() },
    departmentAccessTemplate: { findMany: vi.fn() },
  },
}))

vi.mock('@/services/approval-service', () => ({
  ApprovalService: { createAccessRequest: vi.fn() },
}))

vi.mock('@/services/resource-request-service', () => ({
  createResourceAccessRequest: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { ApprovalService } from '@/services/approval-service'
import { createResourceAccessRequest } from '@/services/resource-request-service'
import { DepartmentAccessService } from '@/services/department-access-service'

const employee = {
  id: 'emp-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@company.com',
  department: 'Development',
  company: 'CallPro LLC',
}

const department = { id: 'dept-1', name: 'Development', company: 'CallPro LLC' }

describe('DepartmentAccessService.provisionDefaultAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when no matching department is found', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValue(null as any)

    await DepartmentAccessService.provisionDefaultAccess({ employee, requestedByUserId: 'user-1' })

    expect(prisma.departmentAccessTemplate.findMany).not.toHaveBeenCalled()
    expect(ApprovalService.createAccessRequest).not.toHaveBeenCalled()
    expect(createResourceAccessRequest).not.toHaveBeenCalled()
  })

  it('does nothing when the department has no active templates', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValue(department as any)
    vi.mocked(prisma.departmentAccessTemplate.findMany).mockResolvedValue([])

    await DepartmentAccessService.provisionDefaultAccess({ employee, requestedByUserId: 'user-1' })

    expect(ApprovalService.createAccessRequest).not.toHaveBeenCalled()
    expect(createResourceAccessRequest).not.toHaveBeenCalled()
  })

  it('raises an ONBOARDING access request for SYSTEM-kind templates', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValue(department as any)
    vi.mocked(prisma.departmentAccessTemplate.findMany).mockResolvedValue([
      {
        id: 'tmpl-1',
        departmentId: 'dept-1',
        kind: 'SYSTEM',
        systemId: 'sys-1',
        resourceType: null,
        resourceId: null,
        resourceName: null,
        accessLevel: 'User',
        isRequired: true,
        isActive: true,
      },
    ] as any)

    await DepartmentAccessService.provisionDefaultAccess({ employee, requestedByUserId: 'user-1' })

    expect(ApprovalService.createAccessRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: 'emp-1',
        requestType: 'ONBOARDING',
        requestedBy: 'user-1',
        systems: [{ systemId: 'sys-1', accessLevel: 'User', isRequired: true }],
      })
    )
    expect(createResourceAccessRequest).not.toHaveBeenCalled()
  })

  it('does not raise a SYSTEM request when there is no requesting user to attribute it to', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValue(department as any)
    vi.mocked(prisma.departmentAccessTemplate.findMany).mockResolvedValue([
      {
        id: 'tmpl-1',
        departmentId: 'dept-1',
        kind: 'SYSTEM',
        systemId: 'sys-1',
        accessLevel: 'User',
        isRequired: true,
        isActive: true,
      },
    ] as any)

    await DepartmentAccessService.provisionDefaultAccess({ employee, requestedByUserId: null })

    expect(ApprovalService.createAccessRequest).not.toHaveBeenCalled()
  })

  it('creates a resource access request for RESOURCE-kind templates', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValue(department as any)
    vi.mocked(prisma.departmentAccessTemplate.findMany).mockResolvedValue([
      {
        id: 'tmpl-2',
        departmentId: 'dept-1',
        kind: 'RESOURCE',
        resourceType: 'CODE_REPOSITORY',
        resourceId: 'repo-1',
        resourceName: 'onlime-backend-monorepo',
        accessLevel: 'Write',
        isRequired: true,
        isActive: true,
      },
    ] as any)

    await DepartmentAccessService.provisionDefaultAccess({ employee, requestedByUserId: 'user-1' })

    expect(createResourceAccessRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        employee,
        resourceType: 'CODE_REPOSITORY',
        resourceId: 'repo-1',
        resourceName: 'onlime-backend-monorepo',
        accessLevel: 'Write',
        initiatedByUserId: 'user-1',
      })
    )
    expect(ApprovalService.createAccessRequest).not.toHaveBeenCalled()
  })

  it('ignores templates that are not active', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValue(department as any)
    vi.mocked(prisma.departmentAccessTemplate.findMany).mockResolvedValue([])

    await DepartmentAccessService.provisionDefaultAccess({ employee, requestedByUserId: 'user-1' })

    expect(prisma.departmentAccessTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
    )
  })
})
