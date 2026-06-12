import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PRIVILEGED_ROLES = ['ADMIN', 'IT_STAFF']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const apiKey = await prisma.aPIKey.findUnique({
      where: { id },
      select: { id: true, serviceName: true, apiKeyToken: true, assignedTo: true },
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    const isPrivileged = PRIVILEGED_ROLES.includes(session.user.role)
    const isOwner = apiKey.assignedTo === session.user.email

    if (!isPrivileged && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.auditLog.create({
      data: {
        action: 'VIEW_TOKEN',
        entityType: 'APIKey',
        entityId: id,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
        newValues: { serviceName: apiKey.serviceName },
      },
    })

    return NextResponse.json({ token: apiKey.apiKeyToken })
  } catch (error) {
    console.error('Error fetching API key token:', error)
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 })
  }
}
