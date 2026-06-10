'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Cloud, DollarSign, Shield, FileText, Calendar, Key, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResourceOwnershipSection } from '@/components/resource-ownership-section'

interface CloudAccountResource {
  id?: string
  cloudProvider: string
  accountName: string
  accountId?: string | null
  environment: string
  accessType: string
  permissionLevel: string
  regionAccess?: string | null
  mfaRequired: boolean
  owner: string
  ownerDepartment?: string | null
  status: string
  notes?: string | null
  costCenter?: string | null
  servicesAccessible?: string | null
}

interface ResourceOwner {
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface CloudAccountModalProps {
  isOpen: boolean
  onClose: () => void
  cloudAccount?: CloudAccountResource
  mode: 'view' | 'edit' | 'create'
  onSave: (cloudAccount: Partial<CloudAccountResource>, owners?: ResourceOwner[]) => Promise<void>
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments?: Array<{ id: string; name: string }>
}

export function CloudAccountModal({
  isOpen,
  onClose,
  cloudAccount,
  mode,
  onSave,
  employees,
  departments = []
}: CloudAccountModalProps) {
  const [formData, setFormData] = useState<Partial<CloudAccountResource>>({
    cloudProvider: 'AWS',
    accountName: '',
    accountId: '',
    environment: 'production',
    accessType: 'Console',
    permissionLevel: 'read',
    regionAccess: '',
    mfaRequired: true,
    owner: '',
    ownerDepartment: '',
    status: 'ACTIVE',
    notes: '',
    costCenter: '',
    servicesAccessible: ''
  })

  const [owners, setOwners] = useState<ResourceOwner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOwners = async () => {
      if (cloudAccount?.id && mode !== 'create') {
        try {
          const response = await fetch(`/api/resources/owners?resourceType=CLOUD_ACCOUNT&resourceId=${cloudAccount.id}`)
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

    if (cloudAccount && mode !== 'create') {
      setFormData({
        ...cloudAccount,
        owner: '', // Will be populated by fetchOwners
      })
      fetchOwners()
    } else if (mode === 'create') {
      setFormData({
        cloudProvider: 'AWS',
        accountName: '',
        accountId: '',
        environment: 'production',
        accessType: 'Console',
        permissionLevel: 'read',
        regionAccess: 'us-east-1',
        mfaRequired: true,
        owner: '',
        ownerDepartment: '',
        status: 'ACTIVE',
        notes: '',
        costCenter: '',
        servicesAccessible: ''
      })
      setOwners([])
    }
    setErrors({})
  }, [cloudAccount, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.cloudProvider) newErrors.cloudProvider = 'Cloud provider is required'
    if (!formData.accountName?.trim()) newErrors.accountName = 'Account name is required'
    if (!formData.environment) newErrors.environment = 'Environment is required'
    if (!formData.accessType) newErrors.accessType = 'Access type is required'
    if (!formData.permissionLevel) newErrors.permissionLevel = 'Permission level is required'

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
      console.error('Error saving cloud account:', error)
      setErrors({ submit: 'Failed to save cloud account. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const isViewMode = mode === 'view'

  const cloudProviders = ['AWS', 'Azure', 'GCP', 'Oracle Cloud', 'IBM Cloud', 'Alibaba Cloud', 'Other']
  const environments = ['development', 'staging', 'production', 'testing']
  const accessTypes = ['Console', 'CLI', 'API', 'SDK', 'All']
  const permissionLevels = ['read', 'write', 'admin', 'full', 'custom']

  // Provider-specific default regions
  const defaultRegions: Record<string, string> = {
    'AWS': 'us-east-1',
    'Azure': 'eastus',
    'GCP': 'us-central1',
    'Oracle Cloud': 'us-ashburn-1',
    'IBM Cloud': 'us-south',
    'Alibaba Cloud': 'cn-hangzhou',
    'Other': ''
  }

  const handleProviderChange = (value: string) => {
    setFormData({
      ...formData,
      cloudProvider: value,
      regionAccess: defaultRegions[value] || ''
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" />
            {mode === 'view' && 'Cloud Account Details'}
            {mode === 'edit' && 'Edit Cloud Account'}
            {mode === 'create' && 'Add New Cloud Account'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this cloud account.'}
            {mode === 'edit' && 'Update cloud account information. Fields marked with * are required for ISO 27001 compliance.'}
            {mode === 'create' && 'Register a new cloud account. Fields marked with * are required for ISO 27001 compliance.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Account Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Cloud className="h-4 w-4" />
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cloudProvider" className="text-sm font-medium">
                  Cloud Provider {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.cloudProvider}
                  onValueChange={handleProviderChange}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.cloudProvider && "border-destructive")}>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {cloudProviders.map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cloudProvider && <p className="text-xs text-destructive">{errors.cloudProvider}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-sm font-medium">
                  Account Name {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="accountName"
                  value={formData.accountName || ''}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.accountName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="production-aws-account"
                />
                {errors.accountName && <p className="text-xs text-destructive">{errors.accountName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountId" className="text-sm font-medium">
                  Account ID
                </Label>
                <Input
                  id="accountId"
                  value={formData.accountId || ''}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  disabled={isViewMode}
                  placeholder="123456789012"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment" className="text-sm font-medium">
                  Environment {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value) => setFormData({ ...formData, environment: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.environment && "border-destructive")}>
                    <SelectValue placeholder="Select environment" />
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
                <Label htmlFor="accessType" className="text-sm font-medium">
                  Access Type {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.accessType}
                  onValueChange={(value) => setFormData({ ...formData, accessType: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.accessType && "border-destructive")}>
                    <SelectValue placeholder="Select access type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.accessType && <p className="text-xs text-destructive">{errors.accessType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="permissionLevel" className="text-sm font-medium">
                  Permission Level {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.permissionLevel}
                  onValueChange={(value) => setFormData({ ...formData, permissionLevel: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.permissionLevel && "border-destructive")}>
                    <SelectValue placeholder="Select permission level" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.permissionLevel && <p className="text-xs text-destructive">{errors.permissionLevel}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="regionAccess" className="text-sm font-medium">
                  Region Access
                </Label>
                <Input
                  id="regionAccess"
                  value={formData.regionAccess || ''}
                  onChange={(e) => setFormData({ ...formData, regionAccess: e.target.value })}
                  disabled={isViewMode}
                  placeholder="us-east-1"
                />
              </div>
            </div>
          </div>

          {/* Security & Cost Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4" />
              Security & Cost
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mfaRequired" className="text-sm font-medium">
                  MFA Required
                </Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="mfaRequired"
                    checked={formData.mfaRequired || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, mfaRequired: checked })}
                    disabled={isViewMode}
                  />
                  <Label htmlFor="mfaRequired" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.mfaRequired ? 'MFA Enabled' : 'MFA Disabled'}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Account Status
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
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costCenter" className="text-sm font-medium">
                  Cost Center
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="costCenter"
                    value={formData.costCenter || ''}
                    onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                    placeholder="CC-1234"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="servicesAccessible" className="text-sm font-medium">
                  Services Accessible
                </Label>
                <Input
                  id="servicesAccessible"
                  value={formData.servicesAccessible || ''}
                  onChange={(e) => setFormData({ ...formData, servicesAccessible: e.target.value })}
                  disabled={isViewMode}
                  placeholder="EC2, S3, RDS, Lambda"
                />
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
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isViewMode}
                className="min-h-[80px] resize-none"
                placeholder="Additional notes about this cloud account..."
              />
            </div>
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
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-28"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? 'Update Cloud Account' : 'Add Cloud Account'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
