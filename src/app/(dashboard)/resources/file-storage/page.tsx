import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FileStorageClient } from './client'
import { cacheLife, cacheTag } from 'next/cache'

async function fetchFileStorages() {
  'use cache'
  cacheLife('minutes')
  cacheTag('file-storage')
  return await prisma.fileStorage.findMany({ orderBy: { createdAt: 'desc' } })
}

export default async function FileStoragePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const rows = await fetchFileStorages()
  const initialData = rows.map(({ expiryDate, createdAt, updatedAt, requestDate, approvalDate, ...rest }) => ({
    ...rest,
    expiryDate: expiryDate?.toISOString() ?? null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    requestDate: requestDate?.toISOString() ?? null,
    approvalDate: approvalDate?.toISOString() ?? null,
  }))

  return <FileStorageClient initialData={initialData} />
}
