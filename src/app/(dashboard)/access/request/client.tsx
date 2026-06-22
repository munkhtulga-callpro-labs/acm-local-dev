'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Package, Search, Database, Server, Cloud, Laptop, Key,
  Code, Shield, FolderOpen, DoorOpen, Wrench, Filter, ArrowRight,
} from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { RequestAccessModal } from '@/components/request-access-modal'

type CatalogResource = {
  id: string
  resourceType: string
  displayName: string
  [key: string]: unknown
}

interface RequestAccessClientProps {
  initialData: CatalogResource[]
}

const RESOURCE_TYPES = [
  'ALL', 'DATABASE', 'SERVER', 'SOFTWARE_LICENSE', 'SAAS_SUBSCRIPTION',
  'CLOUD_ACCOUNT', 'DEVICE', 'INTERNAL_TOOL', 'VPN_NETWORK_ACCESS',
  'CODE_REPOSITORY', 'API_KEY', 'FILE_STORAGE', 'PHYSICAL_ACCESS',
]

function getResourceIcon(type: string) {
  const cls = 'h-5 w-5 text-muted-foreground'
  switch (type) {
    case 'DATABASE': return <Database className={cls} />
    case 'SERVER': return <Server className={cls} />
    case 'SOFTWARE_LICENSE':
    case 'SAAS_SUBSCRIPTION': return <Package className={cls} />
    case 'CLOUD_ACCOUNT': return <Cloud className={cls} />
    case 'DEVICE': return <Laptop className={cls} />
    case 'INTERNAL_TOOL': return <Wrench className={cls} />
    case 'VPN_NETWORK_ACCESS': return <Shield className={cls} />
    case 'CODE_REPOSITORY': return <Code className={cls} />
    case 'API_KEY': return <Key className={cls} />
    case 'FILE_STORAGE': return <FolderOpen className={cls} />
    case 'PHYSICAL_ACCESS': return <DoorOpen className={cls} />
    default: return <Package className={cls} />
  }
}

function getTypeBadgeClass(type: string) {
  const map: Record<string, string> = {
    DATABASE: 'bg-blue-50 text-blue-700 border border-blue-200',
    SERVER: 'bg-purple-50 text-purple-700 border border-purple-200',
    SOFTWARE_LICENSE: 'bg-green-50 text-green-700 border border-green-200',
    SAAS_SUBSCRIPTION: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    CLOUD_ACCOUNT: 'bg-orange-50 text-orange-700 border border-orange-200',
    DEVICE: 'bg-pink-50 text-pink-700 border border-pink-200',
    INTERNAL_TOOL: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    VPN_NETWORK_ACCESS: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    CODE_REPOSITORY: 'bg-red-50 text-red-700 border border-red-200',
    API_KEY: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    FILE_STORAGE: 'bg-lime-50 text-lime-700 border border-lime-200',
    PHYSICAL_ACCESS: 'bg-amber-50 text-amber-700 border border-amber-200',
  }
  return map[type] || 'bg-gray-50 text-gray-700 border border-gray-200'
}

function getResourceInfo(resource: CatalogResource) {
  const info: { label: string; value: string }[] = []
  switch (resource.resourceType) {
    case 'DATABASE':
      if (resource.environment) info.push({ label: 'Environment', value: resource.environment as string })
      if (resource.host) info.push({ label: 'Host', value: resource.host as string })
      if (resource.databaseType) info.push({ label: 'Type', value: resource.databaseType as string })
      break
    case 'SERVER':
      if (resource.environment) info.push({ label: 'Environment', value: resource.environment as string })
      if (resource.type) info.push({ label: 'Type', value: resource.type as string })
      if (resource.ipHostname) info.push({ label: 'IP', value: resource.ipHostname as string })
      break
    case 'SAAS_SUBSCRIPTION':
      if (resource.category) info.push({ label: 'Category', value: resource.category as string })
      if (resource.subscriptionPlan) info.push({ label: 'Plan', value: resource.subscriptionPlan as string })
      break
    case 'CLOUD_ACCOUNT':
      if (resource.cloudProvider) info.push({ label: 'Provider', value: resource.cloudProvider as string })
      if (resource.environment) info.push({ label: 'Environment', value: resource.environment as string })
      break
    case 'SOFTWARE_LICENSE':
      if (resource.vendor) info.push({ label: 'Vendor', value: resource.vendor as string })
      if (resource.licenseType) info.push({ label: 'License Type', value: resource.licenseType as string })
      break
    case 'CODE_REPOSITORY':
      if (resource.platform) info.push({ label: 'Platform', value: resource.platform as string })
      if (resource.organizationTeam) info.push({ label: 'Team', value: resource.organizationTeam as string })
      break
    case 'DEVICE':
      if (resource.operatingSystem) info.push({ label: 'OS', value: resource.operatingSystem as string })
      if (resource.location) info.push({ label: 'Location', value: resource.location as string })
      break
    default:
      if (resource.environment) info.push({ label: 'Environment', value: resource.environment as string })
      break
  }
  while (info.length < 3) info.push({ label: '', value: '' })
  return info.slice(0, 3)
}

export function RequestAccessClient({ initialData }: RequestAccessClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [selectedResource, setSelectedResource] = useState<CatalogResource | null>(null)

  const filtered = useMemo(() => {
    return initialData.filter(r => {
      const matchesType = filterType === 'ALL' || r.resourceType === filterType
      const matchesSearch = !searchTerm || r.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [initialData, filterType, searchTerm])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Request Access to Resources</h1>
        <p className="text-muted-foreground mt-2">
          Browse available resources and request access with proper justification
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type === 'ALL' ? 'All Resources' : type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Resources Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || filterType !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'No resources are available in the catalog yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((resource) => (
            <div
              key={`${resource.resourceType}-${resource.id}`}
              onClick={() => setSelectedResource(resource)}
              className="group relative rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    {getResourceIcon(resource.resourceType)}
                  </div>
                  <h3 className="text-base font-semibold text-foreground truncate">{resource.displayName}</h3>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className={getTypeBadgeClass(resource.resourceType)}>
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {resource.resourceType.replace(/_/g, ' ')}
                  </span>
                </Badge>
                {!!resource.environment && (
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border border-slate-200">
                    <span className="text-xs font-medium capitalize">{resource.environment as string}</span>
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                {getResourceInfo(resource).map((info, i) => (
                  info.label && info.value ? (
                    <div key={i} className="flex items-start text-muted-foreground">
                      <span className="text-xs">{info.label}:</span>
                      <span className="ml-1.5 text-xs font-medium text-foreground truncate">{info.value}</span>
                    </div>
                  ) : (
                    <div key={i} className="h-5" />
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedResource && (
        <RequestAccessModal
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
          resource={selectedResource as { id: string; displayName: string; resourceType: string }}
          onSuccess={() => {
            setSelectedResource(null)
            toast.success('Access request submitted successfully')
          }}
        />
      )}
    </div>
  )
}
