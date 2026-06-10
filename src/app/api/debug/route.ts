import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get employee count
    const employeeCount = await prisma.employee.count()
    
    // Get departments count
    const departmentCount = await prisma.department.count()
    
    // Get companies count
    const companyCount = await prisma.company.count()
    
    // Get positions count
    const positionCount = await prisma.position.count()
    
    // Get recent employees (first 5)
    const recentEmployees = await prisma.employee.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        company: true
      }
    })
    
    // Get users for authentication
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true
      }
    })
    
    // Get departments with employee counts
    const departments = await prisma.department.findMany({
      take: 5,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        company: true
      }
    })
    
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await prisma.employee.count({
          where: {
            department: dept.name,
            company: dept.company,
          },
        })
        return {
          ...dept,
          employeeCount,
        }
      })
    )

    return NextResponse.json({
      success: true,
      counts: {
        employees: employeeCount,
        departments: departmentCount,
        companies: companyCount,
        positions: positionCount,
        users: users.length
      },
      recentEmployees,
      users,
      departments: departmentsWithCounts
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
