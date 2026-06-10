import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  manager: z.string().email('Invalid manager email').optional(),
  company: z.string().optional(),
})

const updateDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').optional(),
  description: z.string().optional(),
  manager: z.string().email('Invalid manager email').optional(),
  company: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Temporarily removed authentication for testing
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    })

    // Get employee counts for each department
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await prisma.employee.count({
          where: {
            department: dept.name,
            // Don't filter by company since departments are now shared across companies
          },
        })

        return {
          ...dept,
          employeeCount,
        }
      })
    )

    return NextResponse.json(departmentsWithCounts)
  } catch (error) {
    console.error('Error fetching departments:', error)
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
    const validatedData = createDepartmentSchema.parse(body)

    // Check if department already exists
    const existingDepartment = await prisma.department.findFirst({
      where: { 
        name: validatedData.name,
        company: validatedData.company || 'Onlime Network LLC'
      },
    })

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this name already exists in the company' },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        ...validatedData,
        company: validatedData.company || 'Onlime Network LLC',
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error('Error creating department:', error)
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

