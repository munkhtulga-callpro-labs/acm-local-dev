'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Shield, Network, FileText, Calendar, Key, User, Loader2 } from 'lucide-react'
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

    if (!formData.profileName?.trim()) newErrors.profileName = 'Profile name is required'
    if (!formData.vpnType) newErrors.vpnType = 'VPN type is required'
    if (!formData.networkSegments?.trim()) newErrors.networkSegments = 'Network segments is required'
    if (!formData.accessLevel) newErrors.accessLevel = 'Access level is required'
    if (!formData.validFrom) newErrors.validFrom = 'Valid from date is required'
    if (!formData.owner?.trim()) newErrors.owner = 'Primary owner is required'

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
      setErrors({ submit: 'Failed to save VPN/Network Access. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const isViewMode = mode === 'view'

  const vpnTypes = ['Site-to-Site', 'Remote Access', 'Client VPN', 'SSL VPN', 'IPSec VPN', 'MPLS', 'Other']
  const accessLevels = ['Standard', 'Elevated', 'Privileged', 'Admin', 'Full Access']
  const statuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'EXPIRED', 'SUSPENDED']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {mode === 'view' && 'VPN/Network Access Details'}
            {mode === 'edit' && 'Edit VPN/Network Access'}
            {mode === 'create' && 'Add New VPN/Network Access'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this VPN/Network Access resource.'}
            {mode === 'edit' && 'Update VPN/Network Access information. Fields marked with * are required.'}
            {mode === 'create' && 'Register a new VPN/Network Access resource. Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* VPN Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4" />
              VPN Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="profileName" className="text-sm font-medium">
                  Profile/Connection Name {!isViewMode && <span className="text-destructive">*</span>}
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
                  VPN Type {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.vpnType}
                  onValueChange={(value) => setFormData({ ...formData, vpnType: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.vpnType && "border-destructive")}>
                    <SelectValue placeholder="Select VPN type" />
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
                  Access Level {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.accessLevel}
                  onValueChange={(value) => setFormData({ ...formData, accessLevel: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.accessLevel && "border-destructive")}>
                    <SelectValue placeholder="Select access level" />
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
                  Status {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium">
                  Assigned To
                </Label>
                <Select
                  value={formData.assignedTo || ''}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select user" />
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
                  Valid From {!isViewMode && <span className="text-destructive">*</span>}
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
                  Valid To
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
              Network Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="networkSegments" className="text-sm font-medium">
                  Network Segments {!isViewMode && <span className="text-destructive">*</span>}
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
                <p className="text-xs text-muted-foreground">Comma-separated network ranges or segments</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipWhitelist" className="text-sm font-medium">
                  IP Whitelist
                </Label>
                <Input
                  id="ipWhitelist"
                  value={formData.ipWhitelist || ''}
                  onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
                  disabled={isViewMode}
                  placeholder="203.0.113.0/24, 198.51.100.0/24"
                />
                <p className="text-xs text-muted-foreground">Comma-separated allowed IP addresses/ranges</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceRestrictions" className="text-sm font-medium">
                  Device Restrictions
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
                  Split Tunnel
                </Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="splitTunnel"
                    checked={formData.splitTunnel || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, splitTunnel: checked })}
                    disabled={isViewMode}
                  />
                  <Label htmlFor="splitTunnel" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.splitTunnel ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
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
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-28"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? 'Update VPN Access' : 'Add VPN Access'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
