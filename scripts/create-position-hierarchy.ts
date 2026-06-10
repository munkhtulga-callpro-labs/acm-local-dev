import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createPositionHierarchy() {
  console.log('🔄 Creating position hierarchy for all departments...')

  try {
    // Get all departments
    const departments = await prisma.department.findMany()
    console.log(`Found ${departments.length} departments`)

    // Define position templates with hierarchy
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
    let updated = 0

    for (const department of departments) {
      for (const template of positionTemplates) {
        const positionName = `${department.name} ${template.suffix}`
        
        try {
          const position = await prisma.position.upsert({
            where: {
              name_departmentId: {
                name: positionName,
                departmentId: department.id,
              }
            },
            update: {
              level: template.level,
              accessLevel: template.accessLevel,
              isActive: true,
            },
            create: {
              name: positionName,
              level: template.level,
              accessLevel: template.accessLevel,
              departmentId: department.id,
              isActive: true,
            }
          })
          
          if (position) {
            created++
          }
        } catch (error: any) {
          if (error.code === 'P2002') {
            updated++
          } else {
            console.error(`Error creating position ${positionName}:`, error.message)
          }
        }
      }
      console.log(`✅ Created positions for ${department.name} (${department.company})`)
    }

    console.log(`🎉 Position hierarchy created!`)
    console.log(`✅ Created/Updated: ${created} positions`)

  } catch (error) {
    console.error('❌ Error creating position hierarchy:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPositionHierarchy()
