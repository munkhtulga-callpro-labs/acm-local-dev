import { describe, it, expect } from 'vitest'
import { createApiKeySchema, updateApiKeySchema, apiKeyBaseSchema } from '@/lib/schemas/api-key'

const validBase = {
  serviceName: 'Stripe',
  apiKeyToken: 'sk_live_abc123',
  keyType: 'Production' as const,
  scopePermissions: 'read:charges write:refunds',
  status: 'ACTIVE' as const,
}

describe('apiKeyBaseSchema — optional email (assignedTo)', () => {
  it('accepts no value', () => {
    expect(() => apiKeyBaseSchema.parse(validBase)).not.toThrow()
  })

  it('accepts a valid email', () => {
    expect(() =>
      apiKeyBaseSchema.parse({ ...validBase, assignedTo: 'dev@example.com' })
    ).not.toThrow()
  })

  it('accepts an empty string (treated as absent)', () => {
    expect(() =>
      apiKeyBaseSchema.parse({ ...validBase, assignedTo: '' })
    ).not.toThrow()
  })

  it('rejects a non-email string', () => {
    const result = apiKeyBaseSchema.safeParse({ ...validBase, assignedTo: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})

describe('apiKeyBaseSchema — IP restrictions (ipRestrictions)', () => {
  it('accepts an empty/absent value', () => {
    expect(() => apiKeyBaseSchema.parse(validBase)).not.toThrow()
  })

  it('accepts a single IPv4 address', () => {
    expect(() =>
      apiKeyBaseSchema.parse({ ...validBase, ipRestrictions: '10.0.0.1' })
    ).not.toThrow()
  })

  it('accepts a CIDR range', () => {
    expect(() =>
      apiKeyBaseSchema.parse({ ...validBase, ipRestrictions: '192.168.1.0/24' })
    ).not.toThrow()
  })

  it('accepts a comma-separated list of IPs and CIDRs', () => {
    expect(() =>
      apiKeyBaseSchema.parse({ ...validBase, ipRestrictions: '10.0.0.1, 192.168.0.0/16' })
    ).not.toThrow()
  })

  it('rejects a plain hostname', () => {
    const result = apiKeyBaseSchema.safeParse({ ...validBase, ipRestrictions: 'example.com' })
    expect(result.success).toBe(false)
  })

  it('rejects a list where one entry is invalid', () => {
    const result = apiKeyBaseSchema.safeParse({
      ...validBase,
      ipRestrictions: '10.0.0.1, bad-entry',
    })
    expect(result.success).toBe(false)
  })
})

describe('apiKeyBaseSchema — webhook URLs (webhookUrls)', () => {
  it('accepts an absent value', () => {
    expect(() => apiKeyBaseSchema.parse(validBase)).not.toThrow()
  })

  it('accepts a URL with a proper domain', () => {
    expect(() =>
      apiKeyBaseSchema.parse({ ...validBase, webhookUrls: 'https://example.com/hook' })
    ).not.toThrow()
  })

  it('accepts a localhost URL', () => {
    expect(() =>
      apiKeyBaseSchema.parse({ ...validBase, webhookUrls: 'http://localhost:3000/hook' })
    ).not.toThrow()
  })

  it('accepts an IP-based URL', () => {
    expect(() =>
      apiKeyBaseSchema.parse({ ...validBase, webhookUrls: 'http://10.0.0.5/hook' })
    ).not.toThrow()
  })

  it('accepts a comma-separated list of URLs', () => {
    expect(() =>
      apiKeyBaseSchema.parse({
        ...validBase,
        webhookUrls: 'https://example.com/a, https://other.io/b',
      })
    ).not.toThrow()
  })

  it('rejects an invalid URL', () => {
    const result = apiKeyBaseSchema.safeParse({ ...validBase, webhookUrls: 'not a url' })
    expect(result.success).toBe(false)
  })
})

describe('apiKeyBaseSchema — expiry date (expiryDate)', () => {
  it('accepts an absent value', () => {
    expect(() => apiKeyBaseSchema.parse(validBase)).not.toThrow()
  })

  it('accepts a future date', () => {
    expect(() =>
      apiKeyBaseSchema.parse({ ...validBase, expiryDate: '2099-12-31' })
    ).not.toThrow()
  })

  it('rejects a past date', () => {
    const result = apiKeyBaseSchema.safeParse({ ...validBase, expiryDate: '2000-01-01' })
    expect(result.success).toBe(false)
  })
})

describe('apiKeyBaseSchema — required fields', () => {
  it('rejects missing serviceName', () => {
    expect(() => apiKeyBaseSchema.parse({ ...validBase, serviceName: '' })).toThrow()
  })

  it('rejects missing apiKeyToken', () => {
    expect(() => apiKeyBaseSchema.parse({ ...validBase, apiKeyToken: '' })).toThrow()
  })

  it('rejects missing scopePermissions', () => {
    expect(() => apiKeyBaseSchema.parse({ ...validBase, scopePermissions: '' })).toThrow()
  })

  it('rejects unknown keyType', () => {
    expect(() => apiKeyBaseSchema.parse({ ...validBase, keyType: 'Legacy' })).toThrow()
  })

  it('rejects unknown status', () => {
    expect(() => apiKeyBaseSchema.parse({ ...validBase, status: 'PENDING' })).toThrow()
  })
})

describe('createApiKeySchema — transforms', () => {
  it('converts empty optional strings to null', () => {
    const result = createApiKeySchema.parse({ ...validBase, rateLimit: '  ', notes: '' })
    expect(result.rateLimit).toBeNull()
    expect(result.notes).toBeNull()
  })

  it('converts expiryDate string to a Date object', () => {
    const result = createApiKeySchema.parse({ ...validBase, expiryDate: '2099-12-31' })
    expect(result.expiryDate).toBeInstanceOf(Date)
  })

  it('converts absent expiryDate to null', () => {
    const result = createApiKeySchema.parse(validBase)
    expect(result.expiryDate).toBeNull()
  })
})

describe('updateApiKeySchema — optional apiKeyToken', () => {
  it('allows omitting apiKeyToken', () => {
    const { apiKeyToken: _, ...withoutToken } = validBase
    expect(() => updateApiKeySchema.parse(withoutToken)).not.toThrow()
  })

  it('converts empty apiKeyToken to null', () => {
    const result = updateApiKeySchema.parse({ ...validBase, apiKeyToken: '   ' })
    expect(result.apiKeyToken).toBeNull()
  })
})
