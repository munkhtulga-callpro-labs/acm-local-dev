import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeSystemAccounts() {
  console.log('🔄 Removing system accounts...')

  // System accounts to remove
  const systemAccountEmails = [
    'local@callpro.mn',
    'entec@callpro.mn',
    'cc_samsung@callpro.mn',
    'google-api@callpro.mn',
    'grafana@callpro.mn',
    'info@callpro.mn',
    'info@onlime.mn',
  ]

  try {
    for (const email of systemAccountEmails) {
      // Find and delete employee
      const employee = await prisma.employee.findUnique({
        where: { email },
        include: { user: true }
      })

      if (employee) {
        // Delete employee (this will cascade delete the user)
        await prisma.employee.delete({
          where: { id: employee.id }
        })
        console.log(`✅ Removed system account: ${email}`)
      } else {
        console.log(`⏭️  System account not found: ${email}`)
      }
    }

    console.log('🎉 System accounts removed successfully!')
  } catch (error) {
    console.error('❌ Error removing system accounts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeSystemAccounts()
