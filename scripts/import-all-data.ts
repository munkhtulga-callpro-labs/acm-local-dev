import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import csv from 'csv-parser'

const prisma = new PrismaClient()

interface GoogleWorkspaceUser {
  'First Name [Required]': string
  'Last Name [Required]': string
  'Email Address [Required]': string
  'Org Unit Path [Required]': string
  'Employee Title': string
  'Manager Email': string
  'Department': string
  'Status [READ ONLY]': string
}

// System accounts to exclude
const SYSTEM_ACCOUNT_EMAILS = [
  'local@callpro.mn',
  'entec@callpro.mn',
  'cc_samsung@callpro.mn',
  'google-api@callpro.mn',
  'grafana@callpro.mn',
  'info@callpro.mn',
  'info@onlime.mn',
]

async function importAllData() {
  console.log('🚀 Starting comprehensive data import...')
  console.log('=' .repeat(60))

  try {
    // Step 1: Import/Verify Companies
    await importCompanies()
    
    // Step 2: Import/Verify Departments
    await importDepartments()
    
    // Step 3: Import/Verify Positions
    await importPositions()
    
    // Step 4: Import Employees from Google Workspace
    await importEmployees()
    
    console.log('=' .repeat(60))
    console.log('🎉 All data imported successfully!')
    
    // Show summary
    await showSummary()
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function importCompanies() {
  console.log('\n📊 Step 1: Importing Companies...')
  
  const companies = [
    { name: 'CallPro LLC', description: 'CallPro telecommunications and services' },
    { name: 'Onlime Network LLC', description: 'Onlime network and internet services' },
  ]

  for (const company of companies) {
    await prisma.company.upsert({
      where: { name: company.name },
      update: {},
      create: company
    })
    console.log(`  ✅ ${company.name}`)
  }
}

async function importDepartments() {
  console.log('\n🏢 Step 2: Importing Departments...')
  
  const departments = [
    { name: 'Administration', description: 'Administrative functions and HR management' },
    { name: 'Business Development', description: 'Business growth and development initiatives' },
    { name: 'Customer Service', description: 'Customer support and relationship management' },
    { name: 'Development', description: 'Software and system development' },
    { name: 'DevOps', description: 'DevOps and infrastructure' },
    { name: 'Finance', description: 'Financial management and accounting' },
    { name: 'Marketing', description: 'Marketing and promotional activities' },
    { name: 'Sales', description: 'Sales operations and customer acquisition' },
    { name: 'Technical Operations', description: 'Technical support and operations' },
    { name: 'Technical Planning', description: 'Technical planning and infrastructure' },
    { name: 'Technical Support', description: 'Technical support and maintenance' },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: {
        name_company: {
          name: dept.name,
          company: 'All'
        }
      },
      update: { description: dept.description },
      create: {
        ...dept,
        company: 'All',
        isActive: true,
      }
    })
    console.log(`  ✅ ${dept.name}`)
  }
}

async function importPositions() {
  console.log('\n👔 Step 3: Importing Position Hierarchy...')
  
  const departments = await prisma.department.findMany()
  
  const positionTemplates = [
    { suffix: 'Director', level: 'Executive', accessLevel: 'Admin' },
    { suffix: 'Senior Manager', level: 'Senior', accessLevel: 'Full' },
    { suffix: 'Manager', level: 'Mid-Level', accessLevel: 'Full' },
    { suffix: 'Senior Specialist', level: 'Senior', accessLevel: 'Full' },
    { suffix: 'Specialist', level: 'Mid-Level', accessLevel: 'Read' },
    { suffix: 'Assistant', level: 'Junior', accessLevel: 'Write' },
    { suffix: 'Intern', level: 'Intern', accessLevel: 'Write' },
  ]

  let created = 0

  for (const dept of departments) {
    for (const template of positionTemplates) {
      const positionName = `${dept.name} ${template.suffix}`
      
      await prisma.position.upsert({
        where: {
          name_departmentId: {
            name: positionName,
            departmentId: dept.id
          }
        },
        update: {
          level: template.level,
          accessLevel: template.accessLevel,
        },
        create: {
          name: positionName,
          level: template.level,
          accessLevel: template.accessLevel,
          departmentId: dept.id,
        }
      })
      created++
    }
  }
  
  console.log(`  ✅ Created ${created} positions`)
}

async function importEmployees() {
  console.log('\n👥 Step 4: Importing Employees from Google Workspace...')
  
  const users: GoogleWorkspaceUser[] = []
  
  // Read CSV file
  await new Promise((resolve, reject) => {
    fs.createReadStream('docs/google-workspace-users-list.csv')
      .pipe(csv())
      .on('data', (row) => {
        const email = row['Email Address [Required]']
        const orgUnitPath = row['Org Unit Path [Required]']
        
        // Skip system accounts
        if (SYSTEM_ACCOUNT_EMAILS.includes(email)) {
          return
        }
        
        // Skip SystemAccounts org unit
        if (orgUnitPath && orgUnitPath.includes('/SystemAccounts')) {
          return
        }
        
        // Only import Onlime MN, CallPro MN, and Administration users
        if (orgUnitPath && (
          orgUnitPath.includes('/Onlime MN') ||
          orgUnitPath.includes('/CallPro MN') ||
          orgUnitPath.includes('/Administration')
        )) {
          users.push(row)
        }
      })
      .on('end', resolve)
      .on('error', reject)
  })
  
  console.log(`  📋 Found ${users.length} employees to import`)
  
  let imported = 0
  let skipped = 0
  let errors = 0
  
  for (const user of users) {
    try {
      const email = user['Email Address [Required]']
      
      // Check if employee already exists
      const existing = await prisma.employee.findUnique({
        where: { email }
      })
      
      if (existing) {
        skipped++
        continue
      }
      
      // Determine company and department
      const orgUnit = user['Org Unit Path [Required]']
      const company = orgUnit.includes('/CallPro MN') 
        ? 'CallPro LLC' 
        : 'Onlime Network LLC'
      
      // Map org unit to department
      const departmentMapping: Record<string, string> = {
        'Developers': 'Development',
        'DevOps': 'DevOps',
        'CustomerSuccess': 'Customer Service',
        'Business': 'Business Development',
        'Administration': 'Administration',
        'Customer Service': 'Customer Service',
        'Technical Support': 'Technical Support',
        'Sales': 'Sales',
        'Marketing': 'Marketing',
        'Finance': 'Finance',
        'Billing': 'Finance',
      }
      
      let department = 'Administration' // Default
      for (const [key, value] of Object.entries(departmentMapping)) {
        if (orgUnit.includes(key)) {
          department = value
          break
        }
      }
      
      // Map department to position
      const positionMapping: Record<string, string> = {
        'Development': 'Software Engineer',
        'DevOps': 'DevOps Engineer',
        'Customer Service': 'Customer Success Manager',
        'Business Development': 'Business Analyst',
        'Sales': 'Sales Representative',
        'Marketing': 'Marketing Specialist',
        'Finance': 'Financial Analyst',
        'Administration': 'Administrative Assistant',
        'Technical Support': 'Support Engineer',
        'Technical Operations': 'Technical Engineer',
        'Technical Planning': 'Technical Engineer',
      }
      
      const position = user['Employee Title'] || positionMapping[department] || 'Employee'
      
      // Get or create company
      const companyRecord = await prisma.company.findUnique({
        where: { name: company }
      })
      
      if (!companyRecord) {
        console.warn(`  ⚠️  Company not found: ${company}`)
        continue
      }
      
      // Create or get user
      let userRecord = await prisma.user.findUnique({
        where: { email }
      })
      
      if (!userRecord) {
        userRecord = await prisma.user.create({
          data: {
            name: `${user['First Name [Required]']} ${user['Last Name [Required]']}`,
            email,
            role: 'EMPLOYEE',
            company,
            isActive: user['Status [READ ONLY]'] === 'Active',
          }
        })
      }
      
      // Create employee
      const employeeId = `EMP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      
      await prisma.employee.create({
        data: {
          employeeId,
          firstName: user['First Name [Required]'],
          lastName: user['Last Name [Required]'],
          email,
          department,
          position,
          manager: user['Manager Email'] || null,
          company,
          companyId: companyRecord.id,
          isActive: user['Status [READ ONLY]'] === 'Active',
          employmentStatus: 'FULL_TIME', // Default
          workLocation: 'OFFICE', // Default
          startDate: new Date(),
          userId: userRecord.id,
        }
      })
      
      imported++
      if (imported % 10 === 0) {
        console.log(`  ⏳ Imported ${imported}/${users.length}...`)
      }
      
    } catch (error: any) {
      errors++
      if (error.code === 'P2002') {
        skipped++
      } else {
        console.error(`  ❌ Error importing ${user['Email Address [Required]']}:`, error.message)
      }
    }
  }
  
  console.log(`\n  ✅ Imported: ${imported}`)
  console.log(`  ⏭️  Skipped: ${skipped}`)
  console.log(`  ❌ Errors: ${errors}`)
}

async function showSummary() {
  console.log('\n📈 Database Summary:')
  console.log('=' .repeat(60))
  
  const counts = {
    employees: await prisma.employee.count(),
    departments: await prisma.department.count(),
    companies: await prisma.company.count(),
    positions: await prisma.position.count(),
    users: await prisma.user.count(),
  }
  
  console.log(`  👥 Employees:   ${counts.employees}`)
  console.log(`  🏢 Departments: ${counts.departments}`)
  console.log(`  🏭 Companies:   ${counts.companies}`)
  console.log(`  👔 Positions:   ${counts.positions}`)
  console.log(`  👤 Users:       ${counts.users}`)
  console.log('=' .repeat(60))
  
  // Show department distribution
  console.log('\n📊 Employee Distribution by Department:')
  const departments = await prisma.department.findMany()
  
  for (const dept of departments) {
    const count = await prisma.employee.count({
      where: { department: dept.name }
    })
    if (count > 0) {
      console.log(`  ${dept.name}: ${count}`)
    }
  }
}

// Run the import
importAllData()
