import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PhysicalAccessClient } from './client'
import { cacheLife, cacheTag } from 'next/cache'

export default async function PhysicalAccessPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  async function fetchPhysicalAccess() {
    'use cache'
    cacheLife('minutes')
    cacheTag('physical-access')
    return await prisma.physicalAccess.findMany({ orderBy: { createdAt: 'desc' } })
  }

  const rows = await fetchPhysicalAccess()
  const initialData = rows.map(({ validFrom, validTo, createdAt, updatedAt, requestDate, approvalDate, ...rest }) => ({
    ...rest,
    validFrom: validFrom.toISOString(),
    validTo: validTo?.toISOString() ?? null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    requestDate: requestDate?.toISOString() ?? null,
    approvalDate: approvalDate?.toISOString() ?? null,
  }))

  return <PhysicalAccessClient initialData={initialData} />
}
