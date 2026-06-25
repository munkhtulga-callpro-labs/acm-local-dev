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
import { Shield, Network, Calendar, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResourceOwnershipSection } from '@/components/resource-ownership-section'

interface VPNNetworkResource {
  id?: string
  profileName: string
  vpnType: string
  networkSegments: string
  accessLevel: string
  deviceRestrictions?: string | null
  assignedTo?: string | null
  validFrom: string
  validTo?: string | null
  status: string
  notes?: string | null
  ipWhitelist?: string | null
  splitTunnel: boolean
  owner?: string | null

  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

interface ResourceOwner {
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface VPNNetworkModalProps {
  isOpen: boolean
  onClose: () => void
  vpnNetwork?: VPNNetworkResource
  mode: 'view' | 'edit' | 'create'
  onSave: (vpnNetwork: Partial<VPNNetworkResource>, owners: ResourceOwner[]) => Promise<void>
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments: Array<{ id: string; name: string }>
}

export function VPNNetworkModal({
  isOpen,
  onClose,
  vpnNetwork,
  mode,
  onSave,
  employees,
  departments
}: VPNNetworkModalProps) {
  const t = useTranslations('vpnNetwork.modal')
  const [formData, setFormData] = useState<Partial<VPNNetworkResource>>({
    profileName: '',
    vpnType: 'Site-to-Site',
    networkSegments: '',
    accessLevel: 'Standard',
    deviceRestrictions: '',
    assignedTo: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    status: 'ACTIVE',
    notes: '',
    ipWhitelist: '',
    splitTunnel: false,
    owner: '',
    isActive: true
  })

  const [owners, setOwners] = useState<ResourceOwner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOwners = async () => {
      if (vpnNetwork?.id && mode !== 'create') {
        try {
          const response = await fetch(`/api/resources/owners?resourceType=VPN_NETWORK_ACCESS&resourceId=${vpnNetwork.id}`)
          if (response.ok) {
            const data = await response.json()
            const mainOwner = data.data?.find((o: any) => o.ownershipType === 'MAIN_OWNER')
            if (mainOwner && mainOwner.ownerEmail) {
              setFormData(prev => ({ ...prev, owner: mainOwner.ownerEmail }))
            }
            const additionalOwners = data.data?.filter((o: any) => o.ownershipType !== 'MAIN_OWNER') || []
            setOwners(additionalOwners)
          }
        } catch (error) {
          console.error('Error fetching owners:', error)
        }
      }
    }

    if (vpnNetwork && mode !== 'create') {
      setFormData({
        ...vpnNetwork,
        owner: '',
        validFrom: vpnNetwork.validFrom ? new Date(vpnNetwork.validFrom).toISOString().split('T')[0] : '',
        validTo: vpnNetwork.validTo ? new Date(vpnNetwork.validTo).toISOString().split('T')[0] : '',
      })
      fetchOwners()
    } else if (mode === 'create') {
      setOwners([])
      setFormData({
        profileName: '',
        vpnType: 'Site-to-Site',
        networkSegments: '',
        accessLevel: 'Standard',
        deviceRestrictions: '',
        assignedTo: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
        status: 'ACTIVE',
        notes: '',
        ipWhitelist: '',
        splitTunnel: false,
        owner: '',
        isActive: true
      })
    }
    setErrors({})
  }, [vpnNetwork, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.profileName?.trim()) newErrors.profileName = t('errors.profileNameRequired')
    if (!formData.vpnType) newErrors.vpnType = t('errors.vpnTypeRequired')
    if (!formData.networkSegments?.trim()) newErrors.networkSegments = t('errors.networkSegmentsRequired')
    if (!formData.accessLevel) newErrors.accessLevel = t('errors.accessLevelRequired')
    if (!formData.validFrom) newErrors.validFrom = t('errors.validFromRequired')
    if (!formData.owner?.trim()) newErrors.owner = t('errors.ownerRequired')

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
      console.error('Error saving VPN/Network Access:', error)
      setErrors({ submit: t('errors.saveFailed') })
    } finally {
      setIsLoading(false)
    }
  }

  const isViewMode = mode === 'view'

  const vpnTypes = ['Site-to-Site', 'Remote Access', 'Client VPN', 'SSL VPN', 'IPSec VPN', 'MPLS', 'Other']
  const accessLevels = ['Standard', 'Elevated', 'Privileged', 'Admin', 'Full Access']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
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
          {/* VPN Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4" />
              {t('vpnInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="profileName" className="text-sm font-medium">
                  {t('profileName')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="profileName"
                  value={formData.profileName || ''}
                  onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.profileName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="corp-vpn-profile"
                />
                {errors.profileName && <p className="text-xs text-destructive">{errors.profileName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vpnType" className="text-sm font-medium">
                  {t('vpnType')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.vpnType}
                  onValueChange={(value) => setFormData({ ...formData, vpnType: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.vpnType && "border-destructive")}>
                    <SelectValue placeholder={t('selectVpnType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {vpnTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vpnType && <p className="text-xs text-destructive">{errors.vpnType}</p>}
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
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.accessLevel && <p className="text-xs text-destructive">{errors.accessLevel}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  {t('status')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t('selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('statusActive')}</SelectItem>
                    <SelectItem value="INACTIVE">{t('statusInactive')}</SelectItem>
                    <SelectItem value="PENDING">{t('statusPending')}</SelectItem>
                    <SelectItem value="EXPIRED">{t('statusExpired')}</SelectItem>
                    <SelectItem value="SUSPENDED">{t('statusSuspended')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium">
                  {t('assignedTo')}
                </Label>
                <Select
                  value={formData.assignedTo || ''}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t('selectUser')} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.email}>
                        {emp.firstName} {emp.lastName} ({emp.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validFrom" className="text-sm font-medium">
                  {t('validFrom')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom || ''}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    disabled={isViewMode}
                    className={cn("pl-10", errors.validFrom && "border-destructive focus-visible:ring-destructive")}
                  />
                </div>
                {errors.validFrom && <p className="text-xs text-destructive">{errors.validFrom}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo" className="text-sm font-medium">
                  {t('validTo')}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="validTo"
                    type="date"
                    value={formData.validTo || ''}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Network Configuration Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Network className="h-4 w-4" />
              {t('networkConfig')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="networkSegments" className="text-sm font-medium">
                  {t('networkSegments')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="networkSegments"
                  value={formData.networkSegments || ''}
                  onChange={(e) => setFormData({ ...formData, networkSegments: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.networkSegments && "border-destructive focus-visible:ring-destructive")}
                  placeholder="10.0.0.0/8, 192.168.0.0/16"
                />
                {errors.networkSegments && <p className="text-xs text-destructive">{errors.networkSegments}</p>}
                <p className="text-xs text-muted-foreground">{t('networkSegmentsHint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipWhitelist" className="text-sm font-medium">
                  {t('ipWhitelist')}
                </Label>
                <Input
                  id="ipWhitelist"
                  value={formData.ipWhitelist || ''}
                  onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
                  disabled={isViewMode}
                  placeholder="203.0.113.0/24, 198.51.100.0/24"
                />
                <p className="text-xs text-muted-foreground">{t('ipWhitelistHint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceRestrictions" className="text-sm font-medium">
                  {t('deviceRestrictions')}
                </Label>
                <Input
                  id="deviceRestrictions"
                  value={formData.deviceRestrictions || ''}
                  onChange={(e) => setFormData({ ...formData, deviceRestrictions: e.target.value })}
                  disabled={isViewMode}
                  placeholder="Corporate laptops only, Managed devices"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="splitTunnel" className="text-sm font-medium">
                  {t('splitTunnel')}
                </Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="splitTunnel"
                    checked={formData.splitTunnel || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, splitTunnel: checked })}
                    disabled={isViewMode}
                  />
                  <Label htmlFor="splitTunnel" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.splitTunnel ? t('splitTunnelEnabled') : t('splitTunnelDisabled')}
                  </Label>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  {t('notes')}
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isViewMode}
                  className="min-h-[80px] resize-none"
                  placeholder="Additional configuration notes..."
                />
              </div>
            </div>
          </div>

          {/* Resource Ownership Section */}
          <ResourceOwnershipSection
            employees={employees}
            departments={departments}
            owner={formData.owner || undefined}
            onOwnerChange={(value) => setFormData({ ...formData, owner: value })}
            ownerError={errors.owner}
            owners={owners}
            onOwnersChange={setOwners}
            disabled={isViewMode}
          />

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
                {mode === 'edit' ? t('updateAccess') : t('addAccess')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
