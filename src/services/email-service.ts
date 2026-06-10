import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export class EmailService {
  static async sendAccessGrantedNotification({
    employee,
    systems,
  }: {
    employee: any
    systems: Array<{
      system: any
      accessLevel: string
    }>
  }): Promise<void> {
    const template = await this.getEmailTemplate('access_granted')
    
    const systemList = systems.map((s: any) => 
      `- ${s.system.name}: ${s.accessLevel}`
    ).join('\n')

    const html = template.body
      .replace('{{employeeName}}', `${employee.firstName} ${employee.lastName}`)
      .replace('{{systems}}', systemList)
      .replace('{{company}}', employee.company || 'Your Company')

    await sendEmail({
      to: employee.email,
      subject: template.subject.replace('{{systemName}}', 'Access Systems'),
      html,
    })
  }

  static async sendApprovalRequiredNotification({
    request,
    approverId,
  }: {
    request: any
    approverId: string
  }): Promise<void> {
    const template = await this.getEmailTemplate('approval_required')

    const systemList = request.systems.map((rs: any) =>
      `- ${rs.system.name}: ${rs.accessLevel}`
    ).join('\n')

    const html = template.body
      .replace('{{employeeName}}', `${request.employee.firstName} ${request.employee.lastName}`)
      .replace('{{requestTitle}}', request.title)
      .replace('{{systems}}', systemList)
      .replace('{{requestId}}', request.id)

    // Resolve approver email from user ID
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: { email: true, name: true },
    })

    if (!approver || !approver.email) {
      console.error(`Could not find email for approver ID: ${approverId}`)
      return
    }

    await sendEmail({
      to: approver.email,
      subject: template.subject.replace('{{employeeName}}', `${request.employee.firstName} ${request.employee.lastName}`),
      html,
    })
  }

  static async sendExpiryReminderNotification({
    employee,
    system,
    daysUntilExpiry,
  }: {
    employee: any
    system: any
    daysUntilExpiry: number
  }): Promise<void> {
    const template = await this.getEmailTemplate('expiry_reminder')
    
    const html = template.body
      .replace('{{employeeName}}', `${employee.firstName} ${employee.lastName}`)
      .replace('{{systemName}}', system.name)
      .replace('{{daysUntilExpiry}}', daysUntilExpiry.toString())
      .replace('{{company}}', employee.company || 'Your Company')

    await sendEmail({
      to: employee.email,
      subject: template.subject.replace('{{systemName}}', system.name).replace('{{daysUntilExpiry}}', daysUntilExpiry.toString()),
      html,
    })
  }

  static async sendAccessRevokedNotification({
    employee,
    system,
  }: {
    employee: any
    system: any
  }): Promise<void> {
    const template = await this.getEmailTemplate('access_revoked')
    
    const html = template.body
      .replace('{{employeeName}}', `${employee.firstName} ${employee.lastName}`)
      .replace('{{systemName}}', system.name)
      .replace('{{company}}', employee.company || 'Your Company')

    await sendEmail({
      to: employee.email,
      subject: template.subject.replace('{{systemName}}', system.name),
      html,
    })
  }

  static async sendRequestStatusUpdateNotification({
    request,
    status,
  }: {
    request: any
    status: string
  }): Promise<void> {
    const template = await this.getEmailTemplate('request_status_update')
    
    const html = template.body
      .replace('{{employeeName}}', `${request.employee.firstName} ${request.employee.lastName}`)
      .replace('{{requestTitle}}', request.title)
      .replace('{{status}}', status)
      .replace('{{requestId}}', request.id)

    await sendEmail({
      to: request.employee.email,
      subject: template.subject.replace('{{requestTitle}}', request.title).replace('{{status}}', status),
      html,
    })
  }

  static async getEmailTemplate(name: string): Promise<{
    subject: string
    body: string
  }> {
    const template = await prisma.emailTemplate.findUnique({
      where: { name },
    })

    if (template) {
      return {
        subject: template.subject,
        body: template.body,
      }
    }

    // Return default templates if not found in database
    return this.getDefaultTemplate(name)
  }

  static getDefaultTemplate(name: string): { subject: string; body: string } {
    const templates = {
      access_granted: {
        subject: 'Your access to {{systemName}} has been approved',
        body: `
          <h2>Access Granted</h2>
          <p>Hi {{employeeName}},</p>
          <p>Your access request has been approved!</p>
          <p><strong>Access Details:</strong></p>
          <ul>{{systems}}</ul>
          <p>You can now access these systems with your credentials.</p>
          <p>If you have any questions, please contact IT Support.</p>
          <p>Best regards,<br>{{company}} IT Team</p>
        `,
      },
      approval_required: {
        subject: 'Approval required for {{employeeName}} access request',
        body: `
          <h2>Approval Required</h2>
          <p>Hi,</p>
          <p>You have a pending approval for {{employeeName}}'s access request:</p>
          <p><strong>Request:</strong> {{requestTitle}}</p>
          <p><strong>Systems:</strong></p>
          <ul>{{systems}}</ul>
          <p>Please review and approve/reject this request in the system.</p>
          <p>Request ID: {{requestId}}</p>
        `,
      },
      expiry_reminder: {
        subject: 'Your access to {{systemName}} expires in {{daysUntilExpiry}} days',
        body: `
          <h2>Access Expiry Reminder</h2>
          <p>Hi {{employeeName}},</p>
          <p>Your access to <strong>{{systemName}}</strong> will expire in {{daysUntilExpiry}} days.</p>
          <p>If you still need this access, please request an extension through the system.</p>
          <p>Your access will be automatically revoked after expiry.</p>
          <p>Best regards,<br>{{company}} IT Team</p>
        `,
      },
      access_revoked: {
        subject: 'Your access to {{systemName}} has been revoked',
        body: `
          <h2>Access Revoked</h2>
          <p>Hi {{employeeName}},</p>
          <p>Your access to <strong>{{systemName}}</strong> has been revoked.</p>
          <p>If you believe this is an error, please contact IT Support.</p>
          <p>Best regards,<br>{{company}} IT Team</p>
        `,
      },
      request_status_update: {
        subject: 'Update on your access request: {{requestTitle}}',
        body: `
          <h2>Request Status Update</h2>
          <p>Hi {{employeeName}},</p>
          <p>Your access request "<strong>{{requestTitle}}</strong>" has been updated.</p>
          <p><strong>Status:</strong> {{status}}</p>
          <p>Request ID: {{requestId}}</p>
          <p>You can track the progress of your request in the system.</p>
        `,
      },
    }

    return templates[name as keyof typeof templates] || {
      subject: 'Notification from Access Control System',
      body: '<p>You have received a notification from the Access Control System.</p>',
    }
  }

  static async createDefaultTemplates(): Promise<void> {
    const templates = [
      {
        name: 'access_granted',
        subject: 'Your access to {{systemName}} has been approved',
        body: this.getDefaultTemplate('access_granted').body,
        variables: ['employeeName', 'systems', 'company'],
      },
      {
        name: 'approval_required',
        subject: 'Approval required for {{employeeName}} access request',
        body: this.getDefaultTemplate('approval_required').body,
        variables: ['employeeName', 'requestTitle', 'systems', 'requestId'],
      },
      {
        name: 'expiry_reminder',
        subject: 'Your access to {{systemName}} expires in {{daysUntilExpiry}} days',
        body: this.getDefaultTemplate('expiry_reminder').body,
        variables: ['employeeName', 'systemName', 'daysUntilExpiry', 'company'],
      },
      {
        name: 'access_revoked',
        subject: 'Your access to {{systemName}} has been revoked',
        body: this.getDefaultTemplate('access_revoked').body,
        variables: ['employeeName', 'systemName', 'company'],
      },
      {
        name: 'request_status_update',
        subject: 'Update on your access request: {{requestTitle}}',
        body: this.getDefaultTemplate('request_status_update').body,
        variables: ['employeeName', 'requestTitle', 'status', 'requestId'],
      },
    ]

    for (const template of templates) {
      await prisma.emailTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template,
      })
    }
  }
}
