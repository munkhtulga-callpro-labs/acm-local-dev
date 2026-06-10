import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPositionMismatch() {
  try {
    console.log('Fixing position mismatch...');

    // Update employees with "Customer Success Manager" to "Customer Service Manager"
    const result = await prisma.employee.updateMany({
      where: {
        position: 'Customer Success Manager'
      },
      data: {
        position: 'Customer Service Manager'
      }
    });

    console.log(`Updated ${result.count} employees from "Customer Success Manager" to "Customer Service Manager"`);

    // Check if there are any other mismatches
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        position: true,
        department: true
      }
    });

    console.log('\nCurrent employee positions:');
    employees.forEach(emp => {
      console.log(`- ${emp.position} (${emp.department})`);
    });

    console.log('\n✅ Position mismatch fixing completed!');
  } catch (error) {
    console.error('Error fixing position mismatch:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPositionMismatch();
