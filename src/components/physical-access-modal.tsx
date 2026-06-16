'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { physicalAccessBaseSchema, type PhysicalAccessFormData } from '@/lib/schemas/physical-access'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DoorOpen, Shield, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhysicalAccessResource {
  id?: string
  location: string
  accessType: string
  badgeCardNumber?: string | null
  accessSchedule: string
  accessZones: string
  assignedTo?: string | null
  validFrom: string
  validTo?: string | null
  status: string
  escortRequired: boolean
  authorizationLevel?: string | null
  notes?: string | null
}

interface PhysicalAccessModalProps {
  isOpen: boolean
  onClose: () => void
  physicalAccess?: PhysicalAccessResource
  mode: 'view' | 'edit' | 'create'
  onSave: (data: PhysicalAccessFormData) => Promise<boolean>
}

const defaultValues: PhysicalAccessFormData = {
  location: '',
  accessType: 'Badge',
  badgeCardNumber: '',
  accessSchedule: 'Business Hours',
  accessZones: '',
  assignedTo: '',
  validFrom: new Date().toISOString().split('T')[0],
  validTo: '',
  status: 'ACTIVE',
  escortRequired: false,
  authorizationLevel: '',
  notes: '',
}

export function PhysicalAccessModal({ isOpen, onClose, physicalAccess, mode, onSave }: PhysicalAccessModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PhysicalAccessFormData>({
    resolver: zodResolver(physicalAccessBaseSchema),
    defaultValues,
  })

  useEffect(() => {
    if (physicalAccess && mode !== 'create') {
      reset({
        location: physicalAccess.location ?? '',
        accessType: (physicalAccess.accessType as PhysicalAccessFormData['accessType']) ?? 'Badge',
        badgeCardNumber: physicalAccess.badgeCardNumber ?? '',
        accessSchedule: (physicalAccess.accessSchedule as PhysicalAccessFormData['accessSchedule']) ?? 'Business Hours',
        accessZones: physicalAccess.accessZones ?? '',
        assignedTo: physicalAccess.assignedTo ?? '',
        validFrom: physicalAccess.validFrom ? new Date(physicalAccess.validFrom).toISOString().split('T')[0] : '',
        validTo: physicalAccess.validTo ? new Date(physicalAccess.validTo).toISOString().split('T')[0] : '',
        status: (physicalAccess.status as PhysicalAccessFormData['status']) ?? 'ACTIVE',
        escortRequired: physicalAccess.escortRequired ?? false,
        authorizationLevel: physicalAccess.authorizationLevel ?? '',
        notes: physicalAccess.notes ?? '',
      })
    } else if (mode === 'create') {
      reset({ ...defaultValues, validFrom: new Date().toISOString().split('T')[0] })
    }
  }, [physicalAccess, mode, isOpen, reset])

  const onSubmit = async (data: PhysicalAccessFormData) => {
    const saved = await onSave(data)
    if (saved) onClose()
  }

  const isViewMode = mode === 'view'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <DoorOpen className="h-6 w-6 text-primary" />
            {mode === 'view' && 'Physical Access Details'}
            {mode === 'edit' && 'Edit Physical Access'}
            {mode === 'create' && 'Add Physical Access'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this physical access record.'}
            {mode !== 'view' && 'Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={isViewMode ? (e) => { e.preventDefault(); onClose() } : handleSubmit(onSubmit)}
          className="space-y-8 py-6"
        >
          {/* Access Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <DoorOpen className="h-4 w-4" />
              Access Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="location"
                  {...register('location')}
                  disabled={isViewMode}
                  placeholder="e.g. HQ Building A, Floor 3, Server Room"
                  className={cn(errors.location && 'border-destructive')}
                />
                {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessType" className="text-sm font-medium">
                  Access Type {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Controller
                  name="accessType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                      <SelectTrigger className={cn('h-10', errors.accessType && 'border-destructive')}>
                        <SelectValue placeholder="Select access type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Badge">Badge</SelectItem>
                        <SelectItem value="Key">Key</SelectItem>
                        <SelectItem value="Biometric">Biometric</SelectItem>
                        <SelectItem value="PIN">PIN</SelectItem>
                        <SelectItem value="Badge + PIN">Badge + PIN</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.accessType && <p className="text-xs text-destructive">{errors.accessType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="badgeCardNumber" className="text-sm font-medium">Badge / Card Number</Label>
                <Input
                  id="badgeCardNumber"
                  {...register('badgeCardNumber')}
                  disabled={isViewMode}
                  placeholder="e.g. B-00123"
                  className={cn('font-mono text-sm', errors.badgeCardNumber && 'border-destructive')}
                />
                {errors.badgeCardNumber && <p className="text-xs text-destructive">{errors.badgeCardNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessSchedule" className="text-sm font-medium">
                  Access Schedule {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Controller
                  name="accessSchedule"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                      <SelectTrigger className={cn('h-10', errors.accessSchedule && 'border-destructive')}>
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24/7">24/7</SelectItem>
                        <SelectItem value="Business Hours">Business Hours</SelectItem>
                        <SelectItem value="Weekdays Only">Weekdays Only</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.accessSchedule && <p className="text-xs text-destructive">{errors.accessSchedule.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="accessZones" className="text-sm font-medium">
                  Access Zones {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="accessZones"
                  {...register('accessZones')}
                  disabled={isViewMode}
                  placeholder="e.g. Lobby, Office Floor, Server Room"
                  className={cn(errors.accessZones && 'border-destructive')}
                />
                {errors.accessZones && <p className="text-xs text-destructive">{errors.accessZones.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium">Assigned To</Label>
                <Input
                  id="assignedTo"
                  type="email"
                  {...register('assignedTo')}
                  disabled={isViewMode}
                  placeholder="employee@company.mn"
                  className={cn(errors.assignedTo && 'border-destructive')}
                />
                {errors.assignedTo && <p className="text-xs text-destructive">{errors.assignedTo.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorizationLevel" className="text-sm font-medium">Authorization Level</Label>
                <Input
                  id="authorizationLevel"
                  {...register('authorizationLevel')}
                  disabled={isViewMode}
                  placeholder="e.g. Level 1, Restricted"
                  className={cn(errors.authorizationLevel && 'border-destructive')}
                />
                {errors.authorizationLevel && <p className="text-xs text-destructive">{errors.authorizationLevel.message}</p>}
              </div>
            </div>
          </div>

          {/* Validity & Security */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4" />
              Validity & Security
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="validFrom" className="text-sm font-medium">
                  Valid From {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="validFrom"
                  type="date"
                  {...register('validFrom')}
                  disabled={isViewMode}
                  className={cn(errors.validFrom && 'border-destructive')}
                />
                {errors.validFrom && <p className="text-xs text-destructive">{errors.validFrom.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo" className="text-sm font-medium">Valid Until</Label>
                <Input
                  id="validTo"
                  type="date"
                  {...register('validTo')}
                  disabled={isViewMode}
                  className={cn(errors.validTo && 'border-destructive')}
                />
                {errors.validTo && <p className="text-xs text-destructive">{errors.validTo.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="escortRequired" className="text-sm font-medium">Escort Required</Label>
                <Controller
                  name="escortRequired"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-3 pt-2">
                      <Switch
                        id="escortRequired"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isViewMode}
                      />
                      <Label htmlFor="escortRequired" className="text-sm text-muted-foreground cursor-pointer">
                        {field.value ? 'Escort required' : 'No escort needed'}
                      </Label>
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  disabled={isViewMode}
                  className={cn('min-h-[80px] resize-none', errors.notes && 'border-destructive')}
                  placeholder="Additional notes..."
                />
                {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="min-w-24">
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button type="submit" disabled={isSubmitting} className="min-w-28">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? 'Update Access' : 'Add Access'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
