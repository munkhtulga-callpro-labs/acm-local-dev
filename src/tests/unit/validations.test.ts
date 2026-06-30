import { describe, it, expect } from 'vitest'
import {
  createUserSchema,
  updateUserSchema,
  createEmployeeSchema,
  createAccessRequestSchema,
  paginationSchema,
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
