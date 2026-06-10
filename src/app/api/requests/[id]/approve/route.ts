import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { approveRequestSchema } from '@/lib/validations'
import { ApprovalService } from '@/services/approval-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const resolvedParams = await params
    const validatedData = approveRequestSchema.parse({
      requestId: resolvedParams.id,
      ...body,
    })

    const accessRequest = await ApprovalService.approveRequest({
      requestId: validatedData.requestId,
      approverId: session.user.id,
      comments: validatedData.comments,
    })

    return NextResponse.json(accessRequest)
  } catch (error) {
    console.error('Error approving request:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message.includes('No pending approval')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
