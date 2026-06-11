import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { APIKeysClient } from './client'

const getApiKeys = unstable_cache(
  async () => {
    const rows = await prisma.aPIKey.findMany({ orderBy: { createdDate: 'desc' } })
    return rows.map(({ apiKeyToken: _token, expiryDate, createdDate, requestDate, approvalDate, updatedAt, ...rest }) => ({
      ...rest,
      expiryDate: expiryDate?.toISOString() ?? null,
      createdDate: createdDate.toISOString(),
      requestDate: requestDate?.toISOString() ?? null,
      approvalDate: approvalDate?.toISOString() ?? null,
      updatedAt: updatedAt.toISOString(),
    }))
  },
  ['api-keys'],
  { revalidate: 600, tags: ['api-keys'] }
)

export default async function APIKeysPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const initialData = await getApiKeys()
  return <APIKeysClient initialData={initialData} />
}
