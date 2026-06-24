'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Server, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResourceOwnershipSection } from '@/components/resource-ownership-section'

interface ServerResource {
  id?: string
  name: string
  serverType: string
  os: string
  version?: string | null
  ipAddress: string
  hostname?: string | null
  sshPort?: number | null
  rdpPort?: number | null
  cpu?: string | null
  memory?: string | null
  storage?: string | null
  location?: string | null
  dataCenter?: string | null
  owner: string
  environment: string
  accessLevel: string
  description?: string | null

  // ISO 27001 Compliance Fields
  requestedBy?: string | null
  approvedBy?: string | null
  approvalDate?: string | null
  businessJustification?: string | null
  accessRequestTicketId?: string | null
  expiryDate?: string | null
  reviewDate?: string | null

  isActive: boolean
}

interface ResourceOwner {
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface ServerModalProps {
  isOpen: boolean
  onClose: () => void
  server?: ServerResource
  mode: 'view' | 'edit' | 'create'
  onSave: (server: Partial<ServerResource>, owners?: ResourceOwner[]) => Promise<void>
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments?: Array<{ id: string; name: string }>
}

export function ServerModal({
  isOpen,
  onClose,
  server,
  mode,
  onSave,
  employees,
  departments = []
}: ServerModalProps) {
  const t = useTranslations('servers.modal')
  const [formData, setFormData] = useState<Partial<ServerResource>>({
    name: '',
    serverType: 'Virtual',
    os: 'Linux',
    version: '',
    ipAddress: '',
    hostname: '',
    sshPort: 22,
    rdpPort: 3389,
    cpu: '',
    memory: '',
    storage: '',
    location: '',
    dataCenter: '',
    owner: '',
    environment: 'production',
    accessLevel: 'read',
    description: '',
    isActive: true
  })

  const [owners, setOwners] = useState<ResourceOwner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOwners = async () => {
      if (server?.id && mode !== 'create') {
        try {
          const response = await fetch(`/api/resources/owners?resourceType=SERVER&resourceId=${server.id}`)
          if (response.ok) {
            const data = await response.json()
            // Find the MAIN_OWNER and set it as the primary owner
            const mainOwner = data.data?.find((o: any) => o.ownershipType === 'MAIN_OWNER')
            if (mainOwner && mainOwner.ownerEmail) {
              setFormData(prev => ({ ...prev, owner: mainOwner.ownerEmail }))
            }
            // Get additional owners (excluding MAIN_OWNER)
            const additionalOwners = data.data?.filter((o: any) => o.ownershipType !== 'MAIN_OWNER') || []
            setOwners(additionalOwners)
          }
        } catch (error) {
          console.error('Error fetching owners:', error)
        }
      }
    }

    if (server && mode !== 'create') {
      setFormData({
        ...server,
        owner: '', // Will be populated by fetchOwners
      })
      fetchOwners()
    } else if (mode === 'create') {
      setFormData({
        name: '',
        serverType: 'Virtual',
        os: 'Linux',
        version: '',
        ipAddress: '',
        hostname: '',
        sshPort: 22,
        rdpPort: 3389,
        cpu: '',
        memory: '',
        storage: '',
        location: '',
        dataCenter: '',
        owner: '',
        environment: 'production',
        accessLevel: 'read',
        description: '',
        isActive: true
      })
      setOwners([])
    }
    setErrors({})
  }, [server, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) newErrors.name = t('errors.nameRequired')
    if (!formData.serverType) newErrors.serverType = t('errors.typeRequired')
    if (!formData.os) newErrors.os = t('errors.osRequired')
    if (!formData.ipAddress?.trim()) newErrors.ipAddress = t('errors.ipRequired')
    if (!formData.owner?.trim()) newErrors.owner = t('errors.ownerRequired')
    if (!formData.environment) newErrors.environment = t('errors.environmentRequired')
    if (!formData.accessLevel) newErrors.accessLevel = t('errors.accessLevelRequired')

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'view') {
      onClose()
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await onSave(formData, owners)
      onClose()
    } catch (error) {
      console.error('Error saving server:', error)
      setErrors({ submit: t('errors.saveFailed') })
    } finally {
      setIsLoading(false)
    }
  }

  const isViewMode = mode === 'view'

  const serverTypes = ['Physical', 'Virtual', 'Cloud', 'Container']
  const operatingSystems = ['Linux', 'Windows', 'MacOS', 'Unix', 'Other']
  const environments = ['development', 'staging', 'production', 'testing']
  const accessLevels = ['read', 'write', 'admin', 'full']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" />
            {mode === 'view' && t('titleView')}
            {mode === 'edit' && t('titleEdit')}
            {mode === 'create' && t('titleCreate')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && t('descriptionView')}
            {mode === 'edit' && t('descriptionEdit')}
            {mode === 'create' && t('descriptionCreate')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Server Configuration Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Server className="h-4 w-4" />
              {t('serverConfig')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  {t('serverName')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
                  placeholder="prod-web-server-01"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serverType" className="text-sm font-medium">
                  {t('serverType')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.serverType}
                  onValueChange={(value) => setFormData({ ...formData, serverType: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.serverType && "border-destructive")}>
                    <SelectValue placeholder={t('selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {serverTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.serverType && <p className="text-xs text-destructive">{errors.serverType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="os" className="text-sm font-medium">
                  {t('operatingSystem')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.os}
                  onValueChange={(value) => setFormData({ ...formData, os: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.os && "border-destructive")}>
                    <SelectValue placeholder={t('selectOs')} />
                  </SelectTrigger>
                  <SelectContent>
                    {operatingSystems.map((os) => (
                      <SelectItem key={os} value={os}>{os}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.os && <p className="text-xs text-destructive">{errors.os}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="version" className="text-sm font-medium">
                  {t('osVersion')}
                </Label>
                <Input
                  id="version"
                  value={formData.version || ''}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  disabled={isViewMode}
                  placeholder="Ubuntu 22.04 LTS"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment" className="text-sm font-medium">
                  {t('environment')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value) => setFormData({ ...formData, environment: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.environment && "border-destructive")}>
                    <SelectValue placeholder={t('selectEnvironment')} />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((env) => (
                      <SelectItem key={env} value={env}>
                        {env.charAt(0).toUpperCase() + env.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.environment && <p className="text-xs text-destructive">{errors.environment}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipAddress" className="text-sm font-medium">
                  {t('ipAddress')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="ipAddress"
                  value={formData.ipAddress || ''}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.ipAddress && "border-destructive focus-visible:ring-destructive")}
                  placeholder="192.168.1.100"
                />
                {errors.ipAddress && <p className="text-xs text-destructive">{errors.ipAddress}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostname" className="text-sm font-medium">
                  {t('hostname')}
                </Label>
                <Input
                  id="hostname"
                  value={formData.hostname || ''}
                  onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                  disabled={isViewMode}
                  placeholder="server.example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sshPort" className="text-sm font-medium">
                  {t('sshPort')}
                </Label>
                <Input
                  id="sshPort"
                  type="number"
                  value={formData.sshPort || ''}
                  onChange={(e) => setFormData({ ...formData, sshPort: parseInt(e.target.value) || null })}
                  disabled={isViewMode}
                  placeholder="22"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rdpPort" className="text-sm font-medium">
                  {t('rdpPort')}
                </Label>
                <Input
                  id="rdpPort"
                  type="number"
                  value={formData.rdpPort || ''}
                  onChange={(e) => setFormData({ ...formData, rdpPort: parseInt(e.target.value) || null })}
                  disabled={isViewMode}
                  placeholder="3389"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpu" className="text-sm font-medium">
                  {t('cpu')}
                </Label>
                <Input
                  id="cpu"
                  value={formData.cpu || ''}
                  onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                  disabled={isViewMode}
                  placeholder="8 cores"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memory" className="text-sm font-medium">
                  {t('memory')}
                </Label>
                <Input
                  id="memory"
                  value={formData.memory || ''}
                  onChange={(e) => setFormData({ ...formData, memory: e.target.value })}
                  disabled={isViewMode}
                  placeholder="16 GB"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage" className="text-sm font-medium">
                  {t('storage')}
                </Label>
                <Input
                  id="storage"
                  value={formData.storage || ''}
                  onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                  disabled={isViewMode}
                  placeholder="500 GB SSD"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  {t('location')}
                </Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isViewMode}
                  placeholder="US-East"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataCenter" className="text-sm font-medium">
                  {t('dataCenter')}
                </Label>
                <Input
                  id="dataCenter"
                  value={formData.dataCenter || ''}
                  onChange={(e) => setFormData({ ...formData, dataCenter: e.target.value })}
                  disabled={isViewMode}
                  placeholder="AWS us-east-1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessLevel" className="text-sm font-medium">
                  {t('accessLevel')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.accessLevel}
                  onValueChange={(value) => setFormData({ ...formData, accessLevel: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.accessLevel && "border-destructive")}>
                    <SelectValue placeholder={t('selectAccessLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accessLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.accessLevel && <p className="text-xs text-destructive">{errors.accessLevel}</p>}
              </div>
            </div>
          </div>

          {/* Resource Ownership Section */}
          <ResourceOwnershipSection
            employees={employees}
            departments={departments}
            owner={formData.owner}
            onOwnerChange={(value) => setFormData({ ...formData, owner: value })}
            ownerError={errors.owner}
            owners={owners}
            onOwnersChange={setOwners}
            disabled={isViewMode}
          />

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                {t('description')}
              </Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isViewMode}
                className="min-h-[80px] resize-none"
                placeholder="Additional notes about this server resource..."
              />
            </div>

            {!isViewMode && (
              <div className="space-y-2">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  {t('activeStatus')}
                </Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.isActive ? t('active') : t('inactive')}
                  </Label>
                </div>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="rounded-md bg-destructive/10 p-4 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{errors.submit}</p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="min-w-24"
            >
              {isViewMode ? t('close') : t('cancel')}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-28"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? t('updateServer') : t('addServer')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
