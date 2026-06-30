import { describe, it, expect } from 'vitest'
import { createPhysicalAccessSchema, physicalAccessBaseSchema } from '@/lib/schemas/physical-access'

const valid = {
  location: 'Server Room B',
  accessType: 'Badge' as const,
  accessSchedule: '24/7' as const,
  accessZones: 'Zone A, Zone B',
  validFrom: '2024-01-01',
  status: 'ACTIVE' as const,
  escortRequired: false,
}

describe('physicalAccessBaseSchema — required fields', () => {
  it('accepts a valid payload', () => {
    expect(() => physicalAccessBaseSchema.parse(valid)).not.toThrow()
  })

  it('rejects missing location', () => {
    expect(() => physicalAccessBaseSchema.parse({ ...valid, location: '' })).toThrow()
  })

  it('rejects missing accessZones', () => {
    expect(() => physicalAccessBaseSchema.parse({ ...valid, accessZones: '' })).toThrow()
  })

  it('rejects missing validFrom', () => {
    expect(() => physicalAccessBaseSchema.parse({ ...valid, validFrom: '' })).toThrow()
  })
})

describe('physicalAccessBaseSchema — enums', () => {
  const accessTypes = ['Badge', 'Key', 'Biometric', 'PIN', 'Badge + PIN'] as const
  it.each(accessTypes)('accepts accessType %s', (accessType) => {
    expect(() => physicalAccessBaseSchema.parse({ ...valid, accessType })).not.toThrow()
  })

  it('rejects unknown accessType', () => {
    expect(() => physicalAccessBaseSchema.parse({ ...valid, accessType: 'Retina' })).toThrow()
  })

  const schedules = ['24/7', 'Business Hours', 'Weekdays Only', 'Custom'] as const
  it.each(schedules)('accepts accessSchedule %s', (accessSchedule) => {
    expect(() => physicalAccessBaseSchema.parse({ ...valid, accessSchedule })).not.toThrow()
  })

  const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'] as const
  it.each(statuses)('accepts status %s', (status) => {
    expect(() => physicalAccessBaseSchema.parse({ ...valid, status })).not.toThrow()
  })

  it('rejects unknown status', () => {
    expect(() => physicalAccessBaseSchema.parse({ ...valid, status: 'PENDING' })).toThrow()
  })
})

describe('physicalAccessBaseSchema — optional email (assignedTo)', () => {
  it('accepts a valid email', () => {
    expect(() =>
      physicalAccessBaseSchema.parse({ ...valid, assignedTo: 'guard@example.com' })
    ).not.toThrow()
  })

  it('accepts an empty string', () => {
    expect(() =>
      physicalAccessBaseSchema.parse({ ...valid, assignedTo: '' })
    ).not.toThrow()
  })

  it('rejects an invalid email', () => {
    const result = physicalAccessBaseSchema.safeParse({ ...valid, assignedTo: 'not-email' })
    expect(result.success).toBe(false)
  })
})

describe('createPhysicalAccessSchema — transforms', () => {
  it('transforms validFrom string to a Date', () => {
    const result = createPhysicalAccessSchema.parse(valid)
    expect(result.validFrom).toBeInstanceOf(Date)
  })

  it('transforms validTo string to a Date', () => {
    const result = createPhysicalAccessSchema.parse({ ...valid, validTo: '2099-12-31' })
    expect(result.validTo).toBeInstanceOf(Date)
  })

  it('sets validTo to null when absent', () => {
    const result = createPhysicalAccessSchema.parse(valid)
    expect(result.validTo).toBeNull()
  })

  it('trims and nullifies empty optional string fields', () => {
    const result = createPhysicalAccessSchema.parse({
      ...valid,
      badgeCardNumber: '  ',
      notes: '',
      authorizationLevel: ' ',
    })
    expect(result.badgeCardNumber).toBeNull()
    expect(result.notes).toBeNull()
    expect(result.authorizationLevel).toBeNull()
  })
})
