import { z } from 'zod'

const optEmail = z.string().optional()
  .refine(
    v => !v?.trim() || z.email().safeParse(v.trim()).success,
    'Invalid email address'
  )

const optIpList = z.string().optional()
  .refine(
    v => !v?.trim() || v.split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .every(entry => z.ipv4().safeParse(entry).success || z.cidrv4().safeParse(entry).success),
    'Must be valid IPv4 addresses or CIDR ranges (e.g. 10.0.0.1, 192.168.1.0/24)'
  )

const optUrl = z.string().optional()
  .refine(
    v => !v?.trim() || v.split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .every(entry => z.url().safeParse(entry).success),
    'Must be valid URLs (e.g. https://example.com/webhook)'
  )

const optDate = z.string().optional()
  .refine(
    v => !v || new Date(v) >= new Date(new Date().toDateString()),
    'Expiry date cannot be in the past'
  )

export const apiKeyBaseSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  apiKeyToken: z.string().min(1, 'API key token is required'),
  keyType: z.enum(['Production', 'Sandbox', 'Development']),
  scopePermissions: z.string().min(1, 'Scope / permissions is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'REVOKED']),
  rateLimit: z.string().optional(),
  expiryDate: optDate,
  assignedTo: optEmail,
  notes: z.string().optional(),
  ipRestrictions: optIpList,
  webhookUrls: optUrl,
})

export const apiKeyEditBaseSchema = apiKeyBaseSchema.extend({
  apiKeyToken: z.string().optional(),
})

type CommonFields = Omit<z.infer<typeof apiKeyEditBaseSchema>, 'apiKeyToken'>

const transformCommonFields = (data: CommonFields) => ({
  rateLimit: data.rateLimit?.trim() || null,
  expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
  assignedTo: data.assignedTo?.trim() || null,
  notes: data.notes?.trim() || null,
  ipRestrictions: data.ipRestrictions?.trim() || null,
  webhookUrls: data.webhookUrls?.trim() || null,
})

export const createApiKeySchema = apiKeyBaseSchema.transform(data => ({
  ...data,
  ...transformCommonFields(data),
}))

export const updateApiKeySchema = apiKeyEditBaseSchema.transform(data => ({
  ...data,
  ...transformCommonFields(data),
  apiKeyToken: data.apiKeyToken?.trim() || null,
}))

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>
