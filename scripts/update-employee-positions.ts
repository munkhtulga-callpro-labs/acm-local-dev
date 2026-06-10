import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateEmployeePositions() {
  console.log('🔄 Updating employee positions based on departments...')

  try {
    // Define position mappings based on department
    const departmentPositionMap = {
      'Developers': 'Software Engineer',
      'DevOps': 'DevOps Engineer', 
      'CustomerSuccess': 'Customer Success Manager',
      'Business': 'Business Analyst',
      'Sales': 'Sales Representative',
      'Marketing': 'Marketing Specialist',
      'HR': 'HR Specialist',
      'Finance': 'Financial Analyst',
      'Administration': 'Administrative Assistant',
      'Technical': 'Technical Engineer',
      'Support': 'Support Engineer',
      'Management': 'Manager',
      'Executive': 'Executive Director',
    }

    // Get all employees
    const employees = await prisma.employee.findMany({
      where: {
        position: 'Employee' // Only update those with default "Employee" position
      }
    })

    console.log(`Found ${employees.length} employees with "Employee" position`)

    // Update positions based on department
    for (const employee of employees) {
      const newPosition = departmentPositionMap[employee.department as keyof typeof departmentPositionMap] || 'Employee'
      
      await prisma.employee.update({
        where: { id: employee.id },
        data: { position: newPosition }
      })
      
      console.log(`✅ Updated ${employee.firstName} ${employee.lastName}: ${employee.department} -> ${newPosition}`)
    }

    console.log('🎉 Employee positions updated successfully!')
  } catch (error) {
    console.error('❌ Error updating employee positions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateEmployeePositions()
