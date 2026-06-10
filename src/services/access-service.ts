import { prisma } from '@/lib/prisma'
import { AccessPermissionWithRelations, AccessMatrix } from '@/types'
import { AuditService } from './audit-service'

export class AccessService {
  static async getAccessPermissions({
    employeeId,
    systemId,
    isActive,
  }: {
    employeeId?: string
    systemId?: string
    isActive?: boolean
  } = {}): Promise<AccessPermissionWithRelations[]> {
    const where: any = {}
    
    if (employeeId) where.employeeId = employeeId
    if (systemId) where.systemId = systemId
    if (isActive !== undefined) where.isActive = isActive

    return await prisma.accessPermission.findMany({
      where,
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        system: true,
      },
    })
  }

  static async createAccessPermission({
    employeeId,
    systemId,
    accessLevel,
    grantedBy,
    expiresAt,
  }: {
    employeeId: string
    systemId: string
    accessLevel: string
    grantedBy: string
    expiresAt?: Date
  }): Promise<AccessPermissionWithRelations> {
    const permission = await prisma.accessPermission.create({
      data: {
        employeeId,
        systemId,
        accessLevel,
        grantedBy,
        expiresAt,
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        system: true,
      },
    })

    // Log the action
    await AuditService.logAction({
      action: 'CREATE_ACCESS',
      entityType: 'AccessPermission',
      entityId: permission.id,
      newValues: permission,
      userId: grantedBy,
      employeeId,
    })

    return permission
  }

  static async updateAccessPermission({
    id,
    accessLevel,
    isActive,
    expiresAt,
    updatedBy,
  }: {
    id: string
    accessLevel?: string
    isActive?: boolean
    expiresAt?: Date
    updatedBy: string
  }): Promise<AccessPermissionWithRelations> {
    const oldPermission = await prisma.accessPermission.findUnique({
      where: { id },
    })

    const permission = await prisma.accessPermission.update({
      where: { id },
      data: {
        accessLevel,
        isActive,
        expiresAt,
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        system: true,
      },
    })

    // Log the action
    await AuditService.logAction({
      action: 'UPDATE_ACCESS',
      entityType: 'AccessPermission',
      entityId: id,
      oldValues: oldPermission,
      newValues: permission,
      userId: updatedBy,
      employeeId: permission.employeeId,
    })

    return permission
  }

  static async revokeAccessPermission({
    id,
    revokedBy,
  }: {
    id: string
    revokedBy: string
  }): Promise<AccessPermissionWithRelations> {
    const oldPermission = await prisma.accessPermission.findUnique({
      where: { id },
    })

    const permission = await prisma.accessPermission.update({
      where: { id },
      data: {
        isActive: false,
        revokedBy,
        revokedAt: new Date(),
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        system: true,
      },
    })

    // Log the action
    await AuditService.logAction({
      action: 'REVOKE_ACCESS',
      entityType: 'AccessPermission',
      entityId: id,
      oldValues: oldPermission,
      newValues: permission,
      userId: revokedBy,
      employeeId: permission.employeeId,
    })

    return permission
  }

  static async getAccessMatrix(): Promise<AccessMatrix[]> {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        user: true,
        accessPermissions: {
          where: { isActive: true },
          include: {
            system: true,
          },
        },
      },
    })

    const systems = await prisma.system.findMany({
      where: { isActive: true },
    })

    return employees.map((employee: any) => ({
      employee,
      systems: systems.map((system: any) => {
        const permission = employee.accessPermissions.find(
          (p: any) => p.systemId === system.id
        )
        return {
          system,
          permission,
        }
      }),
    }))
  }

  static async getExpiringAccess(days = 7): Promise<AccessPermissionWithRelations[]> {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + days)

    return await prisma.accessPermission.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        system: true,
      },
    })
  }

  static async getExpiredAccess(): Promise<AccessPermissionWithRelations[]> {
    return await prisma.accessPermission.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date(),
        },
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        system: true,
      },
    })
  }

  static async revokeExpiredAccess(): Promise<number> {
    const expiredPermissions = await this.getExpiredAccess()
    
    for (const permission of expiredPermissions) {
      await this.revokeAccessPermission({
        id: permission.id,
        revokedBy: 'system',
      })
    }

    return expiredPermissions.length
  }
}
