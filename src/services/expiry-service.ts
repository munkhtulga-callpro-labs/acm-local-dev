import { AccessService } from './access-service'
import { EmailService } from './email-service'
import { prisma } from '@/lib/prisma'

export class ExpiryService {
  static async checkExpiringAccess(days = 7): Promise<void> {
    const expiringAccess = await AccessService.getExpiringAccess(days)

    for (const permission of expiringAccess) {
      const daysUntilExpiry = Math.ceil(
        (permission.expiresAt!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      // Send reminder emails at key milestones
      // Use <= and > to ensure we catch reminders even if job doesn't run exactly on schedule
      const shouldSendReminder = (
        (daysUntilExpiry <= 7 && daysUntilExpiry > 3) ||
        (daysUntilExpiry <= 3 && daysUntilExpiry > 1) ||
        (daysUntilExpiry <= 1 && daysUntilExpiry > 0)
      )

      if (shouldSendReminder) {
        // Check if we've already sent a reminder recently to avoid spam
        const lastReminder = await prisma.auditLog.findFirst({
          where: {
            action: 'EXPIRY_REMINDER_SENT',
            entityType: 'AccessPermission',
            entityId: permission.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
            },
          },
        })

        if (!lastReminder) {
          await EmailService.sendExpiryReminderNotification({
            employee: permission.employee,
            system: permission.system,
            daysUntilExpiry,
          })

          // Log that we sent the reminder
          await prisma.auditLog.create({
            data: {
              action: 'EXPIRY_REMINDER_SENT',
              entityType: 'AccessPermission',
              entityId: permission.id,
              newValues: { daysUntilExpiry },
            },
          })
        }
      }
    }
  }

  static async revokeExpiredAccess(): Promise<number> {
    const expiredCount = await AccessService.revokeExpiredAccess()
    
    if (expiredCount > 0) {
      console.log(`Revoked ${expiredCount} expired access permissions`)
    }

    return expiredCount
  }

  static async getExpiryReport(): Promise<{
    expiring: Array<{
      permission: any
      daysUntilExpiry: number
    }>
    expired: any[]
  }> {
    const expiring = await AccessService.getExpiringAccess(30)
    const expired = await AccessService.getExpiredAccess()

    const expiringWithDays = expiring.map(permission => ({
      permission,
      daysUntilExpiry: Math.ceil(
        (permission.expiresAt!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))

    return {
      expiring: expiringWithDays,
      expired,
    }
  }

  static async extendAccess({
    permissionId,
    newExpiryDate,
    extendedBy,
  }: {
    permissionId: string
    newExpiryDate: Date
    extendedBy: string
  }): Promise<void> {
    await prisma.accessPermission.update({
      where: { id: permissionId },
      data: {
        expiresAt: newExpiryDate,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'EXTEND_ACCESS',
        entityType: 'AccessPermission',
        entityId: permissionId,
        newValues: { expiresAt: newExpiryDate },
        userId: extendedBy,
      },
    })
  }

  static async scheduleExpiryChecks(): Promise<void> {
    // This would be called by a cron job or scheduled task
    // Check for expiring access (7, 3, 1 days)
    await this.checkExpiringAccess(7)
    await this.checkExpiringAccess(3)
    await this.checkExpiringAccess(1)

    // Revoke expired access
    await this.revokeExpiredAccess()
  }
}
