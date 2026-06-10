import { PrismaClient, SystemCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  const hashedPassword = await bcrypt.hash(process.env.SEED_DEFAULT_PASSWORD ?? 'changeme', 12)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@callpro.mn' },
    update: { password: hashedPassword },
    create: {
      name: 'System Administrator',
      email: 'admin@callpro.mn',
      password: hashedPassword,
      role: 'ADMIN',
      company: 'CallPro LLC',
    },
  })

  // Create HR manager
  const hrManager = await prisma.user.upsert({
    where: { email: 'hr@callpro.mn' },
    update: { password: hashedPassword },
    create: {
      name: 'HR Manager',
      email: 'hr@callpro.mn',
      password: hashedPassword,
      role: 'HR_MANAGER',
      company: 'CallPro LLC',
    },
  })

  // Create IT staff
  const itStaff = await prisma.user.upsert({
    where: { email: 'it@callpro.mn' },
    update: { password: hashedPassword },
    create: {
      name: 'IT Staff',
      email: 'it@callpro.mn',
      password: hashedPassword,
      role: 'IT_STAFF',
      company: 'CallPro LLC',
    },
  })

  // Create departments
  const departments = [
    { name: 'Customer Service', description: 'Customer support and service' },
    { name: 'Sales', description: 'Sales and business development' },
    { name: 'Finance', description: 'Finance and accounting' },
    { name: 'Technical Support', description: 'Technical support and maintenance' },
    { name: 'Administration', description: 'HR and administration' },
    { name: 'Business Development', description: 'Business development and growth' },
    { name: 'Development', description: 'Software development' },
    { name: 'Marketing', description: 'Marketing and communications' },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { 
        name_company: {
          name: dept.name,
          company: 'CallPro LLC'
        }
      },
      update: {},
      create: {
        ...dept,
        company: 'CallPro LLC'
      },
    })
  }

  // Create systems
  const systems = [
    {
      name: 'Google Workspace',
      description: 'Google Workspace for email, calendar, and collaboration',
      category: SystemCategory.COMMUNICATION,
      hasApi: true,
      apiEndpoint: 'https://admin.googleapis.com',
      requiresManual: false,
    },
    {
      name: 'Monday.com',
      description: 'Project management and collaboration platform',
      category: SystemCategory.PRODUCTIVITY,
      hasApi: true,
      apiEndpoint: 'https://api.monday.com/v2',
      requiresManual: false,
    },
    {
      name: 'CallPro Teams',
      description: 'Internal communication platform',
      category: SystemCategory.COMMUNICATION,
      hasApi: true,
      apiEndpoint: 'https://teams.callpro.mn/api',
      requiresManual: false,
    },
    {
      name: 'HubSpot',
      description: 'CRM and marketing automation',
      category: SystemCategory.MARKETING,
      hasApi: true,
      apiEndpoint: 'https://api.hubapi.com',
      requiresManual: false,
    },
    {
      name: 'Bitwarden',
      description: 'Password management system',
      category: SystemCategory.INFRASTRUCTURE,
      hasApi: false,
      requiresManual: true,
    },
    {
      name: 'SupportPal',
      description: 'Customer support ticketing system',
      category: SystemCategory.CUSTOMER_SERVICE,
      hasApi: false,
      requiresManual: true,
    },
    {
      name: 'LIME Backend',
      description: 'Internal backend system',
      category: SystemCategory.DEVELOPMENT,
      hasApi: false,
      requiresManual: true,
    },
    {
      name: 'Timely Admin',
      description: 'Time tracking and attendance system',
      category: SystemCategory.PRODUCTIVITY,
      hasApi: false,
      requiresManual: true,
    },
  ]

  for (const system of systems) {
    await prisma.system.upsert({
      where: { name: system.name },
      update: {},
      create: system,
    })
  }

  // Create sample employees
  const sampleEmployees = [
    {
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      phone: '+976-12345678',
      department: 'Customer Service',
      position: 'Customer Support Representative',
      manager: 'manager@company.com',
      company: 'CallPro LLC',
      startDate: new Date('2023-01-15'),
    },
    {
      employeeId: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@company.com',
      phone: '+976-12345679',
      department: 'Sales',
      position: 'Sales Manager',
      manager: 'sales.director@company.com',
      company: 'CallPro LLC',
      startDate: new Date('2023-02-01'),
    },
    {
      employeeId: 'EMP003',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@company.com',
      phone: '+976-12345680',
      department: 'Technical Support',
      position: 'Senior Technical Support',
      manager: 'tech.lead@company.com',
      company: 'CallPro LLC',
      startDate: new Date('2023-03-10'),
    },
  ]

  for (const empData of sampleEmployees) {
    // Create user for employee
    const user = await prisma.user.upsert({
      where: { email: empData.email },
      update: { password: hashedPassword },
      create: {
        name: `${empData.firstName} ${empData.lastName}`,
        email: empData.email,
        password: hashedPassword,
        role: 'EMPLOYEE',
        company: empData.company,
      },
    })

    // Create employee record
    const employee = await prisma.employee.upsert({
      where: { email: empData.email },
      update: {},
      create: {
        ...empData,
        userId: user.id,
      },
    })

    // Create some sample access permissions
    const googleSystem = await prisma.system.findUnique({
      where: { name: 'Google Workspace' },
    })
    const mondaySystem = await prisma.system.findUnique({
      where: { name: 'Monday.com' },
    })
    const callproSystem = await prisma.system.findUnique({
      where: { name: 'CallPro Teams' },
    })

    if (googleSystem) {
      await prisma.accessPermission.upsert({
        where: { employeeId_systemId: { employeeId: employee.id, systemId: googleSystem.id } },
        update: {},
        create: { employeeId: employee.id, systemId: googleSystem.id, accessLevel: 'User', grantedBy: admin.id },
      })
    }

    if (mondaySystem) {
      await prisma.accessPermission.upsert({
        where: { employeeId_systemId: { employeeId: employee.id, systemId: mondaySystem.id } },
        update: {},
        create: { employeeId: employee.id, systemId: mondaySystem.id, accessLevel: 'Member', grantedBy: admin.id },
      })
    }

    if (callproSystem) {
      await prisma.accessPermission.upsert({
        where: { employeeId_systemId: { employeeId: employee.id, systemId: callproSystem.id } },
        update: {},
        create: { employeeId: employee.id, systemId: callproSystem.id, accessLevel: 'User', grantedBy: admin.id },
      })
    }
  }

  // Create email templates
  const emailTemplates = [
    {
      name: 'access_granted',
      subject: 'Your access to {{systemName}} has been approved',
      body: `
        <h2>Access Granted</h2>
        <p>Hi {{employeeName}},</p>
        <p>Your access request has been approved!</p>
        <p><strong>Access Details:</strong></p>
        <ul>{{systems}}</ul>
        <p>You can now access these systems with your credentials.</p>
        <p>If you have any questions, please contact IT Support.</p>
        <p>Best regards,<br>{{company}} IT Team</p>
      `,
      variables: ['employeeName', 'systems', 'company'],
    },
    {
      name: 'approval_required',
      subject: 'Approval required for {{employeeName}} access request',
      body: `
        <h2>Approval Required</h2>
        <p>Hi,</p>
        <p>You have a pending approval for {{employeeName}}'s access request:</p>
        <p><strong>Request:</strong> {{requestTitle}}</p>
        <p><strong>Systems:</strong></p>
        <ul>{{systems}}</ul>
        <p>Please review and approve/reject this request in the system.</p>
        <p>Request ID: {{requestId}}</p>
      `,
      variables: ['employeeName', 'requestTitle', 'systems', 'requestId'],
    },
    {
      name: 'expiry_reminder',
      subject: 'Your access to {{systemName}} expires in {{daysUntilExpiry}} days',
      body: `
        <h2>Access Expiry Reminder</h2>
        <p>Hi {{employeeName}},</p>
        <p>Your access to <strong>{{systemName}}</strong> will expire in {{daysUntilExpiry}} days.</p>
        <p>If you still need this access, please request an extension through the system.</p>
        <p>Your access will be automatically revoked after expiry.</p>
        <p>Best regards,<br>{{company}} IT Team</p>
      `,
      variables: ['employeeName', 'systemName', 'daysUntilExpiry', 'company'],
    },
  ]

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    })
  }

  console.log('✅ Database seed completed!')
  console.log('👤 Admin user: admin@callpro.mn / <password>')
  console.log('👤 HR Manager: hr@callpro.mn / <password>')
  console.log('👤 IT Staff: it@callpro.mn / <password>')
  console.log('👤 Sample employees: employee123@callpro.mn / <password>')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
