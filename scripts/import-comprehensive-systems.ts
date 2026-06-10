import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Comprehensive systems list with categorization and department relationships
const systemsData = [
  // Communication & Collaboration
  {
    name: 'CallPro Teams',
    description: 'Internal communication and collaboration platform',
    category: 'COMMUNICATION',
    hasApi: true,
    apiEndpoint: 'https://api.callpro.mn',
    requiresManual: false,
    departments: ['Development', 'Customer Service', 'Sales', 'Marketing', 'Administration'],
    accessLevels: ['Admin', 'User', 'Guest']
  },
  {
    name: 'CallPro Voice',
    description: 'Voice communication system',
    category: 'COMMUNICATION',
    hasApi: true,
    apiEndpoint: 'https://voice.callpro.mn',
    requiresManual: false,
    departments: ['Development', 'Customer Service', 'Sales'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'CallPro Text',
    description: 'SMS and text messaging system',
    category: 'COMMUNICATION',
    hasApi: true,
    apiEndpoint: 'https://text.callpro.mn',
    requiresManual: false,
    departments: ['Development', 'Customer Service', 'Sales'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Viber',
    description: 'Viber business communication',
    category: 'COMMUNICATION',
    hasApi: false,
    requiresManual: true,
    departments: ['Customer Service', 'Sales', 'Marketing'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'WhatsApp',
    description: 'WhatsApp business communication',
    category: 'COMMUNICATION',
    hasApi: true,
    apiEndpoint: 'https://api.whatsapp.com',
    requiresManual: false,
    departments: ['Customer Service', 'Sales', 'Marketing'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Telegram',
    description: 'Telegram business communication',
    category: 'COMMUNICATION',
    hasApi: true,
    apiEndpoint: 'https://api.telegram.org',
    requiresManual: false,
    departments: ['Customer Service', 'Sales', 'Marketing'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Zoom',
    description: 'Video conferencing and meetings',
    category: 'COMMUNICATION',
    hasApi: true,
    apiEndpoint: 'https://api.zoom.us',
    requiresManual: false,
    departments: ['Development', 'Customer Service', 'Sales', 'Marketing', 'Administration'],
    accessLevels: ['Admin', 'User', 'Guest']
  },
  {
    name: 'Skype',
    description: 'Skype for business communication',
    category: 'COMMUNICATION',
    hasApi: false,
    requiresManual: true,
    departments: ['Customer Service', 'Sales'],
    accessLevels: ['Admin', 'User']
  },

  // Productivity & Office
  {
    name: 'Google Workspace',
    description: 'Google Workspace for email, calendar, and collaboration',
    category: 'PRODUCTIVITY',
    hasApi: true,
    apiEndpoint: 'https://admin.googleapis.com',
    requiresManual: false,
    departments: ['Development', 'Customer Service', 'Sales', 'Marketing', 'Administration', 'Finance'],
    accessLevels: ['Admin', 'User', 'Guest']
  },
  {
    name: 'Microsoft Office',
    description: 'Microsoft Office suite',
    category: 'PRODUCTIVITY',
    hasApi: false,
    requiresManual: true,
    departments: ['Development', 'Customer Service', 'Sales', 'Marketing', 'Administration', 'Finance'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Monday.com',
    description: 'Project management and workflow automation',
    category: 'PRODUCTIVITY',
    hasApi: true,
    apiEndpoint: 'https://api.monday.com',
    requiresManual: false,
    departments: ['Development', 'Customer Service', 'Sales', 'Marketing', 'Administration'],
    accessLevels: ['Admin', 'User', 'Viewer']
  },
  {
    name: 'Timely Admin',
    description: 'Time tracking and project management',
    category: 'PRODUCTIVITY',
    hasApi: true,
    apiEndpoint: 'https://api.timelyapp.com',
    requiresManual: false,
    departments: ['Development', 'Customer Service', 'Sales', 'Marketing', 'Administration'],
    accessLevels: ['Admin', 'User']
  },

  // Customer Support & Helpdesk
  {
    name: 'CallPro SupportPal',
    description: 'CallPro support ticket system',
    category: 'SUPPORT',
    hasApi: true,
    apiEndpoint: 'https://support.callpro.mn/api',
    requiresManual: false,
    departments: ['Customer Service', 'Development', 'Administration'],
    accessLevels: ['Admin', 'Agent', 'User']
  },
  {
    name: 'LIME SupportPal',
    description: 'LIME support ticket system',
    category: 'SUPPORT',
    hasApi: true,
    apiEndpoint: 'https://support.lime.mn/api',
    requiresManual: false,
    departments: ['Customer Service', 'Development', 'Administration'],
    accessLevels: ['Admin', 'Agent', 'User']
  },
  {
    name: 'Zoho Desk',
    description: 'Zoho customer support system',
    category: 'SUPPORT',
    hasApi: true,
    apiEndpoint: 'https://desk.zoho.com/api',
    requiresManual: false,
    departments: ['Customer Service', 'Development'],
    accessLevels: ['Admin', 'Agent', 'User']
  },
  {
    name: 'Osticket',
    description: 'Open source helpdesk system',
    category: 'SUPPORT',
    hasApi: false,
    requiresManual: true,
    departments: ['Customer Service', 'Development'],
    accessLevels: ['Admin', 'Agent', 'User']
  },

  // Marketing & Social Media
  {
    name: 'Facebook',
    description: 'Facebook business pages and advertising',
    category: 'MARKETING',
    hasApi: true,
    apiEndpoint: 'https://graph.facebook.com',
    requiresManual: false,
    departments: ['Marketing', 'Sales'],
    accessLevels: ['Admin', 'Editor', 'Advertiser']
  },
  {
    name: 'Instagram',
    description: 'Instagram business account',
    category: 'MARKETING',
    hasApi: true,
    apiEndpoint: 'https://graph.instagram.com',
    requiresManual: false,
    departments: ['Marketing', 'Sales'],
    accessLevels: ['Admin', 'Editor']
  },
  {
    name: 'YouTube',
    description: 'YouTube channel management',
    category: 'MARKETING',
    hasApi: true,
    apiEndpoint: 'https://www.googleapis.com/youtube',
    requiresManual: false,
    departments: ['Marketing', 'Sales'],
    accessLevels: ['Admin', 'Editor']
  },
  {
    name: 'LinkedIn',
    description: 'LinkedIn business page',
    category: 'MARKETING',
    hasApi: true,
    apiEndpoint: 'https://api.linkedin.com',
    requiresManual: false,
    departments: ['Marketing', 'Sales'],
    accessLevels: ['Admin', 'Editor']
  },
  {
    name: 'Twitter',
    description: 'Twitter business account',
    category: 'MARKETING',
    hasApi: true,
    apiEndpoint: 'https://api.twitter.com',
    requiresManual: false,
    departments: ['Marketing', 'Sales'],
    accessLevels: ['Admin', 'Editor']
  },
  {
    name: 'HubSpot',
    description: 'HubSpot CRM and marketing automation',
    category: 'MARKETING',
    hasApi: true,
    apiEndpoint: 'https://api.hubapi.com',
    requiresManual: false,
    departments: ['Marketing', 'Sales', 'Customer Service'],
    accessLevels: ['Admin', 'User', 'Viewer']
  },

  // Development & Technical
  {
    name: 'GitHub',
    description: 'GitHub repository management',
    category: 'DEVELOPMENT',
    hasApi: true,
    apiEndpoint: 'https://api.github.com',
    requiresManual: false,
    departments: ['Development'],
    accessLevels: ['Admin', 'Maintainer', 'Developer', 'Read']
  },
  {
    name: 'GitLab',
    description: 'GitLab repository management',
    category: 'DEVELOPMENT',
    hasApi: true,
    apiEndpoint: 'https://gitlab.com/api',
    requiresManual: false,
    departments: ['Development'],
    accessLevels: ['Admin', 'Maintainer', 'Developer', 'Read']
  },
  {
    name: 'AWS',
    description: 'Amazon Web Services cloud platform',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    apiEndpoint: 'https://api.aws.amazon.com',
    requiresManual: false,
    departments: ['Development', 'DevOps'],
    accessLevels: ['Admin', 'PowerUser', 'ReadOnly']
  },
  {
    name: 'Google Cloud',
    description: 'Google Cloud Platform',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    apiEndpoint: 'https://cloud.google.com',
    requiresManual: false,
    departments: ['Development', 'DevOps'],
    accessLevels: ['Admin', 'Editor', 'Viewer']
  },
  {
    name: 'Firebase',
    description: 'Firebase backend services',
    category: 'INFRASTRUCTURE',
    hasApi: true,
    apiEndpoint: 'https://firebase.google.com',
    requiresManual: false,
    departments: ['Development', 'DevOps'],
    accessLevels: ['Admin', 'Editor', 'Viewer']
  },

  // Finance & Payment
  {
    name: 'QuickBooks',
    description: 'QuickBooks accounting software',
    category: 'FINANCE',
    hasApi: true,
    apiEndpoint: 'https://quickbooks.intuit.com',
    requiresManual: false,
    departments: ['Finance', 'Administration'],
    accessLevels: ['Admin', 'User', 'Viewer']
  },
  {
    name: 'PayPal',
    description: 'PayPal payment processing',
    category: 'FINANCE',
    hasApi: true,
    apiEndpoint: 'https://api.paypal.com',
    requiresManual: false,
    departments: ['Finance', 'Sales'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Stripe',
    description: 'Stripe payment processing',
    category: 'FINANCE',
    hasApi: true,
    apiEndpoint: 'https://api.stripe.com',
    requiresManual: false,
    departments: ['Finance', 'Sales', 'Development'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Monpay',
    description: 'Monpay payment system',
    category: 'FINANCE',
    hasApi: true,
    apiEndpoint: 'https://api.monpay.mn',
    requiresManual: false,
    departments: ['Finance', 'Sales'],
    accessLevels: ['Admin', 'User']
  },

  // Security & Authentication
  {
    name: 'Bitwarden',
    description: 'Password management system',
    category: 'SECURITY',
    hasApi: true,
    apiEndpoint: 'https://api.bitwarden.com',
    requiresManual: false,
    departments: ['Development', 'Administration', 'Customer Service', 'Sales', 'Marketing'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Google Authenticator',
    description: 'Two-factor authentication',
    category: 'SECURITY',
    hasApi: false,
    requiresManual: true,
    departments: ['Development', 'Administration', 'Customer Service', 'Sales', 'Marketing'],
    accessLevels: ['Admin', 'User']
  },

  // Design & Creative
  {
    name: 'Canva',
    description: 'Graphic design platform',
    category: 'DESIGN',
    hasApi: true,
    apiEndpoint: 'https://api.canva.com',
    requiresManual: false,
    departments: ['Marketing', 'Sales'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Figma',
    description: 'Design and prototyping tool',
    category: 'DESIGN',
    hasApi: true,
    apiEndpoint: 'https://api.figma.com',
    requiresManual: false,
    departments: ['Development', 'Marketing'],
    accessLevels: ['Admin', 'User', 'Viewer']
  },
  {
    name: 'Adobe Creative Suite',
    description: 'Adobe creative applications',
    category: 'DESIGN',
    hasApi: false,
    requiresManual: true,
    departments: ['Marketing', 'Development'],
    accessLevels: ['Admin', 'User']
  },

  // E-commerce & Business
  {
    name: 'Samsung.ru',
    description: 'Samsung business portal',
    category: 'BUSINESS',
    hasApi: false,
    requiresManual: true,
    departments: ['Sales', 'Marketing'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'LG.ru',
    description: 'LG business portal',
    category: 'BUSINESS',
    hasApi: false,
    requiresManual: true,
    departments: ['Sales', 'Marketing'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Next.mn',
    description: 'Next.mn e-commerce platform',
    category: 'BUSINESS',
    hasApi: true,
    apiEndpoint: 'https://api.next.mn',
    requiresManual: false,
    departments: ['Sales', 'Marketing', 'Development'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'PC-mall.mn',
    description: 'PC-mall.mn e-commerce platform',
    category: 'BUSINESS',
    hasApi: true,
    apiEndpoint: 'https://api.pc-mall.mn',
    requiresManual: false,
    departments: ['Sales', 'Marketing', 'Development'],
    accessLevels: ['Admin', 'User']
  },

  // Infrastructure & Servers
  {
    name: 'CallPro Web Servers',
    description: 'Web application servers',
    category: 'INFRASTRUCTURE',
    hasApi: false,
    requiresManual: true,
    departments: ['Development', 'DevOps'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Database Servers',
    description: 'PostgreSQL, MySQL, Redis databases',
    category: 'INFRASTRUCTURE',
    hasApi: false,
    requiresManual: true,
    departments: ['Development', 'DevOps'],
    accessLevels: ['Admin', 'User', 'ReadOnly']
  },
  {
    name: 'Asterisk Servers',
    description: 'VoIP telephony servers',
    category: 'INFRASTRUCTURE',
    hasApi: false,
    requiresManual: true,
    departments: ['Development', 'DevOps'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'FreePBX',
    description: 'FreePBX telephony system',
    category: 'INFRASTRUCTURE',
    hasApi: false,
    requiresManual: true,
    departments: ['Development', 'DevOps'],
    accessLevels: ['Admin', 'User']
  },

  // Government & Legal
  {
    name: 'Tender.gov.mn',
    description: 'Government tender system',
    category: 'GOVERNMENT',
    hasApi: false,
    requiresManual: true,
    departments: ['Administration', 'Finance'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Tax Systems',
    description: 'Tax and social insurance systems',
    category: 'GOVERNMENT',
    hasApi: false,
    requiresManual: true,
    departments: ['Finance', 'Administration'],
    accessLevels: ['Admin', 'User']
  },

  // Banking & Financial
  {
    name: 'Banking Systems',
    description: 'Banking and financial systems',
    category: 'FINANCE',
    hasApi: false,
    requiresManual: true,
    departments: ['Finance', 'Administration'],
    accessLevels: ['Admin', 'User']
  },
  {
    name: 'Monpass',
    description: 'Monpass payment system',
    category: 'FINANCE',
    hasApi: true,
    apiEndpoint: 'https://api.monpass.mn',
    requiresManual: false,
    departments: ['Finance', 'Sales'],
    accessLevels: ['Admin', 'User']
  }
]

async function importSystems() {
  try {
    console.log('Starting comprehensive systems import...')

    for (const systemData of systemsData) {
      await prisma.system.upsert({
        where: { name: systemData.name },
        update: {
          description: systemData.description,
          category: systemData.category as any,
          hasApi: systemData.hasApi,
          apiEndpoint: systemData.apiEndpoint,
          requiresManual: systemData.requiresManual,
          isActive: true
        },
        create: {
          name: systemData.name,
          description: systemData.description,
          category: systemData.category as any,
          hasApi: systemData.hasApi,
          apiEndpoint: systemData.apiEndpoint,
          requiresManual: systemData.requiresManual,
          isActive: true
        }
      })

      console.log(`✓ Imported system: ${systemData.name}`)
    }

    console.log(`\n✅ Successfully imported ${systemsData.length} systems`)
    console.log('\n📊 Systems by category:')
    
    const categories = systemsData.reduce((acc, system) => {
      acc[system.category] = (acc[system.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} systems`)
    })

    console.log('\n🎯 Department access mapping:')
    const departmentAccess = systemsData.reduce((acc, system) => {
      system.departments.forEach(dept => {
        if (!acc[dept]) acc[dept] = []
        acc[dept].push(system.name)
      })
      return acc
    }, {} as Record<string, string[]>)

    Object.entries(departmentAccess).forEach(([dept, systems]) => {
      console.log(`  ${dept}: ${systems.length} systems`)
    })

  } catch (error) {
    console.error('Error importing systems:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importSystems()
