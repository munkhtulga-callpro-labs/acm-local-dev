import { z } from 'zod'

const optStr = z.string().optional().transform(v => v?.trim() || null)
const optDate = z.string().optional()
  .refine(
    v => !v || new Date(v) >= new Date(new Date().toDateString()),
    'Expiry date cannot be in the past'
  )
  .transform(v => v ? new Date(v) : null)

const optIpList = z.string().optional()
  .refine(
    v => !v?.trim() || v.split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .every(entry => z.ipv4().safeParse(entry).success || z.cidrv4().safeParse(entry).success),
    'Must be valid IPv4 addresses or CIDR ranges (e.g. 10.0.0.1, 192.168.1.0/24)'
  )
  .transform(v => v?.trim() || null)

const optEmail = z.string().optional()
  .refine(
    v => !v?.trim() || z.email().safeParse(v.trim()).success,
    'Invalid email address'
  )
  .transform(v => v?.trim() || null)

const optUrl = z.string().optional()
  .refine(
    v => !v?.trim() || v.split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .every(entry => z.url().safeParse(entry).success),
    "Invalid url"
  )

export const createApiKeySchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  apiKeyToken: z.string().min(1, 'API key token is required'),
  keyType: z.enum(['Production', 'Sandbox', 'Development']),
  scopePermissions: z.string().min(1, 'Scope / permissions is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'REVOKED']).default('ACTIVE'),
  rateLimit: optStr,
  expiryDate: optDate,
  assignedTo: optEmail,
  notes: optStr,
  ipRestrictions: optIpList,
  webhookUrls: optUrl,
})

export const updateApiKeySchema = createApiKeySchema.extend({
  apiKeyToken: optStr,
})

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>
