import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type ApprovalRequest } from '@/components/approvals-data-table'
import { ApprovalsClient } from './client'

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login')

  const rows = await prisma.resourceAccessRequest.findMany({
    where: {
      approvals: {
        some: {
          approverEmail: session.user.email,
          status: 'PENDING',
        },
      },
      status: 'PENDING',
    },
    include: {
      approvals: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const initialData = rows.map(({
    requestedAt, validFrom, validTo,
    createdAt: _c, updatedAt: _u, accessDetails: _ad,
    approvals,
    ...rest
  }) => ({
    ...rest,
    requestedAt: requestedAt.toISOString(),
    validFrom: validFrom?.toISOString() ?? null,
    validTo: validTo?.toISOString() ?? null,
    approvals: approvals.map(({
      decidedAt, createdAt: _ac, updatedAt: _au,
      ...a
    }) => ({
      ...a,
      decidedAt: decidedAt?.toISOString() ?? null,
    })),
  }))

  return <ApprovalsClient initialData={initialData as ApprovalRequest[]} />
}
