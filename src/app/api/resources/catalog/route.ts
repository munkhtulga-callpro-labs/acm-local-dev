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

    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('resourceType') // Optional filter

    // Fetch all resource types
    const [
      databases,
      servers,
      softwareLicenses,
      saasSubscriptions,
      cloudAccounts,
      devices,
      internalTools,
      vpnNetworkAccess,
      codeRepositories,
      apiKeys,
      fileStorage,
      physicalAccess
    ] = await Promise.all([
      (!resourceType || resourceType === 'DATABASE')
        ? prisma.resourceDatabase.findMany({ where: { isActive: true }, select: { id: true, name: true, host: true, databaseType: true, environment: true } })
        : [],
      (!resourceType || resourceType === 'SERVER')
        ? prisma.resourceServer.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, ipHostname: true, type: true, environment: true } })
        : [],
      (!resourceType || resourceType === 'SOFTWARE_LICENSE')
        ? prisma.softwareLicense.findMany({ where: { status: 'ACTIVE' }, select: { id: true, softwareName: true, vendor: true, licenseType: true, totalSeats: true, assignedSeats: true } })
        : [],
      (!resourceType || resourceType === 'SAAS_SUBSCRIPTION')
        ? prisma.saaSSubscription.findMany({ where: { status: 'ACTIVE' }, select: { id: true, serviceName: true, category: true, subscriptionPlan: true, totalSeats: true, usedSeats: true } })
        : [],
      (!resourceType || resourceType === 'CLOUD_ACCOUNT')
        ? prisma.cloudAccount.findMany({ where: { status: 'ACTIVE' }, select: { id: true, cloudProvider: true, accountName: true, environment: true, permissionLevel: true } })
        : [],
      (!resourceType || resourceType === 'DEVICE')
        ? prisma.resourceDevice.findMany({ where: { status: 'Available' }, select: { id: true, makeModel: true, operatingSystem: true, location: true, assetTag: true } })
        : [],
      (!resourceType || resourceType === 'INTERNAL_TOOL')
        ? prisma.internalTool.findMany({ where: { status: 'ACTIVE' }, select: { id: true, toolName: true, url: true, purposeCategory: true, accessLevel: true } })
        : [],
      (!resourceType || resourceType === 'VPN_NETWORK_ACCESS')
        ? prisma.vPNNetworkAccess.findMany({ where: { status: 'ACTIVE' }, select: { id: true, profileName: true, vpnType: true, accessLevel: true } })
        : [],
      (!resourceType || resourceType === 'CODE_REPOSITORY')
        ? prisma.codeRepository.findMany({ where: { status: 'ACTIVE' }, select: { id: true, platform: true, repositoryName: true, organizationTeam: true, accessLevel: true } })
        : [],
      (!resourceType || resourceType === 'API_KEY')
        ? prisma.aPIKey.findMany({ where: { status: 'ACTIVE' }, select: { id: true, serviceName: true, keyType: true, scopePermissions: true } })
        : [],
      (!resourceType || resourceType === 'FILE_STORAGE')
        ? prisma.fileStorage.findMany({ where: { status: 'ACTIVE' }, select: { id: true, storageType: true, pathLocation: true, permissionLevel: true } })
        : [],
      (!resourceType || resourceType === 'PHYSICAL_ACCESS')
        ? prisma.physicalAccess.findMany({ where: { status: 'ACTIVE' }, select: { id: true, location: true, accessType: true, accessSchedule: true } })
        : []
    ])

    // Format catalog with resource type
    const catalog = [
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
      ...physicalAccess.map(r => ({ ...r, resourceType: 'PHYSICAL_ACCESS' as const, displayName: r.location }))
    ]

    return NextResponse.json({ data: catalog, total: catalog.length })
  } catch (error) {
    console.error('Error fetching resource catalog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resource catalog' },
      { status: 500 }
    )
  }
}
