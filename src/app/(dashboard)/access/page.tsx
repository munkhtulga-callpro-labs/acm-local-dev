import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AccessClient } from './client'

export default async function AccessControlPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const rows = await prisma.resourceAssignment.findMany({
    orderBy: { grantedAt: 'desc' },
  })

  const initialData = rows.map(({ grantedAt, validFrom, validTo, ...rest }) => ({
    ...rest,
    grantedAt: grantedAt.toISOString(),
    validFrom: validFrom.toISOString(),
    validTo: validTo?.toISOString() ?? null,
  }))

  return <AccessClient initialData={initialData} />
}
