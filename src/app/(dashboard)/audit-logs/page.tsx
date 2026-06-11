import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type AuditLog } from '@/components/audit-logs-data-table'
import { AuditLogsClient } from './client'

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const rows = await prisma.auditLog.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  const initialData = rows.map(({ createdAt, user, ...rest }) => ({
    ...rest,
    createdAt: createdAt.toISOString(),
    user: user ?? { name: 'System', email: '' },
  })) as AuditLog[]

  return <AuditLogsClient initialData={initialData} />
}
