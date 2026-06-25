'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('physicalAccess.modal')
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
            {mode === 'view' && t('titleView')}
            {mode === 'edit' && t('titleEdit')}
            {mode === 'create' && t('titleCreate')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && t('descriptionView')}
            {mode !== 'view' && t('descriptionEditCreate')}
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
              {t('sectionAccessInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  {t('location')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="location"
                  {...register('location')}
                  disabled={isViewMode}
                  placeholder={t('locationPlaceholder')}
                  className={cn(errors.location && 'border-destructive')}
                />
                {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessType" className="text-sm font-medium">
                  {t('accessType')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Controller
                  name="accessType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                      <SelectTrigger className={cn('h-10', errors.accessType && 'border-destructive')}>
                        <SelectValue placeholder={t('selectAccessType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Badge">{t('typeBadge')}</SelectItem>
                        <SelectItem value="Key">{t('typeKey')}</SelectItem>
                        <SelectItem value="Biometric">{t('typeBiometric')}</SelectItem>
                        <SelectItem value="PIN">{t('typePin')}</SelectItem>
                        <SelectItem value="Badge + PIN">{t('typeBadgePin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.accessType && <p className="text-xs text-destructive">{errors.accessType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="badgeCardNumber" className="text-sm font-medium">{t('badgeCardNumber')}</Label>
                <Input
                  id="badgeCardNumber"
                  {...register('badgeCardNumber')}
                  disabled={isViewMode}
                  placeholder={t('badgeCardNumberPlaceholder')}
                  className={cn('font-mono text-sm', errors.badgeCardNumber && 'border-destructive')}
                />
                {errors.badgeCardNumber && <p className="text-xs text-destructive">{errors.badgeCardNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessSchedule" className="text-sm font-medium">
                  {t('accessSchedule')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Controller
                  name="accessSchedule"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                      <SelectTrigger className={cn('h-10', errors.accessSchedule && 'border-destructive')}>
                        <SelectValue placeholder={t('selectSchedule')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24/7">24/7</SelectItem>
                        <SelectItem value="Business Hours">{t('scheduleBusinessHours')}</SelectItem>
                        <SelectItem value="Weekdays Only">{t('scheduleWeekdaysOnly')}</SelectItem>
                        <SelectItem value="Custom">{t('scheduleCustom')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.accessSchedule && <p className="text-xs text-destructive">{errors.accessSchedule.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="accessZones" className="text-sm font-medium">
                  {t('accessZones')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="accessZones"
                  {...register('accessZones')}
                  disabled={isViewMode}
                  placeholder={t('accessZonesPlaceholder')}
                  className={cn(errors.accessZones && 'border-destructive')}
                />
                {errors.accessZones && <p className="text-xs text-destructive">{errors.accessZones.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium">{t('assignedTo')}</Label>
                <Input
                  id="assignedTo"
                  type="email"
                  {...register('assignedTo')}
                  disabled={isViewMode}
                  placeholder={t('assignedToPlaceholder')}
                  className={cn(errors.assignedTo && 'border-destructive')}
                />
                {errors.assignedTo && <p className="text-xs text-destructive">{errors.assignedTo.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorizationLevel" className="text-sm font-medium">{t('authorizationLevel')}</Label>
                <Input
                  id="authorizationLevel"
                  {...register('authorizationLevel')}
                  disabled={isViewMode}
                  placeholder={t('authorizationLevelPlaceholder')}
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
              {t('sectionValiditySecurity')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="validFrom" className="text-sm font-medium">
                  {t('validFrom')} {!isViewMode && <span className="text-destructive">*</span>}
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
                <Label htmlFor="validTo" className="text-sm font-medium">{t('validUntil')}</Label>
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
                <Label htmlFor="status" className="text-sm font-medium">{t('status')}</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={t('selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">{t('statusActive')}</SelectItem>
                        <SelectItem value="INACTIVE">{t('statusInactive')}</SelectItem>
                        <SelectItem value="SUSPENDED">{t('statusSuspended')}</SelectItem>
                        <SelectItem value="EXPIRED">{t('statusExpired')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="escortRequired" className="text-sm font-medium">{t('escortRequired')}</Label>
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
                        {field.value ? t('escortRequiredOn') : t('escortRequiredOff')}
                      </Label>
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes" className="text-sm font-medium">{t('notes')}</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  disabled={isViewMode}
                  className={cn('min-h-[80px] resize-none', errors.notes && 'border-destructive')}
                  placeholder={t('notesPlaceholder')}
                />
                {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="min-w-24">
              {isViewMode ? t('close') : t('cancel')}
            </Button>
            {!isViewMode && (
              <Button type="submit" disabled={isSubmitting} className="min-w-28">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? t('updateAccess') : t('addAccess')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
