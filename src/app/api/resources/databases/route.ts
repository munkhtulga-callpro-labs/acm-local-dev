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

    const databases = await prisma.resourceDatabase.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: databases })
  } catch (error) {
    console.error('Error fetching databases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch databases' },
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
    if (!body.name || !body.databaseType || !body.host || !body.port || !body.owner || !body.environment || !body.accessLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const database = await prisma.resourceDatabase.create({
      data: {
        name: body.name,
        databaseType: body.databaseType,
        version: body.version || null,
        host: body.host,
        port: parseInt(body.port),
        databaseName: body.databaseName || null,
        schema: body.schema || null,
        connectionString: body.connectionString || null,
        adminUser: body.adminUser || null,
        isEncrypted: body.isEncrypted ?? true,
        encryptionType: body.encryptionType || null,
        backupEnabled: body.backupEnabled ?? true,
        backupFrequency: body.backupFrequency || null,
        lastBackupDate: body.lastBackupDate ? new Date(body.lastBackupDate) : null,
        owner: body.owner,
        environment: body.environment,
        accessLevel: body.accessLevel,
        description: body.description || null,
        requestedBy: body.requestedBy || null,
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        businessJustification: body.businessJustification || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : null,
        accessRequestTicketId: body.accessRequestTicketId || null,
        isActive: body.isActive ?? true,
      }
    })

    // Create audit log
    try {
      const currentUser = session.user?.email ? await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { employee: true }
      }) : null

      if (currentUser) {
        await prisma.auditLog.create({
          data: {
            action: 'CREATE_RESOURCE',
            entityType: 'ResourceDatabase',
            entityId: database.id,
            userId: currentUser.id,
            employeeId: currentUser.employee?.id || null,
            newValues: {
              resourceType: 'DATABASE',
              name: database.name,
              databaseType: database.databaseType,
              host: database.host,
              port: database.port,
              environment: database.environment,
              owner: database.owner
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        })
        console.log('✅ Audit log created for CREATE_RESOURCE (Database)')
      }
    } catch (auditError) {
      console.error('❌ Failed to create audit log:', auditError)
    }

    return NextResponse.json({ data: database }, { status: 201 })
  } catch (error) {
    console.error('Error creating database:', error)
    return NextResponse.json(
      { error: 'Failed to create database' },
      { status: 500 }
    )
  }
}
