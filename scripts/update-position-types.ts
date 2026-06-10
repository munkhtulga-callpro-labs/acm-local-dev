import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updatePositionTypes() {
  console.log('🔄 Updating position types with proper access levels...')

  try {
    // Get all existing positions
    const existingPositions = await prisma.position.findMany()
    console.log(`Found ${existingPositions.length} existing positions`)

    // Define access level mappings based on position names
    const accessLevelMappings = {
      'Full-Time': 'Full',
      'Consultant': 'Read', 
      'Intern': 'Write',
      'Trainee': 'Print',
      'Contractor': 'Full',
      'Admin': 'Admin',
      'Privilege': 'Privilege',
      'No Access': 'None',
      // Map existing positions to access levels
      'Executive Director': 'Admin',
      'Director': 'Admin',
      'Senior': 'Full',
      'Manager': 'Full',
      'Engineer': 'Full',
      'Specialist': 'Read',
      'Student Intern': 'Write',
    }

    // Update existing positions with access levels
    for (const position of existingPositions) {
      const accessLevel = accessLevelMappings[position.name as keyof typeof accessLevelMappings] || 'Read'
      
      await prisma.position.update({
        where: { id: position.id },
        data: { accessLevel }
      })
      
      console.log(`✅ Updated position: ${position.name} -> ${accessLevel}`)
    }

    console.log('🎉 Position types updated successfully!')
  } catch (error) {
    console.error('❌ Error updating position types:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updatePositionTypes()
