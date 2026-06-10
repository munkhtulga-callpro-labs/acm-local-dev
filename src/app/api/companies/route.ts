import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  website: z.string().url('Invalid website URL').optional(),
})

const updateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  website: z.string().url('Invalid website URL').optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companies = await prisma.company.findMany({
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCompanySchema.parse(body)

    // Check if company already exists
    const existingCompany = await prisma.company.findFirst({
      where: { name: validatedData.name },
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company with this name already exists' },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
      data: validatedData,
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
