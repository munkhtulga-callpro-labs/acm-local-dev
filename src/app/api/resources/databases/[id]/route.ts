import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const database = await prisma.resourceDatabase.findUnique({
      where: { id }
    })

    if (!database) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    return NextResponse.json({ data: database })
  } catch (error) {
    console.error('Error fetching database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch database' },
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

    // Get existing database for audit log
    const existingDatabase = await prisma.resourceDatabase.findUnique({
      where: { id }
    })

    if (!existingDatabase) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    const database = await prisma.resourceDatabase.update({
      where: { id },
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
            action: 'UPDATE_RESOURCE',
            entityType: 'ResourceDatabase',
            entityId: id,
            userId: currentUser.id,
            employeeId: currentUser.employee?.id || null,
            oldValues: {
              name: existingDatabase.name,
              host: existingDatabase.host,
              port: existingDatabase.port,
              owner: existingDatabase.owner,
              isActive: existingDatabase.isActive
            },
            newValues: {
              name: database.name,
              host: database.host,
              port: database.port,
              owner: database.owner,
              isActive: database.isActive
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        })
        console.log('✅ Audit log created for UPDATE_RESOURCE (Database)')
      }
    } catch (auditError) {
      console.error('❌ Failed to create audit log:', auditError)
    }

    return NextResponse.json({ data: database })
  } catch (error) {
    console.error('Error updating database:', error)
    return NextResponse.json(
      { error: 'Failed to update database' },
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

    // Get existing database for audit log
    const existingDatabase = await prisma.resourceDatabase.findUnique({
      where: { id }
    })

    if (!existingDatabase) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    await prisma.resourceDatabase.delete({
      where: { id }
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
            action: 'DELETE_RESOURCE',
            entityType: 'ResourceDatabase',
            entityId: id,
            userId: currentUser.id,
            employeeId: currentUser.employee?.id || null,
            oldValues: {
              resourceType: 'DATABASE',
              name: existingDatabase.name,
              databaseType: existingDatabase.databaseType,
              host: existingDatabase.host,
              port: existingDatabase.port,
              owner: existingDatabase.owner
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        })
        console.log('✅ Audit log created for DELETE_RESOURCE (Database)')
      }
    } catch (auditError) {
      console.error('❌ Failed to create audit log:', auditError)
    }

    return NextResponse.json({ message: 'Database deleted successfully' })
  } catch (error) {
    console.error('Error deleting database:', error)
    return NextResponse.json(
      { error: 'Failed to delete database' },
      { status: 500 }
    )
  }
}
