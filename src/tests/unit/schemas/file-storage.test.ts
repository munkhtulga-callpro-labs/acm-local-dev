import { describe, it, expect } from 'vitest'
import { createFileStorageSchema, fileStorageBaseSchema } from '@/lib/schemas/file-storage'

const valid = {
  storageType: 'S3' as const,
  pathLocation: 's3://my-bucket/data',
  permissionLevel: 'Read' as const,
  status: 'ACTIVE' as const,
}

describe('fileStorageBaseSchema — required fields', () => {
  it('accepts a valid minimal payload', () => {
    expect(() => fileStorageBaseSchema.parse(valid)).not.toThrow()
  })

  it('rejects missing pathLocation', () => {
    expect(() => fileStorageBaseSchema.parse({ ...valid, pathLocation: '' })).toThrow()
  })

  it('rejects unknown storageType', () => {
    expect(() => fileStorageBaseSchema.parse({ ...valid, storageType: 'Dropbox' })).toThrow()
  })

  it('rejects unknown permissionLevel', () => {
    expect(() => fileStorageBaseSchema.parse({ ...valid, permissionLevel: 'Admin' })).toThrow()
  })

  it('rejects unknown status', () => {
    expect(() => fileStorageBaseSchema.parse({ ...valid, status: 'PENDING' })).toThrow()
  })
})

describe('fileStorageBaseSchema — storageType enum', () => {
  const types = ['Network Share', 'OneDrive', 'Google Drive', 'SharePoint', 'S3', 'NFS', 'Other'] as const
  it.each(types)('accepts storageType %s', (storageType) => {
    expect(() => fileStorageBaseSchema.parse({ ...valid, storageType })).not.toThrow()
  })
})

describe('fileStorageBaseSchema — optional email (assignedTo)', () => {
  it('accepts a valid email', () => {
    expect(() =>
      fileStorageBaseSchema.parse({ ...valid, assignedTo: 'user@example.com' })
    ).not.toThrow()
  })

  it('accepts an empty string', () => {
    expect(() => fileStorageBaseSchema.parse({ ...valid, assignedTo: '' })).not.toThrow()
  })

  it('rejects an invalid email', () => {
    const result = fileStorageBaseSchema.safeParse({ ...valid, assignedTo: 'not-email' })
    expect(result.success).toBe(false)
  })
})

describe('createFileStorageSchema — transforms', () => {
  it('converts expiryDate string to a Date', () => {
    const result = createFileStorageSchema.parse({ ...valid, expiryDate: '2099-06-30' })
    expect(result.expiryDate).toBeInstanceOf(Date)
  })

  it('sets expiryDate to null when absent', () => {
    const result = createFileStorageSchema.parse(valid)
    expect(result.expiryDate).toBeNull()
  })

  it('converts empty optional strings to null', () => {
    const result = createFileStorageSchema.parse({
      ...valid,
      quotaLimit: '  ',
      notes: '',
      ownerDepartment: ' ',
    })
    expect(result.quotaLimit).toBeNull()
    expect(result.notes).toBeNull()
    expect(result.ownerDepartment).toBeNull()
  })

  it('trims and preserves non-empty optional strings', () => {
    const result = createFileStorageSchema.parse({ ...valid, notes: '  important note  ' })
    expect(result.notes).toBe('important note')
  })
})
