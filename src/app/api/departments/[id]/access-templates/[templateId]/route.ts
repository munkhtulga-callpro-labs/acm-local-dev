import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isPrivilegedRole } from '@/lib/roles'
import { updateAccessTemplateSchema } from '@/lib/schemas/department-access-template'

type RouteParams = { params: Promise<{ id: string; templateId: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isPrivilegedRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, templateId } = await params
    const existing = await prisma.departmentAccessTemplate.findUnique({
      where: { id: templateId },
    })

    // Scope the lookup to the department in the path so a template cannot be
    // edited through a department it does not belong to.
    if (!existing || existing.departmentId !== id) {
      return NextResponse.json({ error: 'Access template not found' }, { status: 404 })
    }

    const body = await request.json()
    const result = updateAccessTemplateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: z.flattenError(result.error).fieldErrors },
        { status: 400 }
      )
    }

    if (result.data.kind !== existing.kind) {
      return NextResponse.json(
        { error: 'Cannot change a template between system and resource — delete it and create a new one' },
        { status: 400 }
      )
    }

    const template = await prisma.departmentAccessTemplate.update({
      where: { id: templateId },
      data: result.data,
      include: { system: { select: { id: true, name: true, category: true } } },
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_DEPARTMENT_ACCESS_TEMPLATE',
        entityType: 'DepartmentAccessTemplate',
        entityId: templateId,
        userId: session.user.id,
        ipAddress:
          request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
        oldValues: {
          accessLevel: existing.accessLevel,
          isRequired: existing.isRequired,
          isActive: existing.isActive,
        },
        newValues: result.data,
      },
    })

    return NextResponse.json({ data: template })
  } catch (error) {
    console.error('Error updating department access template:', error)
    return NextResponse.json({ error: 'Failed to update access template' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isPrivilegedRole(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, templateId } = await params
    const existing = await prisma.departmentAccessTemplate.findUnique({
      where: { id: templateId },
    })

    if (!existing || existing.departmentId !== id) {
      return NextResponse.json({ error: 'Access template not found' }, { status: 404 })
    }

    await prisma.departmentAccessTemplate.delete({ where: { id: templateId } })

    // Logged with the full prior row: the record is gone after this, so the audit
    // entry is the only remaining evidence of what the department used to grant.
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_DEPARTMENT_ACCESS_TEMPLATE',
        entityType: 'DepartmentAccessTemplate',
        entityId: templateId,
        userId: session.user.id,
        ipAddress:
          request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
        oldValues: {
          kind: existing.kind,
          systemId: existing.systemId,
          resourceType: existing.resourceType,
          resourceId: existing.resourceId,
          resourceName: existing.resourceName,
          accessLevel: existing.accessLevel,
          isRequired: existing.isRequired,
          isActive: existing.isActive,
        },
      },
    })

    return NextResponse.json({ message: 'Access template deleted successfully' })
  } catch (error) {
    console.error('Error deleting department access template:', error)
    return NextResponse.json({ error: 'Failed to delete access template' }, { status: 500 })
  }
}
