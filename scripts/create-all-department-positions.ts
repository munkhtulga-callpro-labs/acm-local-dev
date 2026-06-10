import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createPositionsForAllDepartments() {
  try {
    console.log('Creating positions for all departments...');

    // Get all departments
    const departments = await prisma.department.findMany({
      where: { isActive: true }
    });

    console.log(`Found ${departments.length} departments`);

    for (const department of departments) {
      console.log(`\nCreating positions for ${department.name}...`);

      // Check if positions already exist for this department
      const existingPositions = await prisma.position.findMany({
        where: { departmentId: department.id }
      });

      if (existingPositions.length > 0) {
        console.log(`  Positions already exist for ${department.name}, skipping...`);
        continue;
      }

      // Create position hierarchy for each department
      const positions = [
        // Intern level
        {
          name: `${department.name} Intern`,
          level: 'Intern',
          accessLevel: 'Write',
          departmentId: department.id,
          isActive: true
        },
        // Junior level
        {
          name: `${department.name} Assistant`,
          level: 'Junior',
          accessLevel: 'Write',
          departmentId: department.id,
          isActive: true
        },
        // Mid-level
        {
          name: `${department.name} Specialist`,
          level: 'Mid-Level',
          accessLevel: 'Read',
          departmentId: department.id,
          isActive: true
        },
        {
          name: `${department.name} Manager`,
          level: 'Mid-Level',
          accessLevel: 'Full',
          departmentId: department.id,
          isActive: true
        },
        // Senior level
        {
          name: `${department.name} Senior Specialist`,
          level: 'Senior',
          accessLevel: 'Full',
          departmentId: department.id,
          isActive: true
        },
        {
          name: `${department.name} Senior Manager`,
          level: 'Senior',
          accessLevel: 'Full',
          departmentId: department.id,
          isActive: true
        },
        // Executive level
        {
          name: `${department.name} Director`,
          level: 'Executive',
          accessLevel: 'Admin',
          departmentId: department.id,
          isActive: true
        }
      ];

      // Create positions
      for (const position of positions) {
        await prisma.position.create({
          data: position
        });
        console.log(`  Created: ${position.name}`);
      }

      console.log(`  ✅ Created ${positions.length} positions for ${department.name}`);
    }

    console.log('\n✅ Position creation completed!');
  } catch (error) {
    console.error('Error creating positions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPositionsForAllDepartments();
