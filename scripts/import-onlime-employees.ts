import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import csv from 'csv-parser'

const prisma = new PrismaClient()

interface GoogleWorkspaceUser {
  'First Name [Required]': string
  'Last Name [Required]': string
  'Email Address [Required]': string
  'Org Unit Path [Required]': string
  'Status [READ ONLY]': string
  'Department': string
  'Employee Title': string
  'Manager Email': string
}

async function importOnlimeEmployees() {
  try {
    console.log('🌱 Starting Onlime employees import...')
    
    const users: GoogleWorkspaceUser[] = []
    
    // Read the CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream('docs/google-workspace-users-list.csv')
        .pipe(csv())
        .on('data', (row) => {
          // Only import users from Onlime MN org units
          if (row['Org Unit Path [Required]'] && row['Org Unit Path [Required]'].includes('/Onlime MN/')) {
            users.push(row)
          }
        })
        .on('end', resolve)
        .on('error', reject)
    })
    
    console.log(`Found ${users.length} Onlime employees to import`)
    
    // Get the Onlime Network LLC company
    const onlimeCompany = await prisma.company.findFirst({
      where: { name: 'Onlime Network LLC' }
    })
    
    if (!onlimeCompany) {
      console.error('❌ Onlime Network LLC company not found')
      return
    }
    
    let imported = 0
    let skipped = 0
    
    for (const user of users) {
      try {
        // Check if employee already exists
        const existingEmployee = await prisma.employee.findFirst({
          where: { email: user['Email Address [Required]'] }
        })
        
        if (existingEmployee) {
          console.log(`⏭️  Skipping ${user['Email Address [Required]']} - already exists`)
          skipped++
          continue
        }
        
        // Extract department from org unit path
        const orgUnitPath = user['Org Unit Path [Required]']
        const departmentMatch = orgUnitPath.match(/\/Onlime MN\/(.+)$/)
        const department = departmentMatch ? departmentMatch[1] : 'General'
        
        // Generate employee ID
        const employeeId = `EMP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        
        // Check if user already exists
        let existingUser = await prisma.user.findUnique({
          where: { email: user['Email Address [Required]'] }
        })
        
        // If user doesn't exist, create one
        if (!existingUser) {
          existingUser = await prisma.user.create({
            data: {
              name: `${user['First Name [Required]']} ${user['Last Name [Required]']}`,
              email: user['Email Address [Required]'],
              role: 'EMPLOYEE',
              company: 'Onlime Network LLC',
              isActive: user['Status [READ ONLY]'] === 'Active',
            }
          })
        } else {
          // Update existing user to Onlime company
          existingUser = await prisma.user.update({
            where: { email: user['Email Address [Required]'] },
            data: {
              company: 'Onlime Network LLC',
              isActive: user['Status [READ ONLY]'] === 'Active',
            }
          })
        }
        
        // Create employee
        await prisma.employee.create({
          data: {
            employeeId,
            firstName: user['First Name [Required]'],
            lastName: user['Last Name [Required]'],
            email: user['Email Address [Required]'],
            department: department,
            position: user['Employee Title'] || 'Employee',
            manager: user['Manager Email'] || null,
            company: 'Onlime Network LLC',
            companyId: onlimeCompany.id,
            isActive: user['Status [READ ONLY]'] === 'Active',
            startDate: new Date(),
            userId: existingUser.id,
          }
        })
        
        console.log(`✅ Imported ${user['First Name [Required]']} ${user['Last Name [Required]']} (${user['Email Address [Required]']})`)
        imported++
        
      } catch (error) {
        console.error(`❌ Error importing ${user['Email Address [Required]']}:`, error)
      }
    }
    
    console.log(`\n🎉 Import completed!`)
    console.log(`✅ Imported: ${imported}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importOnlimeEmployees()
