import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface GoogleUser {
  firstName: string
  lastName: string
  email: string
  orgUnit: string
  status: string
  department?: string
}

function parseCSV(csvContent: string): GoogleUser[] {
  const lines = csvContent.split('\n')
  const users: GoogleUser[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',')
    if (values.length < 4) continue

    const user: GoogleUser = {
      firstName: values[0]?.trim() || '',
      lastName: values[1]?.trim() || '',
      email: values[2]?.trim() || '',
      orgUnit: values[5]?.trim() || '',
      status: values[7]?.trim() || 'Active',
      department: values[22]?.trim() || ''
    }

    if (user.email && user.status === 'Active' && user.email.includes('@')) {
      users.push(user)
    }
  }

  return users
}

function extractOrgUnits(users: GoogleUser[]): { [key: string]: string[] } {
  const orgUnits: { [key: string]: string[] } = {
    'CallPro LLC': [],
    'Onlime Network LLC': []
  }

  users.forEach(user => {
    if (user.orgUnit.includes('CallPro MN') || user.orgUnit.includes('CallPro Agent') || user.orgUnit.includes('CallPro KG') || user.orgUnit.includes('CallPro SG') || user.orgUnit.includes('Administration')) {
      if (!orgUnits['CallPro LLC'].includes(user.orgUnit)) {
        orgUnits['CallPro LLC'].push(user.orgUnit)
      }
    } else if (user.orgUnit.includes('Onlime MN')) {
      if (!orgUnits['Onlime Network LLC'].includes(user.orgUnit)) {
        orgUnits['Onlime Network LLC'].push(user.orgUnit)
      }
    }
  })

  return orgUnits
}

function mapOrgUnitToDepartment(orgUnit: string, company: string): string {
  if (company === 'CallPro LLC') {
    if (orgUnit.includes('Tech')) return 'Technical Support'
    if (orgUnit.includes('Sales')) return 'Sales'
    if (orgUnit.includes('HR')) return 'Administration'
    if (orgUnit.includes('Finance')) return 'Finance'
    if (orgUnit.includes('Marketing')) return 'Marketing'
    if (orgUnit.includes('Developers')) return 'Development'
    if (orgUnit.includes('DevOps')) return 'Technical Support'
    if (orgUnit.includes('CustomerSuccess')) return 'Customer Service'
    if (orgUnit.includes('Business')) return 'Business Development'
    if (orgUnit.includes('Billing')) return 'Finance'
    if (orgUnit.includes('SystemAccounts')) return 'Administration'
    if (orgUnit.includes('Agent')) return 'Customer Service'
    if (orgUnit.includes('CRM')) return 'Customer Service'
    return 'Administration' // Default
  } else {
    if (orgUnit.includes('Tech')) return 'Technical Operations Department'
    if (orgUnit.includes('Sales')) return 'Sales Department'
    if (orgUnit.includes('HR')) return 'Administration & Human Resources'
    if (orgUnit.includes('Finance')) return 'Finance & Accounting Department'
    if (orgUnit.includes('Marketing')) return 'Marketing Unit'
    if (orgUnit.includes('Developers')) return 'Development Department'
    if (orgUnit.includes('DevOps')) return 'Technical Operations Department'
    if (orgUnit.includes('CustomerSuccess')) return 'Customer Service Center'
    if (orgUnit.includes('Business')) return 'Business Development Department'
    if (orgUnit.includes('Billing')) return 'Finance & Accounting Department'
    if (orgUnit.includes('SystemAccounts')) return 'Administration & Human Resources'
    if (orgUnit.includes('Agent')) return 'Customer Service Center'
    return 'Administration & Human Resources' // Default
  }
}

async function updateOrgStructure() {
  try {
    console.log('🌱 Starting organizational structure update...')

    // Read the CSV file
    const csvPath = path.join(__dirname, '../docs/google-workspace-users-list.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    const users = parseCSV(csvContent)
    console.log(`📊 Found ${users.length} active users`)

    const orgUnits = extractOrgUnits(users)
    console.log('📋 Organization units found:', orgUnits)

    // Update departments based on actual org units
    for (const [company, units] of Object.entries(orgUnits)) {
      console.log(`\n🏢 Processing ${company}...`)
      
      for (const orgUnit of units) {
        const departmentName = mapOrgUnitToDepartment(orgUnit, company)
        
        // Check if department already exists
        const existingDept = await prisma.department.findFirst({
          where: {
            name: departmentName,
            company: company
          }
        })

        if (!existingDept) {
          // Create new department
          await prisma.department.create({
            data: {
              name: departmentName,
              description: `Department for ${orgUnit}`,
              company: company,
              isActive: true
            }
          })
          console.log(`✅ Created department: ${departmentName} in ${company}`)
        } else {
          console.log(`⏭️  Department already exists: ${departmentName} in ${company}`)
        }
      }
    }

    console.log('\n🎉 Organizational structure update completed!')

  } catch (error) {
    console.error('❌ Update failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateOrgStructure()
