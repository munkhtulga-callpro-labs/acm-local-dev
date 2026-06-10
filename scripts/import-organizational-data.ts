import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Based on CSV analysis - English translations of Mongolian organizational structure
const companies = [
  {
    name: 'Onlime Network LLC',
    description: 'Telecommunications and network services company',
    address: 'Ulaanbaatar, Mongolia',
    phone: '+976-11-123456',
    email: 'info@onlime.mn',
    website: 'https://onlime.mn',
    isActive: true
  },
  {
    name: 'CallPro LLC', 
    description: 'Call center and customer service company',
    address: 'Ulaanbaatar, Mongolia',
    phone: '+976-11-654321',
    email: 'info@callpro.mn',
    website: 'https://callpro.mn',
    isActive: true
  }
]

const departments = [
  // Onlime Network LLC Departments
  {
    name: 'Business Development Department',
    description: 'Business growth and development initiatives',
    company: 'Onlime Network LLC',
    isActive: true
  },
  {
    name: 'Sales Department',
    description: 'Sales operations and customer acquisition',
    company: 'Onlime Network LLC', 
    isActive: true
  },
  {
    name: 'Administration & Human Resources',
    description: 'Administrative functions and HR management',
    company: 'Onlime Network LLC',
    isActive: true
  },
  {
    name: 'Marketing Unit',
    description: 'Marketing and promotional activities',
    company: 'Onlime Network LLC',
    isActive: true
  },
  {
    name: 'Finance & Accounting Department',
    description: 'Financial management and accounting',
    company: 'Onlime Network LLC',
    isActive: true
  },
  {
    name: 'Technical Operations Department',
    description: 'Technical support and operations',
    company: 'Onlime Network LLC',
    isActive: true
  },
  {
    name: 'Technical Planning Department',
    description: 'Technical planning and infrastructure',
    company: 'Onlime Network LLC',
    isActive: true
  },
  {
    name: 'Customer Service Center',
    description: 'Customer support and service',
    company: 'Onlime Network LLC',
    isActive: true
  },
  {
    name: 'Development Department',
    description: 'Software and system development',
    company: 'Onlime Network LLC',
    isActive: true
  },
  {
    name: 'Customer Care Department',
    description: 'Customer relationship management',
    company: 'Onlime Network LLC',
    isActive: true
  }
]

const systems = [
  // Communication Systems
  {
    name: 'CallPro Teams',
    description: 'Internal communication platform',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'GCIC',
    description: 'Customer information system',
    category: 'CUSTOMER_SERVICE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Knox',
    description: 'Security management system',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'My CallPro',
    description: 'Customer portal system',
    category: 'CUSTOMER_SERVICE',
    hasApi: true,
    isActive: true
  },
  
  // Social Media & Marketing
  {
    name: 'Facebook',
    description: 'Social media marketing platform',
    category: 'MARKETING',
    hasApi: true,
    isActive: true
  },
  {
    name: 'YouTube',
    description: 'Video content platform',
    category: 'MARKETING',
    hasApi: true,
    isActive: true
  },
  
  // E-commerce Platforms
  {
    name: 'Samsung.ru',
    description: 'Samsung products portal',
    category: 'MARKETING',
    hasApi: false,
    isActive: true
  },
  {
    name: 'Samsung.com',
    description: 'Samsung global portal',
    category: 'MARKETING',
    hasApi: false,
    isActive: true
  },
  {
    name: 'LG.ru',
    description: 'LG products portal',
    category: 'MARKETING',
    hasApi: false,
    isActive: true
  },
  {
    name: 'LG.com',
    description: 'LG global portal',
    category: 'MARKETING',
    hasApi: false,
    isActive: true
  },
  
  // Local E-commerce
  {
    name: 'Next.mn',
    description: 'Local e-commerce platform',
    category: 'MARKETING',
    hasApi: false,
    isActive: true
  },
  {
    name: 'PC-mall.mn',
    description: 'Computer hardware store',
    category: 'MARKETING',
    hasApi: false,
    isActive: true
  },
  {
    name: 'ENomin.mn',
    description: 'Local business directory',
    category: 'MARKETING',
    hasApi: false,
    isActive: true
  },
  {
    name: 'ESain.mn',
    description: 'Local business platform',
    category: 'MARKETING',
    hasApi: false,
    isActive: true
  },
  {
    name: 'Technozone.mn',
    description: 'Technology marketplace',
    category: 'MARKETING',
    hasApi: false,
    isActive: true
  },
  
  // Communication Tools
  {
    name: 'Viber',
    description: 'Messaging platform',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'WhatsApp',
    description: 'Messaging platform',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'CallPro Voice',
    description: 'Voice communication system',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'AnyDesk',
    description: 'Remote desktop access',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  
  // Financial Systems
  {
    name: 'Smart',
    description: 'Financial management system',
    category: 'FINANCE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Zoho',
    description: 'Business management suite',
    category: 'PRODUCTIVITY',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Tax, Finance, Social Insurance Sites',
    description: 'Government financial portals',
    category: 'FINANCE',
    hasApi: false,
    isActive: true
  },
  {
    name: 'Tax, Invoice Sites',
    description: 'Tax and invoice management',
    category: 'FINANCE',
    hasApi: false,
    isActive: true
  },
  {
    name: 'QuickBooks',
    description: 'Accounting software',
    category: 'FINANCE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Mercury',
    description: 'Payment processing',
    category: 'FINANCE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'PayPal',
    description: 'Online payment system',
    category: 'FINANCE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'CRC',
    description: 'Credit reporting system',
    category: 'FINANCE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'ESign Client',
    description: 'Digital signature system',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Monpay',
    description: 'Mobile payment system',
    category: 'FINANCE',
    hasApi: true,
    isActive: true
  },
  
  // Technical Systems
  {
    name: 'Bitwarden',
    description: 'Password management system',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Suhe',
    description: 'Internal management system',
    category: 'PRODUCTIVITY',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Banks',
    description: 'Banking systems access',
    category: 'FINANCE',
    hasApi: false,
    isActive: true
  },
  {
    name: 'HubSpot',
    description: 'CRM and marketing automation',
    category: 'CUSTOMER_SERVICE',
    hasApi: true,
    isActive: true
  },
  
  // Project Management
  {
    name: 'Monday',
    description: 'Project management platform',
    category: 'PRODUCTIVITY',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Google Gmail',
    description: 'Email service',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  
  // Technical Infrastructure
  {
    name: 'WinSCP/Jump Web',
    description: 'File transfer and server access',
    category: 'INFRASTRUCTURE',
    hasApi: false,
    isActive: true
  },
  {
    name: 'Ultra Viewer',
    description: 'Remote desktop software',
    category: 'INFRASTRUCTURE',
    hasApi: false,
    isActive: true
  },
  {
    name: 'CallPro',
    description: 'Main call center system',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Audacity',
    description: 'Audio editing software',
    category: 'PRODUCTIVITY',
    hasApi: false,
    isActive: true
  },
  {
    name: 'MicroSIP',
    description: 'SIP client software',
    category: 'COMMUNICATION',
    hasApi: false,
    isActive: true
  },
  {
    name: 'IVMS/Camera',
    description: 'Video surveillance system',
    category: 'INFRASTRUCTURE',
    hasApi: false,
    isActive: true
  },
  {
    name: 'MS Office',
    description: 'Microsoft Office suite',
    category: 'PRODUCTIVITY',
    hasApi: false,
    isActive: true
  },
  {
    name: 'Zoom',
    description: 'Video conferencing platform',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Adobe Reader/Flash Player',
    description: 'Document and media viewers',
    category: 'PRODUCTIVITY',
    hasApi: false,
    isActive: true
  },
  {
    name: 'Skype',
    description: 'Communication platform',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'WeChat',
    description: 'Messaging platform',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  
  // Web Systems
  {
    name: 'help.callpro.mn',
    description: 'Help desk system',
    category: 'CUSTOMER_SERVICE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'WEB (my1,2,3,5,6,7.callpro.mn)',
    description: 'Web portal system',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Zabbix',
    description: 'Network monitoring system',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'SeCeon',
    description: 'Security monitoring system',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Asterisk Servers',
    description: 'Telephony server system',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Database',
    description: 'Database management system',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'text.callpro.mn',
    description: 'Text messaging system',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'teams.callpro.mn',
    description: 'Team collaboration platform',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'suhe.callpro.mn',
    description: 'Internal management portal',
    category: 'PRODUCTIVITY',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Google Drive',
    description: 'Cloud storage service',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Switch, Router',
    description: 'Network infrastructure',
    category: 'INFRASTRUCTURE',
    hasApi: false,
    isActive: true
  },
  {
    name: 'my.callpro.kg',
    description: 'Kyrgyzstan portal',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'us1.callpro.mn',
    description: 'US portal',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Kamailio',
    description: 'SIP server',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'SBC (Primary, Secondary)',
    description: 'Session Border Controller',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'FreePBX (Main, Backup)',
    description: 'PBX system',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'chart.callpro.mn',
    description: 'Analytics dashboard',
    category: 'PRODUCTIVITY',
    hasApi: true,
    isActive: true
  },
  {
    name: 'telecomsxchange.com',
    description: 'Telecom exchange platform',
    category: 'COMMUNICATION',
    hasApi: true,
    isActive: true
  },
  {
    name: 'admin.timely.mn',
    description: 'Time tracking system',
    category: 'PRODUCTIVITY',
    hasApi: true,
    isActive: true
  },
  {
    name: 'jump01.callpro.mn',
    description: 'Jump server access',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    isActive: true
  },
  {
    name: 'Worki.mn',
    description: 'HR management system',
    category: 'PRODUCTIVITY',
    hasApi: true,
    isActive: true
  }
]

const positions = [
  // Technical Positions
  { name: 'NOC Engineer', department: 'Technical Operations Department', level: 'Engineer' },
  { name: 'Senior Sales Manager', department: 'Sales Department', level: 'Senior' },
  { name: 'Sales Department Director', department: 'Sales Department', level: 'Director' },
  { name: 'Sales Manager', department: 'Sales Department', level: 'Manager' },
  { name: 'Graphic Designer', department: 'Marketing Unit', level: 'Specialist' },
  { name: 'Executive Director', department: 'Administration & Human Resources', level: 'Executive' },
  { name: 'Student Intern', department: 'Technical Operations Department', level: 'Intern' },
  { name: 'HR Director', department: 'Administration & Human Resources', level: 'Director' },
  { name: 'HR Specialist', department: 'Administration & Human Resources', level: 'Specialist' },
  { name: 'Senior Marketing Manager', department: 'Marketing Unit', level: 'Senior' },
  { name: 'Marketing Manager', department: 'Marketing Unit', level: 'Manager' },
  { name: 'Accountant', department: 'Finance & Accounting Department', level: 'Specialist' },
  { name: 'Office Administrator', department: 'Administration & Human Resources', level: 'Administrator' },
  { name: 'Finance & Accounting Director', department: 'Finance & Accounting Department', level: 'Director' },
  { name: 'Training & HR Specialist', department: 'Administration & Human Resources', level: 'Specialist' },
  { name: 'Training Manager', department: 'Administration & Human Resources', level: 'Manager' },
  { name: 'Installation Engineer', department: 'Technical Operations Department', level: 'Engineer' },
  { name: 'Technical Operations Director', department: 'Technical Operations Department', level: 'Director' },
  { name: 'Senior Technical Engineer', department: 'Technical Operations Department', level: 'Senior' },
  { name: 'Technical Engineer (Tier 2)', department: 'Technical Operations Department', level: 'Engineer' },
  { name: 'Technical Engineer (Tier 3)', department: 'Technical Operations Department', level: 'Engineer' },
  { name: 'HR Specialist', department: 'Administration & Human Resources', level: 'Specialist' }
]

async function importData() {
  try {
    console.log('Starting data import...')

    // Create companies
    console.log('Creating companies...')
    for (const companyData of companies) {
      await prisma.company.upsert({
        where: { name: companyData.name },
        update: companyData,
        create: companyData
      })
    }

    // Create departments
    console.log('Creating departments...')
    for (const deptData of departments) {
      const company = await prisma.company.findFirst({
        where: { name: deptData.company }
      })
      
      if (company) {
        await prisma.department.upsert({
          where: { 
            name_company: {
              name: deptData.name,
              company: deptData.company
            }
          },
          update: deptData,
          create: {
            ...deptData,
            companyId: company.id
          }
        })
      }
    }

    // Create systems
    console.log('Creating systems...')
    for (const systemData of systems) {
      await prisma.system.upsert({
        where: { name: systemData.name },
        update: systemData,
        create: systemData
      })
    }

    // Create positions
    console.log('Creating positions...')
    for (const positionData of positions) {
      const department = await prisma.department.findFirst({
        where: { name: positionData.department }
      })
      
      if (department) {
        await prisma.position.upsert({
          where: { 
            name_departmentId: {
              name: positionData.name,
              departmentId: department.id
            }
          },
          update: {
            name: positionData.name,
            level: positionData.level
          },
          create: {
            name: positionData.name,
            level: positionData.level,
            departmentId: department.id
          }
        })
      }
    }

    console.log('Data import completed successfully!')
  } catch (error) {
    console.error('Error importing data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importData()
