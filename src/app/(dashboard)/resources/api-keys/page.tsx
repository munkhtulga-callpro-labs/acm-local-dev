import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { APIKeysClient } from './client'
import { cacheLife, cacheTag } from 'next/cache'
import { createApiKey, updateApiKey, deleteApiKey, getApiKeyToken } from '@/lib/actions/api-keys'

export default async function APIKeysPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  async function fetchApiKeys() {
    'use cache'
    cacheLife('minutes')
    cacheTag('api-keys');
    return await prisma.aPIKey.findMany({ orderBy: { createdDate: 'desc' } })
  }

  const rows = await fetchApiKeys();
  const initialData = rows.map(({ apiKeyToken: _token, expiryDate, createdDate, requestDate, approvalDate, updatedAt, ...rest }) => ({
    ...rest,
    expiryDate: expiryDate?.toISOString() ?? null,
    createdDate: createdDate.toISOString(),
    requestDate: requestDate?.toISOString() ?? null,
    approvalDate: approvalDate?.toISOString() ?? null,
    updatedAt: updatedAt.toISOString(),
  }))

  return (
    <APIKeysClient
      initialData={initialData}
      onCreateApiKey={createApiKey}
      onUpdateApiKey={updateApiKey}
      onDeleteApiKey={deleteApiKey}
      onGetApiKeyToken={getApiKeyToken}
    />
  )
}
