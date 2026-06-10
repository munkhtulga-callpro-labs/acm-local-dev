import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cleanup endpoint to delete all test data
export async function POST(request: NextRequest) {
  try {
    // Delete all resource assignments
    await prisma.resourceAssignment.deleteMany({})

    // Delete all resource approvals
    await prisma.resourceApproval.deleteMany({})

    // Delete all resource access requests
    await prisma.resourceAccessRequest.deleteMany({})

    return NextResponse.json({
      message: 'All test data cleaned up successfully'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup data' },
      { status: 500 }
    )
  }
}
