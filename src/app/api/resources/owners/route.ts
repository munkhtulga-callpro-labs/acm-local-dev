import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/resources/owners?resourceType=DATABASE&resourceId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('resourceType')
    const resourceId = searchParams.get('resourceId')

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'resourceType and resourceId are required' },
        { status: 400 }
      )
    }

    const owners = await prisma.resourceOwner.findMany({
      where: {
        resourceType,
        resourceId,
        isActive: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ data: owners })
  } catch (error) {
    console.error('Error fetching resource owners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resource owners' },
      { status: 500 }
    )
  }
}

// POST /api/resources/owners
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resourceType, resourceId, owners } = body

    console.log('POST /api/resources/owners - Request:', { resourceType, resourceId, owners })

    if (!resourceType || !resourceId || !owners || !Array.isArray(owners)) {
      console.error('Validation failed:', { resourceType, resourceId, owners })
      return NextResponse.json(
        { error: 'resourceType, resourceId, and owners array are required' },
        { status: 400 }
      )
    }

    // Delete existing owners for this resource
    const deleteResult = await prisma.resourceOwner.deleteMany({
      where: {
        resourceType,
        resourceId
      }
    })
    console.log(`Deleted ${deleteResult.count} existing owners for ${resourceType}:${resourceId}`)

    // Create new owners
    const createdOwners = await Promise.all(
      owners.map((owner: any) =>
        prisma.resourceOwner.create({
          data: {
            resourceType,
            resourceId,
            ownershipType: owner.ownershipType,
            ownerId: owner.ownerId || null,
            ownerEmail: owner.ownerEmail || null,
            ownerDepartment: owner.ownerDepartment || null,
            notes: owner.notes || null,
            isActive: true
          }
        })
      )
    )

    console.log(`Created ${createdOwners.length} owners for ${resourceType}:${resourceId}`)

    // ✅ FIX: Update pending access request approvals to reflect new owners
    try {
      // Find all pending access requests for this resource
      const pendingRequests = await prisma.resourceAccessRequest.findMany({
        where: {
          resourceType,
          resourceId,
          status: 'PENDING'
        },
        include: {
          approvals: true
        }
      })

      console.log(`Found ${pendingRequests.length} pending requests for ${resourceType}:${resourceId}`)

      // For each pending request, update its approvals
      for (const request of pendingRequests) {
        // Delete old approval records
        await prisma.resourceApproval.deleteMany({
          where: { requestId: request.id }
        })

        // Create new approval records for current owners (only those with email)
        const ownersWithEmail = createdOwners.filter(o => o.ownerEmail && o.ownerEmail.trim() !== '')

        await Promise.all(
          ownersWithEmail.map((owner) =>
            prisma.resourceApproval.create({
              data: {
                requestId: request.id,
                approverId: owner.ownerEmail!,
                approverName: owner.ownerEmail!,
                approverEmail: owner.ownerEmail!,
                approverRole: owner.ownershipType,
                status: 'PENDING',
              }
            })
          )
        )

        console.log(`✅ Updated approvals for request ${request.id} with ${ownersWithEmail.length} new owners`)
      }
    } catch (approvalError) {
      console.error('❌ Failed to update pending approvals:', approvalError)
      // Don't fail the owner update if approval sync fails
    }

    return NextResponse.json({ data: createdOwners }, { status: 201 })
  } catch (error) {
    console.error('Error creating resource owners:', error)
    return NextResponse.json(
      { error: 'Failed to create resource owners' },
      { status: 500 }
    )
  }
}

// DELETE /api/resources/owners?resourceType=DATABASE&resourceId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('resourceType')
    const resourceId = searchParams.get('resourceId')

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'resourceType and resourceId are required' },
        { status: 400 }
      )
    }

    await prisma.resourceOwner.deleteMany({
      where: {
        resourceType,
        resourceId
      }
    })

    return NextResponse.json({ message: 'Resource owners deleted successfully' })
  } catch (error) {
    console.error('Error deleting resource owners:', error)
    return NextResponse.json(
      { error: 'Failed to delete resource owners' },
      { status: 500 }
    )
  }
}
