import { describe, it, expect } from 'vitest'
import { ExcelParser } from '@/utils/excel-parser'
import type { ExcelRow } from '@/types'

describe('ExcelParser.parseUsers', () => {
  it('splits comma-separated users', () => {
    expect(ExcelParser.parseUsers('Alice, Bob, Charlie')).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('splits semicolon-separated users', () => {
    expect(ExcelParser.parseUsers('Alice;Bob')).toEqual(['Alice', 'Bob'])
  })

  it('trims whitespace', () => {
    expect(ExcelParser.parseUsers('  Alice ,  Bob  ')).toEqual(['Alice', 'Bob'])
  })

  it('filters empty entries', () => {
    expect(ExcelParser.parseUsers('Alice,,Bob')).toEqual(['Alice', 'Bob'])
  })

  it('returns single user without delimiters', () => {
    expect(ExcelParser.parseUsers('Alice')).toEqual(['Alice'])
  })
})

describe('ExcelParser.parseSystems', () => {
  it('splits comma-separated systems', () => {
    expect(ExcelParser.parseSystems('GitHub, Jira')).toEqual(['GitHub', 'Jira'])
  })

  it('splits semicolon-separated systems', () => {
    expect(ExcelParser.parseSystems('GitHub;Jira')).toEqual(['GitHub', 'Jira'])
  })

  it('filters empty entries', () => {
    expect(ExcelParser.parseSystems('GitHub,,Jira')).toEqual(['GitHub', 'Jira'])
  })
})

describe('ExcelParser.validateRow', () => {
  const valid: ExcelRow = {
    department: 'Engineering',
    accessSystem: 'GitHub',
    systems: 'GitHub',
    users: 'alice@example.com',
    accessLevel: 'READ',
    location: 'Remote',
    createdBy: 'IT Admin',
  }

  it('returns null for a valid row', () => {
    expect(ExcelParser.validateRow(valid, 0)).toBeNull()
  })

  it('returns error when department is missing', () => {
    const result = ExcelParser.validateRow({ ...valid, department: '' }, 0)
    expect(result).not.toBeNull()
    expect(result!.message).toContain('Department is required')
  })

  it('returns error when systems is missing', () => {
    const result = ExcelParser.validateRow({ ...valid, systems: '' }, 0)
    expect(result).not.toBeNull()
    expect(result!.message).toContain('System is required')
  })

  it('returns error when users is missing', () => {
    const result = ExcelParser.validateRow({ ...valid, users: '' }, 0)
    expect(result).not.toBeNull()
    expect(result!.message).toContain('Users are required')
  })

  it('returns error when accessLevel is missing', () => {
    const result = ExcelParser.validateRow({ ...valid, accessLevel: '' }, 0)
    expect(result).not.toBeNull()
    expect(result!.message).toContain('Access level is required')
  })

  it('includes row number offset by 1 in the result', () => {
    const result = ExcelParser.validateRow({ ...valid, department: '' }, 4)
    expect(result!.row).toBe(5)
  })

  it('combines multiple errors in one message', () => {
    const result = ExcelParser.validateRow(
      { ...valid, department: '', systems: '', users: '' },
      0
    )
    expect(result!.message).toContain('Department is required')
    expect(result!.message).toContain('System is required')
    expect(result!.message).toContain('Users are required')
  })
})

describe('ExcelParser.processImportData', () => {
  const rows: ExcelRow[] = [
    {
      department: 'Engineering',
      accessSystem: 'Tech',
      systems: 'GitHub, Jira',
      users: 'alice@example.com',
      accessLevel: 'FULL',
      location: 'Office',
      createdBy: 'Admin',
    },
    {
      department: 'Sales',
      accessSystem: 'CRM',
      systems: 'HubSpot',
      users: 'bob@example.com, alice@example.com',
      accessLevel: 'READ',
      location: 'Remote',
      createdBy: 'Admin',
    },
  ]

  it('collects unique departments', () => {
    const result = ExcelParser.processImportData(rows)
    expect(result.departments).toEqual(expect.arrayContaining(['Engineering', 'Sales']))
    expect(result.departments).toHaveLength(2)
  })

  it('collects unique systems', () => {
    const result = ExcelParser.processImportData(rows)
    expect(result.systems).toEqual(expect.arrayContaining(['GitHub', 'Jira', 'HubSpot']))
    expect(result.systems).toHaveLength(3)
  })

  it('deduplicates employees that appear in multiple rows', () => {
    const result = ExcelParser.processImportData(rows)
    const alice = result.employees.find(e => e.email === 'alice@example.com')
    expect(alice).toBeDefined()
    // alice appears in both rows — should be a single employee entry
    expect(result.employees.filter(e => e.email === 'alice@example.com')).toHaveLength(1)
  })

  it('accumulates systems for employees in multiple rows', () => {
    const result = ExcelParser.processImportData(rows)
    const alice = result.employees.find(e => e.email === 'alice@example.com')!
    const systemNames = alice.systems.map(s => s.system)
    expect(systemNames).toContain('GitHub')
    expect(systemNames).toContain('HubSpot')
  })
})

describe('ExcelParser.generateTemplate', () => {
  it('returns a non-empty buffer', () => {
    const buf = ExcelParser.generateTemplate()
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(0)
  })

  it('produces a parseable workbook with a header row', () => {
    const buf = ExcelParser.generateTemplate()
    const rows = ExcelParser.parseFile(buf)
    // Template has 2 data rows after the header
    expect(rows).toHaveLength(2)
  })
})
