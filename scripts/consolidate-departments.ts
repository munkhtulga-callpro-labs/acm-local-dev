import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function consolidateDepartments() {
  console.log('🔄 Consolidating departments and setting up position hierarchy...')

  try {
    // Define consolidated departments (language-neutral, professional names)
    const consolidatedDepartments = [
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
    ]

    // Define position hierarchy levels
    const positionLevels = {
      'Director': 'Executive',
      'Senior': 'Senior',
      'Regular': 'Mid-Level',
      'Junior': 'Junior',
      'Intern': 'Intern',
      'Trainee': 'Trainee',
    }

    // Get both companies
    const callproCompany = await prisma.company.findUnique({ where: { name: 'CallPro LLC' } })
    const onlimeCompany = await prisma.company.findUnique({ where: { name: 'Onlime Network LLC' } })

    if (!callproCompany || !onlimeCompany) {
      console.error('Companies not found')
      return
    }

    // Create consolidated departments for each company
    for (const company of [callproCompany, onlimeCompany]) {
      for (const dept of consolidatedDepartments) {
        await prisma.department.upsert({
          where: {
            name_company: {
              name: dept.name,
              company: company.name,
            }
          },
          update: {
            description: dept.description,
            isActive: true,
          },
          create: {
            name: dept.name,
            description: dept.description,
            company: company.name,
            companyId: company.id,
            isActive: true,
          }
        })
        console.log(`✅ Created/Updated ${dept.name} for ${company.name}`)
      }
    }

    // Delete old duplicate departments
    const departmentsToDelete = [
      'Administration & Human Resources',
      'Business Development Department',
      'Customer Care Department',
      'Customer Service Center',
      'Development Department',
      'Finance & Accounting Department',
      'Marketing Unit',
      'Sales Department',
      'Technical Operations Department',
      'Technical Planning Department',
    ]

    for (const deptName of departmentsToDelete) {
      const deleted = await prisma.department.deleteMany({
        where: { name: deptName }
      })
      if (deleted.count > 0) {
        console.log(`🗑️  Deleted duplicate: ${deptName}`)
      }
    }

    console.log('🎉 Department consolidation completed!')
  } catch (error) {
    console.error('❌ Error consolidating departments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

consolidateDepartments()
