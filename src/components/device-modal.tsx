'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Laptop, Shield, FileText, Calendar, Key, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResourceOwnershipSection } from '@/components/resource-ownership-section'

interface ResourceOwner {
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface DeviceResource {
  id?: string
  deviceType: string
  brand?: string | null
  model?: string | null
  makeModel?: string | null
  serialNumber?: string | null
  assetTag?: string | null
  operatingSystem?: string | null
  assignedTo?: string | null
  assignmentDate?: string | null
  location?: string | null
  condition?: string | null
  purchaseDate?: string | null
  warrantyExpiry?: string | null
  status: string
  specifications?: string | null
  purchaseCost?: number | null
  owner: string
}

interface DeviceModalProps {
  isOpen: boolean
  onClose: () => void
  device?: DeviceResource
  mode: 'view' | 'edit' | 'create'
  onSave: (device: Partial<DeviceResource>, owners?: ResourceOwner[]) => Promise<void>
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments?: Array<{ id: string; name: string }>
}

export function DeviceModal({
  isOpen,
  onClose,
  device,
  mode,
  onSave,
  employees,
  departments = []
}: DeviceModalProps) {
  const [formData, setFormData] = useState<Partial<DeviceResource>>({
    deviceType: 'Laptop',
    brand: '',
    model: '',
    serialNumber: '',
    assetTag: '',
    operatingSystem: '',
    assignedTo: '',
    location: '',
    condition: 'Good',
    status: 'AVAILABLE',
    specifications: '',
    owner: ''
  })

  const [owners, setOwners] = useState<ResourceOwner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Device type to default OS mapping
  const getDefaultOS = (deviceType: string): string => {
    const osDefaults: Record<string, string> = {
      'Laptop': 'Windows 11',
      'Desktop': 'Windows 11',
      'Mobile': 'iOS',
      'Tablet': 'iOS',
      'Printer': '',
      'Scanner': '',
      'Network Equipment': '',
      'Security Device': '',
      'Other': ''
    }
    return osDefaults[deviceType] || ''
  }

  useEffect(() => {
    const fetchOwners = async () => {
      if (device?.id && mode !== 'create') {
        try {
          const response = await fetch(`/api/resources/owners?resourceType=DEVICE&resourceId=${device.id}`)
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

    if (device && mode !== 'create') {
      setFormData({
        ...device,
        purchaseDate: device.purchaseDate ? new Date(device.purchaseDate).toISOString().split('T')[0] : '',
        warrantyExpiry: device.warrantyExpiry ? new Date(device.warrantyExpiry).toISOString().split('T')[0] : '',
        assignmentDate: device.assignmentDate ? new Date(device.assignmentDate).toISOString().split('T')[0] : '',
        owner: '', // Will be populated by fetchOwners
      })
      fetchOwners()
    } else if (mode === 'create') {
      setFormData({
        deviceType: 'Laptop',
        brand: '',
        model: '',
        serialNumber: '',
        assetTag: '',
        operatingSystem: 'Windows 11',
        assignedTo: '',
        location: '',
        condition: 'Good',
        status: 'AVAILABLE',
        specifications: '',
        owner: ''
      })
      setOwners([])
    }
    setErrors({})
  }, [device, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.deviceType) newErrors.deviceType = 'Device type is required'
    if (!formData.brand?.trim() && !formData.model?.trim()) {
      newErrors.model = 'Either brand or model is required'
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
      console.error('Error saving device:', error)
      setErrors({ submit: 'Failed to save device. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeviceTypeChange = (value: string) => {
    const defaultOS = getDefaultOS(value)
    setFormData({
      ...formData,
      deviceType: value,
      operatingSystem: formData.operatingSystem || defaultOS
    })
  }

  const isViewMode = mode === 'view'

  const deviceTypes = ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Printer', 'Scanner', 'Network Equipment', 'Security Device', 'Other']
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged']
  const statuses = ['AVAILABLE', 'ASSIGNED', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'LOST', 'STOLEN']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Laptop className="h-6 w-6 text-primary" />
            {mode === 'view' && 'Device Resource Details'}
            {mode === 'edit' && 'Edit Device Resource'}
            {mode === 'create' && 'Add New Device Resource'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this device resource.'}
            {mode === 'edit' && 'Update device resource information. Fields marked with * are required for ISO 27001 compliance.'}
            {mode === 'create' && 'Register a new device resource. Fields marked with * are required for ISO 27001 compliance.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Device Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Laptop className="h-4 w-4" />
              Device Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="deviceType" className="text-sm font-medium">
                  Device Type {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.deviceType}
                  onValueChange={handleDeviceTypeChange}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.deviceType && "border-destructive")}>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.deviceType && <p className="text-xs text-destructive">{errors.deviceType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand" className="text-sm font-medium">
                  Brand
                </Label>
                <Input
                  id="brand"
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  disabled={isViewMode}
                  placeholder="Dell, HP, Apple, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-medium">
                  Model {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="model"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.model && "border-destructive focus-visible:ring-destructive")}
                  placeholder="MacBook Pro 16-inch"
                />
                {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-sm font-medium">
                  Serial Number
                </Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber || ''}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  disabled={isViewMode}
                  placeholder="C02XJ1KDJHD4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetTag" className="text-sm font-medium">
                  Asset Tag
                </Label>
                <Input
                  id="assetTag"
                  value={formData.assetTag || ''}
                  onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                  disabled={isViewMode}
                  placeholder="ASSET-001234"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operatingSystem" className="text-sm font-medium">
                  Operating System
                </Label>
                <Input
                  id="operatingSystem"
                  value={formData.operatingSystem || ''}
                  onChange={(e) => setFormData({ ...formData, operatingSystem: e.target.value })}
                  disabled={isViewMode}
                  placeholder="Windows 11, macOS Ventura, etc."
                />
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
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.email}>
                        {emp.firstName} {emp.lastName} ({emp.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignmentDate" className="text-sm font-medium">
                  Assignment Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="assignmentDate"
                    type="date"
                    value={formData.assignmentDate || ''}
                    onChange={(e) => setFormData({ ...formData, assignmentDate: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isViewMode}
                  placeholder="Office, Remote, Storage, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition" className="text-sm font-medium">
                  Condition
                </Label>
                <Select
                  value={formData.condition || undefined}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((cond) => (
                      <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
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
                    {statuses.map((stat) => (
                      <SelectItem key={stat} value={stat}>
                        {stat.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="specifications" className="text-sm font-medium">
                  Specifications
                </Label>
                <Textarea
                  id="specifications"
                  value={formData.specifications || ''}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  disabled={isViewMode}
                  className="min-h-[80px] resize-none"
                  placeholder="e.g., 16GB RAM, 512GB SSD, Intel i7, etc."
                />
              </div>
            </div>
          </div>

          {/* Security & Compliance Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4" />
              Security & Compliance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <Label htmlFor="warrantyExpiry" className="text-sm font-medium">
                  Warranty Expiry
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="warrantyExpiry"
                    type="date"
                    value={formData.warrantyExpiry || ''}
                    onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseCost" className="text-sm font-medium">
                  Purchase Cost
                </Label>
                <Input
                  id="purchaseCost"
                  type="number"
                  step="0.01"
                  value={formData.purchaseCost || ''}
                  onChange={(e) => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) || null })}
                  disabled={isViewMode}
                  placeholder="1299.99"
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
                {mode === 'edit' ? 'Update Device' : 'Add Device'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
