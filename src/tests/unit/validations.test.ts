import { describe, it, expect } from 'vitest'
import {
  createUserSchema,
  updateUserSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  createAccessRequestSchema,
  createAccessPermissionSchema,
  updateAccessPermissionSchema,
  paginationSchema,
  auditLogQuerySchema,
  createCompanySchema,
} from '@/lib/validations'

describe('createUserSchema', () => {
  const valid = {
    name: 'Alice',
    email: 'alice@example.com',
    password: 'secret123',
    role: 'ADMIN' as const,
  }

  it('accepts a valid user payload', () => {
    expect(() => createUserSchema.parse(valid)).not.toThrow()
  })

  it('rejects missing name', () => {
    expect(() => createUserSchema.parse({ ...valid, name: '' })).toThrow()
  })

  it('rejects invalid email', () => {
    expect(() => createUserSchema.parse({ ...valid, email: 'not-an-email' })).toThrow()
  })

  it('rejects password shorter than 6 characters', () => {
    expect(() => createUserSchema.parse({ ...valid, password: 'abc' })).toThrow()
  })

  it('rejects unknown role', () => {
    expect(() => createUserSchema.parse({ ...valid, role: 'GOD_MODE' })).toThrow()
  })

  it('accepts all valid roles', () => {
    const roles = ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE', 'IT_STAFF'] as const
    for (const role of roles) {
      expect(() => createUserSchema.parse({ ...valid, role })).not.toThrow()
    }
  })
})

describe('updateUserSchema', () => {
  it('accepts an empty update (all fields optional)', () => {
    expect(() => updateUserSchema.parse({})).not.toThrow()
  })

  it('rejects invalid email when provided', () => {
    expect(() => updateUserSchema.parse({ email: 'bad' })).toThrow()
  })

  it('accepts partial updates', () => {
    expect(() => updateUserSchema.parse({ name: 'Bob', isActive: false })).not.toThrow()
  })
})

describe('createEmployeeSchema', () => {
  const valid = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    department: 'Engineering',
    position: 'Developer',
  }

  it('accepts a minimal valid employee', () => {
    expect(() => createEmployeeSchema.parse(valid)).not.toThrow()
  })

  it('rejects missing firstName', () => {
    expect(() => createEmployeeSchema.parse({ ...valid, firstName: '' })).toThrow()
  })

  it('rejects invalid email', () => {
    expect(() => createEmployeeSchema.parse({ ...valid, email: 'nope' })).toThrow()
  })

  it('rejects invalid manager email when provided', () => {
    expect(() =>
      createEmployeeSchema.parse({ ...valid, manager: 'not-an-email' })
    ).toThrow()
  })

  it('accepts empty string as manager (no manager)', () => {
    expect(() =>
      createEmployeeSchema.parse({ ...valid, manager: '' })
    ).not.toThrow()
  })

  it('transforms startDate string to Date', () => {
    const result = createEmployeeSchema.parse({ ...valid, startDate: '2024-01-15' })
    expect(result.startDate).toBeInstanceOf(Date)
  })
})

describe('updateEmployeeSchema', () => {
  it('accepts an empty update (all fields optional)', () => {
    expect(() => updateEmployeeSchema.parse({})).not.toThrow()
  })

  it('transforms endDate string to Date', () => {
    const result = updateEmployeeSchema.parse({ endDate: '2024-06-30' })
    expect(result.endDate).toBeInstanceOf(Date)
  })

  it('leaves endDate undefined when not provided', () => {
    const result = updateEmployeeSchema.parse({})
    expect(result.endDate).toBeUndefined()
  })
})

describe('createAccessPermissionSchema', () => {
  const valid = {
    employeeId: 'emp-1',
    systemId: 'sys-1',
    accessLevel: 'READ',
  }

  it('accepts a payload without an expiry', () => {
    expect(() => createAccessPermissionSchema.parse(valid)).not.toThrow()
  })

  it('transforms expiresAt string to Date', () => {
    const result = createAccessPermissionSchema.parse({ ...valid, expiresAt: '2025-12-31' })
    expect(result.expiresAt).toBeInstanceOf(Date)
  })

  it('rejects missing accessLevel', () => {
    expect(() =>
      createAccessPermissionSchema.parse({ ...valid, accessLevel: '' })
    ).toThrow()
  })
})

describe('updateAccessPermissionSchema', () => {
  it('accepts an empty update (all fields optional)', () => {
    expect(() => updateAccessPermissionSchema.parse({})).not.toThrow()
  })

  it('transforms expiresAt string to Date', () => {
    const result = updateAccessPermissionSchema.parse({ expiresAt: '2025-12-31' })
    expect(result.expiresAt).toBeInstanceOf(Date)
  })
})

describe('createAccessRequestSchema', () => {
  const valid = {
    employeeId: 'emp-1',
    requestType: 'ONBOARDING' as const,
    title: 'New hire setup',
    systems: [{ systemId: 'sys-1', accessLevel: 'READ', isRequired: true }],
  }

  it('accepts a valid request', () => {
    expect(() => createAccessRequestSchema.parse(valid)).not.toThrow()
  })

  it('rejects unknown requestType', () => {
    expect(() =>
      createAccessRequestSchema.parse({ ...valid, requestType: 'UNKNOWN' })
    ).toThrow()
  })

  it('defaults priority to MEDIUM', () => {
    const result = createAccessRequestSchema.parse(valid)
    expect(result.priority).toBe('MEDIUM')
  })

  it('accepts explicit priority', () => {
    const result = createAccessRequestSchema.parse({ ...valid, priority: 'URGENT' })
    expect(result.priority).toBe('URGENT')
  })
})

describe('paginationSchema', () => {
  it('defaults page to 1 and limit to 10', () => {
    const result = paginationSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
  })

  it('coerces string page and limit to numbers', () => {
    const result = paginationSchema.parse({ page: '3', limit: '25' })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(25)
  })

  it('defaults sortOrder to desc', () => {
    const result = paginationSchema.parse({})
    expect(result.sortOrder).toBe('desc')
  })

  it('accepts asc sortOrder', () => {
    const result = paginationSchema.parse({ sortOrder: 'asc' })
    expect(result.sortOrder).toBe('asc')
  })
})

describe('auditLogQuerySchema', () => {
  it('accepts an empty query and applies pagination defaults', () => {
    const result = auditLogQuerySchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
  })

  it('transforms startDate and endDate strings to Dates', () => {
    const result = auditLogQuerySchema.parse({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })
    expect(result.startDate).toBeInstanceOf(Date)
    expect(result.endDate).toBeInstanceOf(Date)
  })

  it('leaves startDate and endDate undefined when not provided', () => {
    const result = auditLogQuerySchema.parse({})
    expect(result.startDate).toBeUndefined()
    expect(result.endDate).toBeUndefined()
  })
})

describe('createCompanySchema', () => {
  it('accepts a minimal company with just a name', () => {
    expect(() => createCompanySchema.parse({ name: 'Acme Corp' })).not.toThrow()
  })

  it('rejects invalid website URL', () => {
    expect(() =>
      createCompanySchema.parse({ name: 'Acme', website: 'not-a-url' })
    ).toThrow()
  })

  it('rejects invalid email', () => {
    expect(() =>
      createCompanySchema.parse({ name: 'Acme', email: 'bad-email' })
    ).toThrow()
  })
})
