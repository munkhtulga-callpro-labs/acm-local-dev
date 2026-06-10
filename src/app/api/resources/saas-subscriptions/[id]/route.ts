import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

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

    const subscription = await prisma.saaSSubscription.findUnique({
      where: { id }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'SaaS subscription not found' }, { status: 404 })
    }

    // Convert Decimal to number for JSON serialization
    const serializedSubscription = {
      ...subscription,
      cost: subscription.cost ? Number(subscription.cost) : null
    }

    return NextResponse.json({ data: serializedSubscription })
  } catch (error) {
    console.error('Error fetching SaaS subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SaaS subscription' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const subscription = await prisma.saaSSubscription.update({
      where: { id },
      data: {
        serviceName: body.serviceName,
        category: body.category,
        subscriptionPlan: body.subscriptionPlan,
        totalSeats: parseInt(body.totalSeats),
        usedSeats: parseInt(body.usedSeats) || 0,
        billingCycle: body.billingCycle,
        cost: body.cost ? new Decimal(body.cost) : null,
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : null,
        ownerDepartment: body.ownerDepartment || null,
        status: body.status || 'ACTIVE',
        ssoEnabled: body.ssoEnabled ?? false,
        apiAccess: body.apiAccess ?? false,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        accessRequestTicketId: body.accessRequestTicketId || null,
      }
    })

    // Convert Decimal to number for JSON serialization
    const serializedSubscription = {
      ...subscription,
      cost: subscription.cost ? Number(subscription.cost) : null
    }

    return NextResponse.json({ data: serializedSubscription })
  } catch (error) {
    console.error('Error updating SaaS subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update SaaS subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.saaSSubscription.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'SaaS subscription deleted successfully' })
  } catch (error) {
    console.error('Error deleting SaaS subscription:', error)
    return NextResponse.json(
      { error: 'Failed to delete SaaS subscription' },
      { status: 500 }
    )
  }
}
