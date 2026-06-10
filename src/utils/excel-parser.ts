import * as XLSX from 'xlsx'
import { ExcelRow, ImportResult } from '@/types'

export class ExcelParser {
  static parseFile(buffer: Buffer): ExcelRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    // Skip header row and convert to our format
    const rows: ExcelRow[] = []
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[]
      
      if (row.length < 7) continue // Skip incomplete rows
      
      rows.push({
        department: row[0]?.toString().trim() || '',
        accessSystem: row[1]?.toString().trim() || '',
        systems: row[2]?.toString().trim() || '',
        users: row[3]?.toString().trim() || '',
        accessLevel: row[4]?.toString().trim() || '',
        location: row[5]?.toString().trim() || '',
        createdBy: row[6]?.toString().trim() || '',
      })
    }
    
    return rows
  }

  static validateRow(row: ExcelRow, index: number): ImportResult['details'][0] | null {
    const errors: string[] = []
    
    if (!row.department) {
      errors.push('Department is required')
    }
    
    if (!row.systems) {
      errors.push('System is required')
    }
    
    if (!row.users) {
      errors.push('Users are required')
    }
    
    if (!row.accessLevel) {
      errors.push('Access level is required')
    }
    
    if (errors.length > 0) {
      return {
        row: index + 1,
        message: errors.join(', '),
        type: 'error',
      }
    }
    
    return null
  }

  static parseUsers(usersString: string): string[] {
    // Split by common delimiters and clean up
    return usersString
      .split(/[,;]/)
      .map(user => user.trim())
      .filter(user => user.length > 0)
  }

  static parseSystems(systemsString: string): string[] {
    // Split by common delimiters and clean up
    return systemsString
      .split(/[,;]/)
      .map(system => system.trim())
      .filter(system => system.length > 0)
  }

  static generateTemplate(): Buffer {
    const template = [
      ['Department', 'Access System', 'Systems', 'Users', 'Access Level', 'Location', 'Created By'],
      ['Customer Service', 'Technical Support', 'CallPro Teams', 'John Doe, Jane Smith', 'Full Access', 'Office', 'IT Admin'],
      ['Sales', 'Marketing', 'HubSpot, Monday.com', 'Sales Team', 'Limited Access', 'Remote', 'HR Manager'],
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Access Control')
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  }

  static processImportData(rows: ExcelRow[]): {
    employees: Array<{
      name: string
      email: string
      department: string
      systems: Array<{
        system: string
        accessLevel: string
      }>
    }>
    systems: string[]
    departments: string[]
  } {
    const employeeMap = new Map<string, {
      name: string
      email: string
      department: string
      systems: Array<{
        system: string
        accessLevel: string
      }>
    }>()
    
    const systems = new Set<string>()
    const departments = new Set<string>()
    
    for (const row of rows) {
      const users = this.parseUsers(row.users)
      const systemList = this.parseSystems(row.systems)
      
      departments.add(row.department)
      systemList.forEach(system => systems.add(system))
      
      for (const user of users) {
        const email = this.extractEmail(user)
        const name = this.extractName(user)
        
        if (!employeeMap.has(email)) {
          employeeMap.set(email, {
            name,
            email,
            department: row.department,
            systems: [],
          })
        }
        
        const employee = employeeMap.get(email)!
        systemList.forEach(system => {
          employee.systems.push({
            system,
            accessLevel: row.accessLevel,
          })
        })
      }
    }
    
    return {
      employees: Array.from(employeeMap.values()),
      systems: Array.from(systems),
      departments: Array.from(departments),
    }
  }

  private static extractEmail(userString: string): string {
    // Try to extract email from user string
    const emailMatch = userString.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    if (emailMatch) {
      return emailMatch[1]
    }
    
    // If no email found, generate one from name
    const name = this.extractName(userString)
    return `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`
  }

  private static extractName(userString: string): string {
    // Remove email if present
    const nameOnly = userString.replace(/<[^>]+>/g, '').trim()
    
    // If it looks like "FirstName LastName <email>", extract the name part
    const nameMatch = nameOnly.match(/^([^<]+)/)
    if (nameMatch) {
      return nameMatch[1].trim()
    }
    
    return nameOnly
  }
}
