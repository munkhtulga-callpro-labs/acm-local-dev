import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AccessService } from '@/services/access-service'
import { ApprovalService } from '@/services/approval-service'
import { AuditService } from '@/services/audit-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get dashboard statistics
    const [
      totalEmployees,
      activeEmployees,
      pendingRequests,
      expiringAccess,
      recentActivity,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.accessRequest.count({ where: { status: 'PENDING' } }),
      AccessService.getExpiringAccess(7),
      AuditService.getRecentActivity(10),
    ])

    // Get pending approvals for current user
    const pendingApprovals = await ApprovalService.getPendingApprovals(session.user.id)

    // Get access matrix for admin users
    let accessMatrix = null
    if (session.user.role === 'ADMIN') {
      accessMatrix = await AccessService.getAccessMatrix()
    }

    return NextResponse.json({
      stats: {
        totalEmployees,
        activeEmployees,
        pendingRequests,
        expiringAccess: expiringAccess.length,
      },
      pendingApprovals,
      recentActivity,
      accessMatrix,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
