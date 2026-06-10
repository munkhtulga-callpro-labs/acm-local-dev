import { Worker, Queue } from 'bullmq'
import { redis } from '@/lib/redis'
import { EmailService } from '@/services/email-service'
import { ExpiryService } from '@/services/expiry-service'
import { AccessService } from '@/services/access-service'
import { GoogleWorkspaceIntegration } from '@/integrations/google-workspace'
import { MondayIntegration } from '@/integrations/monday'
import { CallProTeamsIntegration } from '@/integrations/callpro-teams'

// Create queues
export const emailQueue = new Queue('email', { connection: redis })
export const provisioningQueue = new Queue('provisioning', { connection: redis })
export const expiryQueue = new Queue('expiry', { connection: redis })

// Email worker
const emailWorker = new Worker('email', async (job) => {
  const { type, data } = job.data

  switch (type) {
    case 'send_access_granted':
      await EmailService.sendAccessGrantedNotification(data)
      break
    case 'send_approval_required':
      await EmailService.sendApprovalRequiredNotification(data)
      break
    case 'send_expiry_reminder':
      await EmailService.sendExpiryReminderNotification(data)
      break
    case 'send_access_revoked':
      await EmailService.sendAccessRevokedNotification(data)
      break
    case 'send_request_status_update':
      await EmailService.sendRequestStatusUpdateNotification(data)
      break
    default:
      console.log('Unknown email job type:', type)
  }
}, { connection: redis })

// Provisioning worker
const provisioningWorker = new Worker('provisioning', async (job) => {
  const { systemId, employeeId, email, accessLevel, firstName, lastName } = job.data

  let integration
  switch (systemId) {
    case 'google-workspace':
      integration = new GoogleWorkspaceIntegration({
        systemId,
        credentials: {},
        settings: {},
      })
      break
    case 'monday':
      integration = new MondayIntegration({
        systemId,
        credentials: {},
        settings: {},
      })
      break
    case 'callpro-teams':
      integration = new CallProTeamsIntegration({
        systemId,
        credentials: {},
        settings: {},
      })
      break
    default:
      throw new Error(`Unknown system: ${systemId}`)
  }

  const result = await integration.provisionAccess({
    employeeId,
    email,
    accessLevel,
    firstName,
    lastName,
  })

  if (!result.success) {
    throw new Error(`Provisioning failed: ${result.error}`)
  }

  return result
}, { connection: redis })

// Expiry worker
const expiryWorker = new Worker('expiry', async (job) => {
  const { type } = job.data

  switch (type) {
    case 'check_expiring':
      await ExpiryService.checkExpiringAccess(7)
      await ExpiryService.checkExpiringAccess(3)
      await ExpiryService.checkExpiringAccess(1)
      break
    case 'revoke_expired':
      await ExpiryService.revokeExpiredAccess()
      break
    case 'send_reminders':
      await ExpiryService.checkExpiringAccess(7)
      break
    default:
      console.log('Unknown expiry job type:', type)
  }
}, { connection: redis })

// Error handling
emailWorker.on('error', (error) => {
  console.error('Email worker error:', error)
})

provisioningWorker.on('error', (error) => {
  console.error('Provisioning worker error:', error)
})

expiryWorker.on('error', (error) => {
  console.error('Expiry worker error:', error)
})

// Export workers for graceful shutdown
export { emailWorker, provisioningWorker, expiryWorker }
