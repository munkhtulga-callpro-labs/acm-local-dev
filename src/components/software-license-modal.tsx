'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Key, Users, FileText, Calendar, Loader2, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResourceOwnershipSection } from '@/components/resource-ownership-section'

interface ResourceOwner {
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface SoftwareLicense {
  id?: string
  softwareName: string
  vendor: string
  licenseType: string
  totalSeats: number
  assignedSeats: number
  cost?: number | null
  purchaseDate?: string | null
  expiryRenewalDate?: string | null
  autoRenewal: boolean
  licenseKey?: string | null
  status: string
  notes?: string | null
  owner: string
}

interface SoftwareLicenseModalProps {
  isOpen: boolean
  onClose: () => void
  license?: SoftwareLicense
  mode: 'view' | 'edit' | 'create'
  onSave: (license: Partial<SoftwareLicense>, owners?: ResourceOwner[]) => Promise<void>
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments?: Array<{ id: string; name: string }>
}

export function SoftwareLicenseModal({
  isOpen,
  onClose,
  license,
  mode,
  onSave,
  employees,
  departments = []
}: SoftwareLicenseModalProps) {
  const [formData, setFormData] = useState<Partial<SoftwareLicense>>({
    softwareName: '',
    vendor: '',
    licenseType: 'Per User',
    totalSeats: 1,
    assignedSeats: 0,
    cost: 0,
    autoRenewal: false,
    licenseKey: '',
    status: 'ACTIVE',
    notes: '',
    owner: ''
  })

  const [owners, setOwners] = useState<ResourceOwner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOwners = async () => {
      if (license?.id && mode !== 'create') {
        try {
          const response = await fetch(`/api/resources/owners?resourceType=SOFTWARE_LICENSE&resourceId=${license.id}`)
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

    if (license && mode !== 'create') {
      setFormData({
        ...license,
        purchaseDate: license.purchaseDate ? new Date(license.purchaseDate).toISOString().split('T')[0] : '',
        expiryRenewalDate: license.expiryRenewalDate ? new Date(license.expiryRenewalDate).toISOString().split('T')[0] : '',
        owner: '', // Will be populated by fetchOwners
      })
      fetchOwners()
    } else if (mode === 'create') {
      setFormData({
        softwareName: '',
        vendor: '',
        licenseType: 'Per User',
        totalSeats: 1,
        assignedSeats: 0,
        cost: 0,
        autoRenewal: false,
        licenseKey: '',
        status: 'ACTIVE',
        notes: '',
        owner: ''
      })
      setOwners([])
    }
    setErrors({})
  }, [license, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.softwareName?.trim()) newErrors.softwareName = 'Software name is required'
    if (!formData.vendor?.trim()) newErrors.vendor = 'Vendor is required'
    if (!formData.licenseType) newErrors.licenseType = 'License type is required'
    if (!formData.totalSeats || formData.totalSeats < 1) newErrors.totalSeats = 'Total seats must be at least 1'
    if (formData.assignedSeats !== undefined && formData.assignedSeats < 0) newErrors.assignedSeats = 'Assigned seats cannot be negative'
    if (formData.assignedSeats !== undefined && formData.totalSeats !== undefined && formData.assignedSeats > formData.totalSeats) {
      newErrors.assignedSeats = 'Assigned seats cannot exceed total seats'
    }
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
      console.error('Error saving software license:', error)
      setErrors({ submit: 'Failed to save software license. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const isViewMode = mode === 'view'

  const licenseTypes = ['Per User', 'Per Device', 'Enterprise', 'Site License', 'Concurrent', 'Perpetual', 'Subscription']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {mode === 'view' && 'Software License Details'}
            {mode === 'edit' && 'Edit Software License'}
            {mode === 'create' && 'Add New Software License'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this software license.'}
            {mode === 'edit' && 'Update software license information. Fields marked with * are required for ISO 27001 compliance.'}
            {mode === 'create' && 'Register a new software license. Fields marked with * are required for ISO 27001 compliance.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* License Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Package className="h-4 w-4" />
              License Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="softwareName" className="text-sm font-medium">
                  Software Name {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="softwareName"
                  value={formData.softwareName || ''}
                  onChange={(e) => setFormData({ ...formData, softwareName: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.softwareName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Microsoft Office 365"
                />
                {errors.softwareName && <p className="text-xs text-destructive">{errors.softwareName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor" className="text-sm font-medium">
                  Vendor {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="vendor"
                  value={formData.vendor || ''}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.vendor && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Microsoft"
                />
                {errors.vendor && <p className="text-xs text-destructive">{errors.vendor}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseType" className="text-sm font-medium">
                  License Type {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.licenseType}
                  onValueChange={(value) => setFormData({ ...formData, licenseType: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.licenseType && "border-destructive")}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {licenseTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.licenseType && <p className="text-xs text-destructive">{errors.licenseType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">
                  Cost (USD)
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost !== null && formData.cost !== undefined ? formData.cost : ''}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value ? parseFloat(e.target.value) : null })}
                  disabled={isViewMode}
                  placeholder="999.99"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate" className="text-sm font-medium">
                  Purchase Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate || ''}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryRenewalDate" className="text-sm font-medium">
                  Expiry/Renewal Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="expiryRenewalDate"
                    type="date"
                    value={formData.expiryRenewalDate || ''}
                    onChange={(e) => setFormData({ ...formData, expiryRenewalDate: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoRenewal" className="text-sm font-medium">
                  Auto Renewal
                </Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="autoRenewal"
                    checked={formData.autoRenewal || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoRenewal: checked })}
                    disabled={isViewMode}
                  />
                  <Label htmlFor="autoRenewal" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.autoRenewal ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="licenseKey" className="text-sm font-medium">
                  License Key
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="licenseKey"
                    type="password"
                    value={formData.licenseKey || ''}
                    onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seat Management Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Users className="h-4 w-4" />
              Seat Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalSeats" className="text-sm font-medium">
                  Total Seats {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="totalSeats"
                  type="number"
                  value={formData.totalSeats || ''}
                  onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) || 0 })}
                  disabled={isViewMode}
                  className={cn(errors.totalSeats && "border-destructive focus-visible:ring-destructive")}
                  placeholder="10"
                />
                {errors.totalSeats && <p className="text-xs text-destructive">{errors.totalSeats}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedSeats" className="text-sm font-medium">
                  Assigned Seats
                </Label>
                <Input
                  id="assignedSeats"
                  type="number"
                  value={formData.assignedSeats !== undefined ? formData.assignedSeats : ''}
                  onChange={(e) => setFormData({ ...formData, assignedSeats: parseInt(e.target.value) || 0 })}
                  disabled={isViewMode}
                  className={cn(errors.assignedSeats && "border-destructive focus-visible:ring-destructive")}
                  placeholder="0"
                />
                {errors.assignedSeats && <p className="text-xs text-destructive">{errors.assignedSeats}</p>}
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
                  placeholder="Additional notes about this license..."
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
                {mode === 'edit' ? 'Update License' : 'Add License'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
