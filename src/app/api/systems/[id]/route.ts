import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSystemSchema = z.object({
  name: z.string().min(1).optional(),
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
  ]).optional(),
  hasApi: z.boolean().optional(),
  apiEndpoint: z.string().optional(),
  requiresManual: z.boolean().optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const system = await prisma.system.findUnique({
      where: { id },
      include: {
        accessPermissions: {
          include: {
            employee: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!system) {
      return NextResponse.json(
        { error: 'System not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(system)
  } catch (error) {
    console.error('Error fetching system:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const validatedData = updateSystemSchema.parse(body)

    const system = await prisma.system.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(system)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating system:', error)
    return NextResponse.json(
      { error: 'Failed to update system' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Check if system has active access permissions
    const activePermissions = await prisma.accessPermission.count({
      where: {
        systemId: id,
        isActive: true
      }
    })

    if (activePermissions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete system with active access permissions' },
        { status: 400 }
      )
    }

    await prisma.system.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'System deleted successfully' })
  } catch (error) {
    console.error('Error deleting system:', error)
    return NextResponse.json(
      { error: 'Failed to delete system' },
      { status: 500 }
    )
  }
}
