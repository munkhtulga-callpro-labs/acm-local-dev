'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Package,
  Search,
  Database,
  Server,
  Cloud,
  Laptop,
  Key,
  Code,
  Shield,
  FolderOpen,
  DoorOpen,
  Wrench,
  Filter,
  ArrowRight
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RequestAccessModal } from '@/components/request-access-modal'

interface CatalogResource {
  id: string
  resourceType: string
  displayName: string
  [key: string]: any
}

export default function RequestAccessPage() {
  const [resources, setResources] = useState<CatalogResource[]>([])
  const [filteredResources, setFilteredResources] = useState<CatalogResource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedResource, setSelectedResource] = useState<CatalogResource | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  useEffect(() => {
    fetchCatalog()
  }, [])

  useEffect(() => {
    filterResources()
  }, [resources, searchTerm, filterType])

  const fetchCatalog = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/resources/catalog')
      if (response.ok) {
        const data = await response.json()
        setResources(data.data || [])
      } else {
        setError('Failed to load resource catalog')
      }
    } catch (error) {
      setError('Error loading resources')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterResources = () => {
    let filtered = resources

    if (filterType !== 'ALL') {
      filtered = filtered.filter(r => r.resourceType === filterType)
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredResources(filtered)
  }

  const handleRequestAccess = (resource: CatalogResource) => {
    setSelectedResource(resource)
    setShowRequestModal(true)
  }

  const handleRequestSubmitted = () => {
    setShowRequestModal(false)
    setSelectedResource(null)
    setSuccess('Access request submitted successfully! You will be notified once reviewed.')
  }

  const getResourceIcon = (type: string) => {
    const iconClass = "h-5 w-5 text-muted-foreground"
    switch (type) {
      case 'DATABASE':
        return <Database className={iconClass} />
      case 'SERVER':
        return <Server className={iconClass} />
      case 'SOFTWARE_LICENSE':
      case 'SAAS_SUBSCRIPTION':
        return <Package className={iconClass} />
      case 'CLOUD_ACCOUNT':
        return <Cloud className={iconClass} />
      case 'DEVICE':
        return <Laptop className={iconClass} />
      case 'INTERNAL_TOOL':
        return <Wrench className={iconClass} />
      case 'VPN_NETWORK_ACCESS':
        return <Shield className={iconClass} />
      case 'CODE_REPOSITORY':
        return <Code className={iconClass} />
      case 'API_KEY':
        return <Key className={iconClass} />
      case 'FILE_STORAGE':
        return <FolderOpen className={iconClass} />
      case 'PHYSICAL_ACCESS':
        return <DoorOpen className={iconClass} />
      default:
        return <Package className={iconClass} />
    }
  }

  const getResourceTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
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
      PHYSICAL_ACCESS: 'bg-amber-50 text-amber-700 border border-amber-200'
    }
    return colors[type] || 'bg-gray-50 text-gray-700 border border-gray-200'
  }

  const getResourceInfo = (resource: CatalogResource) => {
    const info: { label: string; value: string }[] = []

    switch (resource.resourceType) {
      case 'DATABASE':
        if (resource.environment) info.push({ label: 'Environment', value: resource.environment })
        if (resource.host) info.push({ label: 'Host', value: resource.host })
        if (resource.databaseType) info.push({ label: 'Type', value: resource.databaseType })
        break
      case 'SERVER':
        if (resource.environment) info.push({ label: 'Environment', value: resource.environment })
        if (resource.serverType) info.push({ label: 'Type', value: resource.serverType })
        if (resource.ipAddress) info.push({ label: 'IP', value: resource.ipAddress })
        break
      case 'SAAS_SUBSCRIPTION':
        if (resource.category) info.push({ label: 'Category', value: resource.category })
        if (resource.subscriptionPlan) info.push({ label: 'Plan', value: resource.subscriptionPlan })
        if (resource.billingCycle) info.push({ label: 'Billing', value: resource.billingCycle })
        break
      case 'CLOUD_ACCOUNT':
        if (resource.provider) info.push({ label: 'Provider', value: resource.provider })
        if (resource.accountId) info.push({ label: 'Account ID', value: resource.accountId })
        if (resource.region) info.push({ label: 'Region', value: resource.region })
        break
      case 'SOFTWARE_LICENSE':
        if (resource.softwareVendor) info.push({ label: 'Vendor', value: resource.softwareVendor })
        if (resource.licenseType) info.push({ label: 'License Type', value: resource.licenseType })
        if (resource.version) info.push({ label: 'Version', value: resource.version })
        break
      case 'CODE_REPOSITORY':
        if (resource.repositoryUrl) info.push({ label: 'URL', value: resource.repositoryUrl })
        if (resource.programmingLanguage) info.push({ label: 'Language', value: resource.programmingLanguage })
        if (resource.visibility) info.push({ label: 'Visibility', value: resource.visibility })
        break
      case 'DEVICE':
        if (resource.deviceType) info.push({ label: 'Type', value: resource.deviceType })
        if (resource.model) info.push({ label: 'Model', value: resource.model })
        if (resource.serialNumber) info.push({ label: 'Serial', value: resource.serialNumber })
        break
      default:
        if (resource.environment) info.push({ label: 'Environment', value: resource.environment })
        if (resource.host) info.push({ label: 'Host', value: resource.host })
        if (resource.ipAddress) info.push({ label: 'IP', value: resource.ipAddress })
    }

    // Ensure consistent display: always show exactly 3 lines
    while (info.length < 3) {
      info.push({ label: '', value: '' })
    }

    return info.slice(0, 3)
  }

  const resourceTypes = [
    'ALL',
    'DATABASE',
    'SERVER',
    'SOFTWARE_LICENSE',
    'SAAS_SUBSCRIPTION',
    'CLOUD_ACCOUNT',
    'DEVICE',
    'INTERNAL_TOOL',
    'VPN_NETWORK_ACCESS',
    'CODE_REPOSITORY',
    'API_KEY',
    'FILE_STORAGE',
    'PHYSICAL_ACCESS'
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Request Access to Resources</h1>
        <p className="text-muted-foreground mt-2">
          Browse available resources and request access with proper justification
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
              {resourceTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type === 'ALL' ? 'All Resources' : type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredResources.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Resources Found
              </h3>
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
          {filteredResources.map((resource) => (
            <div
              key={`${resource.resourceType}-${resource.id}`}
              onClick={() => handleRequestAccess(resource)}
              className="group relative rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
            >
              {/* Top Section: Icon, Title, and Arrow */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    {getResourceIcon(resource.resourceType)}
                  </div>
                  <h3 className="text-base font-semibold text-foreground truncate">
                    {resource.displayName}
                  </h3>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>

              {/* Badges Section */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className={getResourceTypeBadge(resource.resourceType)}>
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {resource.resourceType.replace(/_/g, ' ')}
                  </span>
                </Badge>
                {resource.environment && (
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border border-slate-200">
                    <span className="text-xs font-medium capitalize">
                      {resource.environment}
                    </span>
                  </Badge>
                )}
              </div>

              {/* Metadata Section */}
              <div className="space-y-1.5 text-sm">
                {getResourceInfo(resource).map((info, index) => (
                  info.label && info.value ? (
                    <div key={index} className="flex items-start text-muted-foreground">
                      <span className="text-xs">{info.label}:</span>
                      <span className="ml-1.5 text-xs font-medium text-foreground truncate">
                        {info.value}
                      </span>
                    </div>
                  ) : (
                    <div key={index} className="h-5">&nbsp;</div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Access Modal */}
      {selectedResource && (
        <RequestAccessModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false)
            setSelectedResource(null)
          }}
          resource={selectedResource}
          onSuccess={handleRequestSubmitted}
        />
      )}
    </div>
  )
}
