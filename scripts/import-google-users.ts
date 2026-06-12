import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface GoogleUser {
  firstName: string
  lastName: string
  email: string
  orgUnit: string
  status: string
  lastSignIn: string
  workPhone?: string
  mobilePhone?: string
  employeeId?: string
  department?: string
  managerEmail?: string
}

function parseCSV(csvContent: string): GoogleUser[] {
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',')
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
      lastSignIn: values[8]?.trim() || '',
      workPhone: values[13]?.trim() || '',
      mobilePhone: values[14]?.trim() || '',
      employeeId: values[18]?.trim() || '',
      department: values[22]?.trim() || '',
      managerEmail: values[23]?.trim() || ''
    }

    // Only process active users with valid emails
    if (user.email && user.status === 'Active' && user.email.includes('@')) {
      users.push(user)
    }
  }

  return users
}

function mapOrgUnitToCompany(orgUnit: string): string {
  if (orgUnit.includes('CallPro MN')) return 'CallPro LLC'
  if (orgUnit.includes('Onlime MN')) return 'Onlime Network LLC'
  if (orgUnit.includes('CallPro KG')) return 'CallPro LLC'
  if (orgUnit.includes('CallPro SG')) return 'CallPro LLC'
  if (orgUnit.includes('Administration')) return 'CallPro LLC'
  return 'CallPro LLC' // Default
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

async function importGoogleUsers() {
  try {
    console.log('🌱 Starting Google Workspace users import...')

    // Read the CSV file
    const csvPath = path.join(__dirname, '../docs/google-workspace-users-list.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    const users = parseCSV(csvContent)
    console.log(`📊 Found ${users.length} active users to import`)

    let imported = 0
    let skipped = 0

    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        })

        if (existingUser) {
          console.log(`⏭️  Skipping existing user: ${userData.email}`)
          skipped++
          continue
        }

        // Find company
        const companyName = mapOrgUnitToCompany(userData.orgUnit)
        const company = await prisma.company.findFirst({
          where: { name: companyName }
        })

        if (!company) {
          console.log(`❌ Company not found: ${companyName}`)
          skipped++
          continue
        }

        // Find department
        const departmentName = mapOrgUnitToDepartment(userData.orgUnit, companyName)
        const department = await prisma.department.findFirst({
          where: { 
            name: departmentName,
            company: companyName
          }
        })

        if (!department) {
          console.log(`❌ Department not found: ${departmentName} in ${companyName}`)
          skipped++
          continue
        }

        // Create user
        const tempPassword = process.env.SEED_DEFAULT_PASSWORD ?? 'changeme'
        const hashedPassword = await bcrypt.hash(tempPassword, 12)
        const user = await prisma.user.create({
          data: {
            name: `${userData.firstName} ${userData.lastName}`.trim(),
            email: userData.email,
            password: hashedPassword,
            role: 'EMPLOYEE',
            company: companyName
          }
        })

        // Create employee record
        const employee = await prisma.employee.create({
          data: {
            employeeId: userData.employeeId || `EMP${Date.now()}${Math.random().toString(36).substr(2, 4)}`,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.workPhone || userData.mobilePhone,
            department: departmentName,
            position: 'Employee', // Default position
            company: companyName,
            manager: userData.managerEmail,
            isActive: true,
            startDate: new Date(),
            user: {
              connect: { id: user.id }
            }
          }
        })

        console.log(`✅ Imported: ${userData.firstName} ${userData.lastName} (${userData.email})`)
        imported++

      } catch (error) {
        console.error(`❌ Error importing ${userData.email}:`, error)
        skipped++
      }
    }

    console.log(`\n🎉 Import completed!`)
    console.log(`✅ Imported: ${imported} users`)
    console.log(`⏭️  Skipped: ${skipped} users`)

  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importGoogleUsers()
