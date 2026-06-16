'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fileStorageBaseSchema, type FileStorageFormData } from '@/lib/schemas/file-storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HardDrive, Shield, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileStorageResource {
  id?: string
  storageType: string
  pathLocation: string
  permissionLevel: string
  quotaLimit?: string | null
  assignedTo?: string | null
  encryptionStatus?: string | null
  ownerDepartment?: string | null
  status: string
  notes?: string | null
  sharingSettings?: string | null
  retentionPolicy?: string | null
  expiryDate?: string | null
}

interface FileStorageModalProps {
  isOpen: boolean
  onClose: () => void
  fileStorage?: FileStorageResource
  mode: 'view' | 'edit' | 'create'
  onSave: (data: FileStorageFormData) => Promise<boolean>
}

const defaultValues: FileStorageFormData = {
  storageType: 'Network Share',
  pathLocation: '',
  permissionLevel: 'Read',
  status: 'ACTIVE',
  quotaLimit: '',
  assignedTo: '',
  encryptionStatus: '',
  ownerDepartment: '',
  notes: '',
  sharingSettings: '',
  retentionPolicy: '',
  expiryDate: '',
}

export function FileStorageModal({ isOpen, onClose, fileStorage, mode, onSave }: FileStorageModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FileStorageFormData>({
    resolver: zodResolver(fileStorageBaseSchema),
    defaultValues,
  })

  useEffect(() => {
    if (fileStorage && mode !== 'create') {
      reset({
        storageType: (fileStorage.storageType as FileStorageFormData['storageType']) ?? 'Network Share',
        pathLocation: fileStorage.pathLocation ?? '',
        permissionLevel: (fileStorage.permissionLevel as FileStorageFormData['permissionLevel']) ?? 'Read',
        status: (fileStorage.status as FileStorageFormData['status']) ?? 'ACTIVE',
        quotaLimit: fileStorage.quotaLimit ?? '',
        assignedTo: fileStorage.assignedTo ?? '',
        encryptionStatus: fileStorage.encryptionStatus ?? '',
        ownerDepartment: fileStorage.ownerDepartment ?? '',
        notes: fileStorage.notes ?? '',
        sharingSettings: fileStorage.sharingSettings ?? '',
        retentionPolicy: fileStorage.retentionPolicy ?? '',
        expiryDate: fileStorage.expiryDate ? new Date(fileStorage.expiryDate).toISOString().split('T')[0] : '',
      })
    } else if (mode === 'create') {
      reset(defaultValues)
    }
  }, [fileStorage, mode, isOpen, reset])

  const onSubmit = async (data: FileStorageFormData) => {
    const saved = await onSave(data)
    if (saved) onClose()
  }

  const isViewMode = mode === 'view'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-primary" />
            {mode === 'view' && 'File Storage Details'}
            {mode === 'edit' && 'Edit File Storage'}
            {mode === 'create' && 'Add File Storage'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this file storage entry.'}
            {mode !== 'view' && 'Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={isViewMode ? (e) => { e.preventDefault(); onClose() } : handleSubmit(onSubmit)}
          className="space-y-8 py-6"
        >
          {/* Storage Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <HardDrive className="h-4 w-4" />
              Storage Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="storageType" className="text-sm font-medium">
                  Storage Type {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Controller
                  name="storageType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                      <SelectTrigger className={cn('h-10', errors.storageType && 'border-destructive')}>
                        <SelectValue placeholder="Select storage type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Network Share">Network Share</SelectItem>
                        <SelectItem value="OneDrive">OneDrive</SelectItem>
                        <SelectItem value="Google Drive">Google Drive</SelectItem>
                        <SelectItem value="SharePoint">SharePoint</SelectItem>
                        <SelectItem value="S3">S3</SelectItem>
                        <SelectItem value="NFS">NFS</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.storageType && <p className="text-xs text-destructive">{errors.storageType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="permissionLevel" className="text-sm font-medium">
                  Permission Level {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Controller
                  name="permissionLevel"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                      <SelectTrigger className={cn('h-10', errors.permissionLevel && 'border-destructive')}>
                        <SelectValue placeholder="Select permission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Read">Read</SelectItem>
                        <SelectItem value="Write">Write</SelectItem>
                        <SelectItem value="Full Control">Full Control</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.permissionLevel && <p className="text-xs text-destructive">{errors.permissionLevel.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="pathLocation" className="text-sm font-medium">
                  Path / Location {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="pathLocation"
                  {...register('pathLocation')}
                  disabled={isViewMode}
                  placeholder="\\server\share\folder or /mnt/data"
                  className={cn('font-mono text-sm', errors.pathLocation && 'border-destructive')}
                />
                {errors.pathLocation && <p className="text-xs text-destructive">{errors.pathLocation.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quotaLimit" className="text-sm font-medium">Quota Limit</Label>
                <Input
                  id="quotaLimit"
                  {...register('quotaLimit')}
                  disabled={isViewMode}
                  placeholder="e.g. 50GB"
                  className={cn(errors.quotaLimit && 'border-destructive')}
                />
                {errors.quotaLimit && <p className="text-xs text-destructive">{errors.quotaLimit.message}</p>}
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
                <Label htmlFor="ownerDepartment" className="text-sm font-medium">Owner Department</Label>
                <Input
                  id="ownerDepartment"
                  {...register('ownerDepartment')}
                  disabled={isViewMode}
                  placeholder="e.g. IT, Finance"
                  className={cn(errors.ownerDepartment && 'border-destructive')}
                />
                {errors.ownerDepartment && <p className="text-xs text-destructive">{errors.ownerDepartment.message}</p>}
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
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Security & Policy */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4" />
              Security & Policy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="encryptionStatus" className="text-sm font-medium">Encryption Status</Label>
                <Input
                  id="encryptionStatus"
                  {...register('encryptionStatus')}
                  disabled={isViewMode}
                  placeholder="e.g. AES-256, None"
                  className={cn(errors.encryptionStatus && 'border-destructive')}
                />
                {errors.encryptionStatus && <p className="text-xs text-destructive">{errors.encryptionStatus.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  {...register('expiryDate')}
                  disabled={isViewMode}
                  className={cn(errors.expiryDate && 'border-destructive')}
                />
                {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sharingSettings" className="text-sm font-medium">Sharing Settings</Label>
                <Input
                  id="sharingSettings"
                  {...register('sharingSettings')}
                  disabled={isViewMode}
                  placeholder="e.g. Internal only, Team access"
                  className={cn(errors.sharingSettings && 'border-destructive')}
                />
                {errors.sharingSettings && <p className="text-xs text-destructive">{errors.sharingSettings.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="retentionPolicy" className="text-sm font-medium">Retention Policy</Label>
                <Input
                  id="retentionPolicy"
                  {...register('retentionPolicy')}
                  disabled={isViewMode}
                  placeholder="e.g. 7 years, Delete after 90 days"
                  className={cn(errors.retentionPolicy && 'border-destructive')}
                />
                {errors.retentionPolicy && <p className="text-xs text-destructive">{errors.retentionPolicy.message}</p>}
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
                {mode === 'edit' ? 'Update Storage' : 'Add Storage'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
