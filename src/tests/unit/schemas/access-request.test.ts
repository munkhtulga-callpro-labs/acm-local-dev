import { describe, it, expect } from 'vitest'
import { createAccessRequestSchema } from '@/lib/schemas/access-request'

const valid = {
  resourceType: 'SaaS',
  resourceId: 'res-1',
  resourceName: 'GitHub',
  accessLevel: 'READ',
  businessJustification: 'Need access to review code changes in the repo',
  validFrom: '2099-01-01',
}

describe('createAccessRequestSchema', () => {
  it('accepts a valid payload', () => {
    expect(() => createAccessRequestSchema.parse(valid)).not.toThrow()
  })

  it('defaults priority to MEDIUM', () => {
    const result = createAccessRequestSchema.parse(valid)
    expect(result.priority).toBe('MEDIUM')
  })

  it('accepts an explicit priority', () => {
    const result = createAccessRequestSchema.parse({ ...valid, priority: 'URGENT' })
    expect(result.priority).toBe('URGENT')
  })

  it('rejects all unknown priority values', () => {
    expect(() => createAccessRequestSchema.parse({ ...valid, priority: 'CRITICAL' })).toThrow()
  })

  it('requires businessJustification to be at least 20 characters', () => {
    expect(() =>
      createAccessRequestSchema.parse({ ...valid, businessJustification: 'Too short' })
    ).toThrow()
  })

  it('accepts businessJustification of exactly 20 characters', () => {
    expect(() =>
      createAccessRequestSchema.parse({ ...valid, businessJustification: '12345678901234567890' })
    ).not.toThrow()
  })

  it('requires resourceType', () => {
    expect(() => createAccessRequestSchema.parse({ ...valid, resourceType: '' })).toThrow()
  })

  it('requires resourceId', () => {
    expect(() => createAccessRequestSchema.parse({ ...valid, resourceId: '' })).toThrow()
  })

  it('requires resourceName', () => {
    expect(() => createAccessRequestSchema.parse({ ...valid, resourceName: '' })).toThrow()
  })

  it('requires accessLevel', () => {
    expect(() => createAccessRequestSchema.parse({ ...valid, accessLevel: '' })).toThrow()
  })

  it('requires validFrom', () => {
    expect(() => createAccessRequestSchema.parse({ ...valid, validFrom: '' })).toThrow()
  })

  it('accepts null validTo', () => {
    expect(() => createAccessRequestSchema.parse({ ...valid, validTo: null })).not.toThrow()
  })

  it('accepts null accessRequestTicketId', () => {
    expect(() =>
      createAccessRequestSchema.parse({ ...valid, accessRequestTicketId: null })
    ).not.toThrow()
  })
})
