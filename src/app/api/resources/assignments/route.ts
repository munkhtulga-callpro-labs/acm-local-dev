import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') // 'my-access', 'all'
    const status = searchParams.get('status') // 'ACTIVE', 'EXPIRED', 'REVOKED'
    const assigneeEmail = searchParams.get('assigneeEmail') // Filter by specific email

    let whereClause: any = {}

    if (view === 'my-access') {
      whereClause.assigneeEmail = session.user.email
    } else if (assigneeEmail) {
      whereClause.assigneeEmail = assigneeEmail
    }

    if (status) {
      whereClause.status = status
    }

    const assignments = await prisma.resourceAssignment.findMany({
      where: whereClause,
      include: {
        request: {
          select: {
            businessJustification: true,
            priority: true,
            requestedAt: true
          }
        }
      },
      orderBy: {
        grantedAt: 'desc'
      }
    })

    return NextResponse.json({ data: assignments, total: assignments.length })
  } catch (error) {
    console.error('Error fetching resource assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resource assignments' },
      { status: 500 }
    )
  }
}
