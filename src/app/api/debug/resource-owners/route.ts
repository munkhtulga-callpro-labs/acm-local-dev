import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Debug endpoint to see all resource owners
export async function GET(request: NextRequest) {
  try {
    const owners = await prisma.resourceOwner.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      data: owners,
      count: owners.length
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch owners' },
      { status: 500 }
    )
  }
}
