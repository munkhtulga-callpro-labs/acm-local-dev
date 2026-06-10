import { NextRequest, NextResponse } from 'next/server'
import { sendAccessRequestNotification, sendAccessGrantedNotification, sendAccessRejectedNotification } from '@/lib/email'

// Test endpoint to send sample emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const results: any = {}

    // Send test emails based on type
    if (!type || type === 'request') {
      console.log('Sending access request notification test...')
      const requestResult = await sendAccessRequestNotification(email, {
        requesterName: 'Bayarbold Battogtokh',
        requesterEmail: 'bayarbold@callpro.mn',
        resourceName: 'teamsdb01 (MySQL)',
        resourceType: 'DATABASE',
        accessLevel: 'Write',
        businessJustification: 'Need write access to update team records and manage database configurations for the Q1 project.',
        requestId: 'test-request-123'
      })
      results.request = requestResult
    }

    if (!type || type === 'approved') {
      console.log('Sending access granted notification test...')
      const approvedResult = await sendAccessGrantedNotification(email, {
        requesterName: 'Berjan Bayat',
        resourceName: 'teamsdb01 (MySQL)',
        resourceType: 'DATABASE',
        accessLevel: 'Write',
        validFrom: new Date(),
        validTo: null,
        credentials: {
          host: 'teamsdb01.callpro.mn',
          port: '3306',
          username: 'berjan',
          password: 'SecureP@ss123',
          database: 'teams_production',
          otherDetails: 'SSL required for connection'
        },
        grantedBy: 'damdindorj@callpro.mn'
      })
      results.approved = approvedResult
    }

    if (!type || type === 'rejected') {
      console.log('Sending access rejected notification test...')
      const rejectedResult = await sendAccessRejectedNotification(email, {
        requesterName: 'Berjan Bayat',
        resourceName: 'teamsdb01 (MySQL)',
        resourceType: 'DATABASE',
        accessLevel: 'Admin',
        rejectedBy: 'damdindorj@callpro.mn',
        reason: 'Admin access requires additional security clearance and management approval. Please submit a request with proper business justification and manager signature.'
      })
      results.rejected = rejectedResult
    }

    return NextResponse.json({
      success: true,
      message: `Test email(s) sent to ${email}`,
      results
    })

  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint for quick testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const type = searchParams.get('type') // 'request', 'approved', 'rejected', or 'all'

  if (!email) {
    return NextResponse.json(
      { error: 'Please provide email parameter: /api/test-email?email=your@email.com' },
      { status: 400 }
    )
  }

  return POST(request)
}
