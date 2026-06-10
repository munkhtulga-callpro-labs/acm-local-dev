import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEmployeePositions() {
  try {
    console.log('Fixing employee positions...');

    // Get all employees with their current positions
    const employees = await prisma.employee.findMany({
      include: {
        user: true,
        position: true
      }
    });

    console.log(`Found ${employees.length} employees`);

    for (const employee of employees) {
      console.log(`\nProcessing employee: ${employee.user.firstName} ${employee.user.lastName}`);
      console.log(`Current position: ${employee.position?.name || 'None'}`);
      console.log(`Department: ${employee.department}`);

      // Get department info
      const department = await prisma.department.findFirst({
        where: { name: employee.department }
      });

      if (!department) {
        console.log(`❌ Department not found: ${employee.department}`);
        continue;
      }

      // Find matching position in the same department
      const matchingPosition = await prisma.position.findFirst({
        where: {
          departmentId: department.id,
          name: {
            contains: department.name,
            mode: 'insensitive'
          }
        }
      });

      if (matchingPosition) {
        console.log(`Found matching position: ${matchingPosition.name}`);
        
        // Update employee position
        await prisma.employee.update({
          where: { id: employee.id },
          data: { positionId: matchingPosition.id }
        });
        
        console.log(`✅ Updated position for ${employee.user.firstName} ${employee.user.lastName}`);
      } else {
        console.log(`❌ No matching position found for ${employee.user.firstName} ${employee.user.lastName}`);
      }
    }

    console.log('\n✅ Position fixing completed!');
  } catch (error) {
    console.error('Error fixing positions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmployeePositions();
