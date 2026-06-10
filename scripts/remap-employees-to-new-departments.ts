import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function remapEmployeesToNewDepartments() {
  console.log('🔄 Remapping employees to new consolidated departments...')

  try {
    // Define mapping from old department names to new ones
    const departmentMapping: Record<string, string> = {
      // Old names -> New names
      'CustomerSuccess': 'Customer Service',
      'Developers': 'Development',
      'Business': 'Business Development',
      'DevOps': 'DevOps',
      'Finance': 'Finance',
      'Billing': 'Finance',
      'SystemAccounts': 'Administration',
      'Administration': 'Administration',
      'Customer Service': 'Customer Service',
      'Technical Support': 'Technical Support',
      'Sales': 'Sales',
      'Marketing': 'Marketing',
      'Development': 'Development',
      'Technical Operations': 'Technical Operations',
      'Technical Planning': 'Technical Planning',
    }

    // Get all employees
    const employees = await prisma.employee.findMany()
    console.log(`Found ${employees.length} employees to remap`)

    let updated = 0
    let skipped = 0

    for (const employee of employees) {
      const newDepartment = departmentMapping[employee.department]
      
      if (newDepartment && newDepartment !== employee.department) {
        await prisma.employee.update({
          where: { id: employee.id },
          data: { department: newDepartment }
        })
        console.log(`✅ Updated ${employee.firstName} ${employee.lastName}: "${employee.department}" -> "${newDepartment}"`)
        updated++
      } else if (newDepartment === employee.department) {
        skipped++
      } else {
        console.warn(`⚠️  No mapping found for department: ${employee.department}`)
        // Default to Administration if no mapping found
        await prisma.employee.update({
          where: { id: employee.id },
          data: { department: 'Administration' }
        })
        console.log(`✅ Updated ${employee.firstName} ${employee.lastName}: "${employee.department}" -> "Administration" (default)`)
        updated++
      }
    }

    console.log('🎉 Employee remapping completed!')
    console.log(`✅ Updated: ${updated}`)
    console.log(`⏭️  Skipped (already correct): ${skipped}`)

  } catch (error) {
    console.error('❌ Error remapping employees:', error)
  } finally {
    await prisma.$disconnect()
  }
}

remapEmployeesToNewDepartments()
