import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Debug endpoint to see all access requests
export async function GET(request: NextRequest) {
  try {
    const requests = await prisma.resourceAccessRequest.findMany({
      include: {
        approvals: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      data: requests,
      count: requests.length
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}
