import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await prisma.saaSSubscription.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert Decimal to number for JSON serialization
    const serializedSubscriptions = subscriptions.map(subscription => ({
      ...subscription,
      cost: subscription.cost ? Number(subscription.cost) : null
    }))

    return NextResponse.json({ data: serializedSubscriptions })
  } catch (error) {
    console.error('Error fetching SaaS subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SaaS subscriptions' },
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

    // Validate required fields
    if (!body.serviceName || !body.subscriptionPlan || !body.category || !body.billingCycle || !body.totalSeats) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const subscription = await prisma.saaSSubscription.create({
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

    return NextResponse.json({ data: serializedSubscription }, { status: 201 })
  } catch (error) {
    console.error('Error creating SaaS subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create SaaS subscription' },
      { status: 500 }
    )
  }
}
