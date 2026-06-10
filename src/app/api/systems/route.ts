import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSystemSchema = z.object({
  name: z.string().min(1, 'System name is required'),
  description: z.string().optional(),
  category: z.enum([
    'COMMUNICATION',
    'PRODUCTIVITY', 
    'DEVELOPMENT',
    'FINANCE',
    'MARKETING',
    'CUSTOMER_SERVICE',
    'INFRASTRUCTURE',
    'SUPPORT',
    'DESIGN',
    'BUSINESS',
    'GOVERNMENT',
    'SECURITY',
    'OTHER'
  ]),
  hasApi: z.boolean().default(false),
  apiEndpoint: z.string().optional(),
  requiresManual: z.boolean().default(false),
  isActive: z.boolean().default(true)
})

const querySchema = z.object({
  search: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  hasApi: z.string().nullable().optional(),
  page: z.string().nullable().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().nullable().optional().transform(val => val ? parseInt(val) : 20)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      hasApi: searchParams.get('hasApi'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })

    const where: any = {}
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ]
    }
    
    if (query.category && query.category !== 'ALL') {
      where.category = query.category
    }
    
    if (query.hasApi !== undefined) {
      where.hasApi = query.hasApi === 'true'
    }

    const [systems, total] = await Promise.all([
      prisma.system.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      prisma.system.count({ where })
    ])

    return NextResponse.json({
      data: systems,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    })
  } catch (error) {
    console.error('Error fetching systems:', error)
    return NextResponse.json(
      { error: 'Failed to fetch systems' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSystemSchema.parse(body)

    const system = await prisma.system.create({
      data: validatedData
    })

    return NextResponse.json(system, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating system:', error)
    return NextResponse.json(
      { error: 'Failed to create system' },
      { status: 500 }
    )
  }
}
