import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { cacheLife, cacheTag } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RequestAccessClient } from './client'

async function fetchCatalog() {
  'use cache'
  cacheLife('minutes')
  cacheTag('resource-catalog')
  const [
    databases, servers, softwareLicenses, saasSubscriptions, cloudAccounts,
    devices, internalTools, vpnNetworkAccess, codeRepositories, apiKeys,
    fileStorage, physicalAccess,
  ] = await Promise.all([
    prisma.resourceDatabase.findMany({ where: { isActive: true }, select: { id: true, name: true, host: true, databaseType: true, environment: true } }),
    prisma.resourceServer.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, ipHostname: true, type: true, environment: true } }),
    prisma.softwareLicense.findMany({ where: { status: 'ACTIVE' }, select: { id: true, softwareName: true, vendor: true, licenseType: true, totalSeats: true, assignedSeats: true } }),
    prisma.saaSSubscription.findMany({ where: { status: 'ACTIVE' }, select: { id: true, serviceName: true, category: true, subscriptionPlan: true, totalSeats: true, usedSeats: true } }),
    prisma.cloudAccount.findMany({ where: { status: 'ACTIVE' }, select: { id: true, cloudProvider: true, accountName: true, environment: true, permissionLevel: true } }),
    prisma.resourceDevice.findMany({ where: { status: 'Available' }, select: { id: true, makeModel: true, operatingSystem: true, location: true, assetTag: true } }),
    prisma.internalTool.findMany({ where: { status: 'ACTIVE' }, select: { id: true, toolName: true, url: true, purposeCategory: true, accessLevel: true } }),
    prisma.vPNNetworkAccess.findMany({ where: { status: 'ACTIVE' }, select: { id: true, profileName: true, vpnType: true, accessLevel: true } }),
    prisma.codeRepository.findMany({ where: { status: 'ACTIVE' }, select: { id: true, platform: true, repositoryName: true, organizationTeam: true, accessLevel: true } }),
    prisma.aPIKey.findMany({ where: { status: 'ACTIVE' }, select: { id: true, serviceName: true, keyType: true, scopePermissions: true } }),
    prisma.fileStorage.findMany({ where: { status: 'ACTIVE' }, select: { id: true, storageType: true, pathLocation: true, permissionLevel: true } }),
    prisma.physicalAccess.findMany({ where: { status: 'ACTIVE' }, select: { id: true, location: true, accessType: true, accessSchedule: true } }),
  ])

  return [
    ...databases.map(r => ({ ...r, resourceType: 'DATABASE' as const, displayName: `${r.name} (${r.databaseType})` })),
    ...servers.map(r => ({ ...r, resourceType: 'SERVER' as const, displayName: `${r.name} (${r.ipHostname})` })),
    ...softwareLicenses.map(r => ({ ...r, resourceType: 'SOFTWARE_LICENSE' as const, displayName: `${r.softwareName} by ${r.vendor}` })),
    ...saasSubscriptions.map(r => ({ ...r, resourceType: 'SAAS_SUBSCRIPTION' as const, displayName: r.serviceName })),
    ...cloudAccounts.map(r => ({ ...r, resourceType: 'CLOUD_ACCOUNT' as const, displayName: `${r.cloudProvider} - ${r.accountName}` })),
    ...devices.map(r => ({ ...r, resourceType: 'DEVICE' as const, displayName: r.makeModel })),
    ...internalTools.map(r => ({ ...r, resourceType: 'INTERNAL_TOOL' as const, displayName: r.toolName })),
    ...vpnNetworkAccess.map(r => ({ ...r, resourceType: 'VPN_NETWORK_ACCESS' as const, displayName: r.profileName })),
    ...codeRepositories.map(r => ({ ...r, resourceType: 'CODE_REPOSITORY' as const, displayName: `${r.platform}: ${r.repositoryName}` })),
    ...apiKeys.map(r => ({ ...r, resourceType: 'API_KEY' as const, displayName: r.serviceName })),
    ...fileStorage.map(r => ({ ...r, resourceType: 'FILE_STORAGE' as const, displayName: `${r.storageType}: ${r.pathLocation}` })),
    ...physicalAccess.map(r => ({ ...r, resourceType: 'PHYSICAL_ACCESS' as const, displayName: r.location })),
  ]
}

export default async function RequestAccessPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const catalog = await fetchCatalog()

  return <RequestAccessClient initialData={catalog} />
}
