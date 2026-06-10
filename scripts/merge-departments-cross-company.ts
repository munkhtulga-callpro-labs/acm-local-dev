import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function mergeDepartmentsCrossCompany() {
  console.log('🔄 Merging departments to be company-agnostic...')

  try {
    // Define single set of departments (not per company)
    const sharedDepartments = [
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

    // Delete ALL existing departments
    const deleted = await prisma.department.deleteMany({})
    console.log(`🗑️  Deleted ${deleted.count} existing departments`)

    // Create single set of departments (no company field duplication)
    for (const dept of sharedDepartments) {
      await prisma.department.create({
        data: {
          name: dept.name,
          description: dept.description,
          company: 'All', // Shared across all companies
          isActive: true,
        }
      })
      console.log(`✅ Created shared department: ${dept.name}`)
    }

    console.log('🎉 Departments merged into single shared structure!')
  } catch (error) {
    console.error('❌ Error merging departments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

mergeDepartmentsCrossCompany()
