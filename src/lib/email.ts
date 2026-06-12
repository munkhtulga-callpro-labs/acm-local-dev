import nodemailer from 'nodemailer'

if (!process.env.SMTP_HOST) {
  throw new Error('SMTP_HOST is not set. Configure it in .env — do not rely on production defaults.')
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USERNAME || process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html?: string
  text?: string
}) {
  try {
    const info = await transporter.sendMail({
      from: `"Access Control Management" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
      text,
    })
    
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error }
  }
}

export { transporter }

// ============================================
// ACCESS CONTROL EMAIL NOTIFICATIONS
// ============================================

interface AccessRequestEmailData {
  requesterName: string
  requesterEmail: string
  resourceName: string
  resourceType: string
  accessLevel: string
  businessJustification: string
  requestId: string
}

interface AccessGrantedEmailData {
  requesterName: string
  resourceName: string
  resourceType: string
  accessLevel: string
  validFrom: Date | null
  validTo: Date | null
  credentials?: Record<string, any>
  grantedBy: string
}

interface AccessRejectedEmailData {
  requesterName: string
  resourceName: string
  resourceType: string
  accessLevel: string
  rejectedBy: string
  reason?: string
}

/**
 * Send access request pending notification to approver
 */
export async function sendAccessRequestNotification(
  approverEmail: string,
  data: AccessRequestEmailData
) {
  const subject = `[Access Control] New Access Request - ${data.resourceName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0">
        <tbody>
          <tr>
            <td align="center" style="padding: 0">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #fff; border-radius: 14px;">
                <tbody>
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 0; border-top-left-radius: 14px; border-top-right-radius: 14px; overflow: hidden;">
                      <img src="https://platform-cdn.callpro.mn/icon/img_icon/img_header_callpro.png" alt="CallPro Platform Logo" style="display: block; width: 100%; height: auto">
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 40px; color: #0E0D57;">
                      <!-- Status Badge -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 25px 0;">
                        <tbody>
                          <tr>
                            <td style="padding-right: 12px; vertical-align: middle;">
                              <span style="font-size: 32px; line-height: 32px; display: inline-block;">🔔</span>
                            </td>
                            <td style="vertical-align: middle;">
                              <p style="margin: 0; color: #000000; font-size: 18px; font-weight: 600;">New Access Request Awaiting Your Approval</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p style="margin: 0 0 8px 0; color: #0E0D57; font-size: 17px; line-height: 1.5;">Hi,</p>
                      <p style="margin: 0 0 20px 0; color: #0E0D57; font-size: 17px; line-height: 1.5;">A new access request has been submitted and requires your review:</p>

                      <!-- Separator -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tbody><tr><td style="border-top: 1px solid #e4e4e7;"></td></tr></tbody>
                      </table>

                      <!-- Request Details -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tbody>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Requester</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;"><strong>${data.requesterName}</strong> (<a href="mailto:${data.requesterEmail}" style="color: #00A3FF; text-decoration: none;">${data.requesterEmail}</a>)</td>
                          </tr>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Resource</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;"><strong>${data.resourceName}</strong></td>
                          </tr>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Resource Type</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;">${data.resourceType}</td>
                          </tr>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Access Level</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;">${data.accessLevel}</td>
                          </tr>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Business Justification</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;">${data.businessJustification}</td>
                          </tr>
                        </tbody>
                      </table>

                      <!-- Separator -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tbody><tr><td style="border-top: 1px solid #e4e4e7;"></td></tr></tbody>
                      </table>

                      <!-- Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
                        <tbody>
                          <tr>
                            <td style="border-radius: 6px; background-color: #007BFF;">
                              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/approvals" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">Review Request</a>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p style="margin: 8px 0; color: #0E0D57; font-size: 17px;">Please review this request at your earliest convenience.</p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 15px 40px; background-color: #fff; border-bottom-left-radius: 14px; border-bottom-right-radius: 14px;">
                      <p style="margin: 0 0 6px 6px; font-size: 14px; color: #707070;">Best Regards,</p>
                      <p style="margin: 0 0 6px 6px; font-size: 14px; color: #707070;">If you have any questions, contact us at <a href="mailto:devops@callpro.mn" style="color: #00A3FF; text-decoration: none;">devops@callpro.mn</a> or <a href="tel:+97672727070" style="color: #00A3FF; text-decoration: none;">(976)7272-7070</a></p>
                      <p style="margin: 15px 0 6px 6px; font-size: 12px; color: #707070;">Request ID: ${data.requestId}</p>
                      <p style="margin: 6px 0 0 6px; font-size: 12px; color: #707070;">©2025 CallPro LLC, #502, Regis Place, Chinggis Avenue, Khan-Uul District, Ulaanbaatar 17011, Mongolia</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `

  const text = `
New Access Request Awaiting Your Approval

Requester: ${data.requesterName} (${data.requesterEmail})
Resource: ${data.resourceName}
Resource Type: ${data.resourceType}
Access Level: ${data.accessLevel}

Business Justification:
${data.businessJustification}

Please review this request in the Access Control System: ${process.env.NEXTAUTH_URL}/approvals

Request ID: ${data.requestId}
  `

  return sendEmail({
    to: approverEmail,
    subject,
    html,
    text
  })
}

/**
 * Send access granted notification to requester
 */
export async function sendAccessGrantedNotification(
  requesterEmail: string,
  data: AccessGrantedEmailData
) {
  const subject = `[Access Control] Access Granted - ${data.resourceName}`

  // Build credentials HTML if provided
  const credentialsRows = data.credentials ? Object.entries(data.credentials)
    .filter(([k, v]) => v)
    .map(([key, value]) => `
      <tr>
        <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 18px;">${key}</td>
        <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 18px; word-wrap: break-word; word-break: break-word;"><strong>${value}</strong></td>
      </tr>
    `).join('') : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0">
        <tbody>
          <tr>
            <td align="center" style="padding: 0">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #fff; border-radius: 14px;">
                <tbody>
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 0; border-top-left-radius: 14px; border-top-right-radius: 14px; overflow: hidden;">
                      <img src="https://platform-cdn.callpro.mn/icon/img_icon/img_header_callpro.png" alt="CallPro Platform Logo" style="display: block; width: 100%; height: auto">
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 40px; color: #0E0D57;">
                      <!-- Success Status Badge -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 25px 0;">
                        <tbody>
                          <tr>
                            <td style="padding-right: 12px; vertical-align: middle;">
                              <span style="font-size: 32px; line-height: 32px; display: inline-block;">✅</span>
                            </td>
                            <td style="vertical-align: middle;">
                              <p style="margin: 0; color: #000000; font-size: 18px; font-weight: 600;">Your Access Request Has Been Approved</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p style="margin: 0 0 8px 0; color: #0E0D57; font-size: 17px; line-height: 1.5;">Hi ${data.requesterName},</p>
                      <p style="margin: 0 0 20px 0; color: #0E0D57; font-size: 17px; line-height: 1.5;">Great news! Your access request has been approved.</p>

                      <!-- Separator -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tbody><tr><td style="border-top: 1px solid #e4e4e7;"></td></tr></tbody>
                      </table>

                      <!-- Access Details -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tbody>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Resource</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;"><strong>${data.resourceName}</strong> (${data.resourceType})</td>
                          </tr>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Access Level</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;">${data.accessLevel}</td>
                          </tr>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Valid From</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;">${data.validFrom ? new Date(data.validFrom).toLocaleDateString() : 'Immediately'}</td>
                          </tr>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Valid Until</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;">${data.validTo ? new Date(data.validTo).toLocaleDateString() : 'No expiry'}</td>
                          </tr>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Granted By</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;"><a href="mailto:${data.grantedBy}" style="color: #00A3FF; text-decoration: none;">${data.grantedBy}</a></td>
                          </tr>
                        </tbody>
                      </table>

                      ${credentialsRows ? `
                        <!-- Separator -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                          <tbody><tr><td style="border-top: 1px solid #e4e4e7;"></td></tr></tbody>
                        </table>

                        <!-- Credentials Section -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #FEF3C7; border: 2px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 25px 0;">
                          <tbody>
                            <tr>
                              <td colspan="2" style="padding-bottom: 15px;">
                                <h3 style="margin: 0; color: #92400E; font-size: 18px;">Access Credentials</h3>
                              </td>
                            </tr>
                            ${credentialsRows}
                            <tr>
                              <td colspan="2" style="padding-top: 15px;">
                                <p style="margin: 0; color: #92400E; font-size: 14px;">⚠️ Keep these credentials secure. Do not share them with anyone.</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      ` : ''}

                      <!-- Separator -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tbody><tr><td style="border-top: 1px solid #e4e4e7;"></td></tr></tbody>
                      </table>

                      <!-- Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
                        <tbody>
                          <tr>
                            <td style="border-radius: 6px; background-color: #10B981;">
                              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/access" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">View Your Access</a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 15px 40px; background-color: #fff; border-bottom-left-radius: 14px; border-bottom-right-radius: 14px;">
                      <p style="margin: 0 0 6px 6px; font-size: 14px; color: #707070;">Best Regards,</p>
                      <p style="margin: 0 0 6px 6px; font-size: 14px; color: #707070;">If you have any questions, contact us at <a href="mailto:devops@callpro.mn" style="color: #00A3FF; text-decoration: none;">devops@callpro.mn</a> or <a href="tel:+97672727070" style="color: #00A3FF; text-decoration: none;">(976)7272-7070</a></p>
                      <p style="margin: 6px 0 0 6px; font-size: 12px; color: #707070;">©2025 CallPro LLC, #502, Regis Place, Chinggis Avenue, Khan-Uul District, Ulaanbaatar 17011, Mongolia</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `

  return sendEmail({
    to: requesterEmail,
    subject,
    html
  })
}

/**
 * Send access rejected notification to requester
 */
export async function sendAccessRejectedNotification(
  requesterEmail: string,
  data: AccessRejectedEmailData
) {
  const subject = `[Access Control] Access Request Rejected - ${data.resourceName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0">
        <tbody>
          <tr>
            <td align="center" style="padding: 0">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #fff; border-radius: 14px;">
                <tbody>
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 0; border-top-left-radius: 14px; border-top-right-radius: 14px; overflow: hidden;">
                      <img src="https://platform-cdn.callpro.mn/icon/img_icon/img_header_callpro.png" alt="CallPro Platform Logo" style="display: block; width: 100%; height: auto">
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 40px; color: #0E0D57;">
                      <p style="margin: 0 0 8px 0; color: #0E0D57; font-size: 17px; line-height: 1.5;">Hi ${data.requesterName},</p>
                      <p style="margin: 0 0 20px 0; color: #0E0D57; font-size: 17px; line-height: 1.5;">Your access request has been reviewed and has not been approved at this time.</p>

                      <!-- Separator -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tbody><tr><td style="border-top: 1px solid #e4e4e7;"></td></tr></tbody>
                      </table>

                      <!-- Request Details -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tbody>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Resource</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;"><strong>${data.resourceName}</strong> (${data.resourceType})</td>
                          </tr>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Access Level</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;">${data.accessLevel}</td>
                          </tr>
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Rejected By</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;"><a href="mailto:${data.rejectedBy}" style="color: #00A3FF; text-decoration: none;">${data.rejectedBy}</a></td>
                          </tr>
                          ${data.reason ? `
                          <tr>
                            <td style="width: 30%; padding: 10px 0; vertical-align: top; color: #707070; font-size: 16px;">Reason</td>
                            <td style="width: 70%; padding: 10px 0; vertical-align: top; color: #0E0D57; font-size: 16px;">${data.reason}</td>
                          </tr>
                          ` : ''}
                        </tbody>
                      </table>

                      <!-- Separator -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
                        <tbody><tr><td style="border-top: 1px solid #e4e4e7;"></td></tr></tbody>
                      </table>

                      <!-- Rejection Status Badge -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 20px 0;">
                        <tbody>
                          <tr>
                            <td style="padding-right: 12px; vertical-align: middle;">
                              <span style="font-size: 32px; line-height: 32px; display: inline-block;">❌</span>
                            </td>
                            <td style="vertical-align: middle;">
                              <p style="margin: 0; color: #000000; font-size: 18px; font-weight: 600;">Your Access Request Has Been Rejected</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p style="margin: 0 0 20px 0; color: #0E0D57; font-size: 17px; line-height: 1.5;">If you believe this decision was made in error or you have additional information to provide, please contact the resource owner or IT support.</p>

                      <!-- Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
                        <tbody>
                          <tr>
                            <td style="border-radius: 6px; background-color: #007BFF;">
                              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/access/request" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">Request Different Access</a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 15px 40px; background-color: #fff; border-bottom-left-radius: 14px; border-bottom-right-radius: 14px;">
                      <p style="margin: 0 0 6px 6px; font-size: 14px; color: #707070;">Best Regards,</p>
                      <p style="margin: 0 0 6px 6px; font-size: 14px; color: #707070;">If you have any questions, contact us at <a href="mailto:devops@callpro.mn" style="color: #00A3FF; text-decoration: none;">devops@callpro.mn</a> or <a href="tel:+97672727070" style="color: #00A3FF; text-decoration: none;">(976)7272-7070</a></p>
                      <p style="margin: 6px 0 0 6px; font-size: 12px; color: #707070;">©2025 CallPro LLC, #502, Regis Place, Chinggis Avenue, Khan-Uul District, Ulaanbaatar 17011, Mongolia</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `

  return sendEmail({
    to: requesterEmail,
    subject,
    html
  })
}
