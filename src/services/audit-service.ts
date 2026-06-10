import { prisma } from '@/lib/prisma'
import { AuditLogWithRelations } from '@/types'

export class AuditService {
  static async logAction({
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    userId,
    employeeId,
    ipAddress,
    userAgent,
  }: {
    action: string
    entityType: string
    entityId: string
    oldValues?: any
    newValues?: any
    userId?: string
    employeeId?: string
    ipAddress?: string
    userAgent?: string
  }): Promise<AuditLogWithRelations> {
    return await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        userId,
        employeeId,
        ipAddress,
        userAgent,
      },
      include: {
        user: true,
        employee: true,
      },
    }) as any
  }

  static async getAuditLogs({
    page = 1,
    limit = 10,
    action,
    entityType,
    userId,
    startDate,
    endDate,
  }: {
    page?: number
    limit?: number
    action?: string
    entityType?: string
    userId?: string
    startDate?: Date
    endDate?: Date
  } = {}) {
    const where: any = {}

    if (action) where.action = action
    if (entityType) where.entityType = entityType
    if (userId) where.userId = userId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: true,
          employee: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getAuditLogById(id: string): Promise<AuditLogWithRelations | null> {
    return await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: true,
        employee: true,
      },
    }) as any
  }

  static async getRecentActivity(limit = 10): Promise<AuditLogWithRelations[]> {
    return await prisma.auditLog.findMany({
      include: {
        user: true,
        employee: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as any
  }
}
