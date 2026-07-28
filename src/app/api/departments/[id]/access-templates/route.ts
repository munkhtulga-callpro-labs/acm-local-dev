import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isPrivilegedRole } from '@/lib/roles'
import { createAccessTemplateSchema } from '@/lib/schemas/department-access-template'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const department = await prisma.department.findUnique({ where: { id } })
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    const templates = await prisma.departmentAccessTemplate.findMany({
      where: { departmentId: id },
      include: { system: { select: { id: true, name: true, category: true } } },
      orderBy: [{ kind: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ data: templates })
  } catch (error) {
    console.error('Error fetching department access templates:', error)
    return NextResponse.json({ error: 'Failed to fetch access templates' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isPrivilegedRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const department = await prisma.department.findUnique({ where: { id } })
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    const body = await request.json()
    const result = createAccessTemplateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: z.flattenError(result.error).fieldErrors },
        { status: 400 }
      )
    }

    const data = result.data

    // A department granting the same system/resource twice would raise duplicate
    // requests for every new hire, so treat it as a conflict rather than a second row.
    const duplicate = await prisma.departmentAccessTemplate.findFirst({
      where:
        data.kind === 'SYSTEM'
          ? { departmentId: id, kind: 'SYSTEM', systemId: data.systemId }
          : {
              departmentId: id,
              kind: 'RESOURCE',
              resourceType: data.resourceType,
              resourceId: data.resourceId,
            },
    })

    if (duplicate) {
      return NextResponse.json(
        { error: 'This system or resource is already templated for the department' },
        { status: 409 }
      )
    }

    const template = await prisma.departmentAccessTemplate.create({
      data: { ...data, departmentId: id },
      include: { system: { select: { id: true, name: true, category: true } } },
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_DEPARTMENT_ACCESS_TEMPLATE',
        entityType: 'DepartmentAccessTemplate',
        entityId: template.id,
        userId: session.user.id,
        ipAddress:
          request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
        newValues: { department: department.name, ...data },
      },
    })

    return NextResponse.json({ data: template }, { status: 201 })
  } catch (error) {
    console.error('Error creating department access template:', error)
    return NextResponse.json({ error: 'Failed to create access template' }, { status: 500 })
  }
}
