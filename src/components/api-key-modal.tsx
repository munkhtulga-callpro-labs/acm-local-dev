'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Key, Shield, Loader2, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

const optEmail = z.string().optional()
  .refine(
    v => !v?.trim() || z.email().safeParse(v.trim()).success,
    'Invalid email address'
  )

const optIpList = z.string().optional()
  .refine(
    v => !v?.trim() || v.split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .every(entry => z.ipv4().safeParse(entry).success || z.cidrv4().safeParse(entry).success),
    'Must be valid IPv4 addresses or CIDR ranges (e.g. 10.0.0.1, 192.168.1.0/24)'
  )

const apiKeySchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  apiKeyToken: z.string().min(1, 'API key token is required'),
  keyType: z.enum(['Production', 'Sandbox', 'Development']),
  scopePermissions: z.string().min(1, 'Scope / permissions is required'),
  rateLimit: z.string().optional(),
  expiryDate: z.string().optional(),
  assignedTo: optEmail,
  status: z.enum(['ACTIVE', 'INACTIVE', 'REVOKED']),
  notes: z.string().optional(),
  ipRestrictions: optIpList,
  webhookUrls: z.string().optional(),
})

// In edit mode the token is stripped from the list response, so it's optional on updates
const apiKeyEditSchema = apiKeySchema.extend({
  apiKeyToken: z.string().optional(),
})

type APIKeyFormData = z.infer<typeof apiKeyEditSchema>

interface APIKeyResource {
  id?: string
  serviceName?: string
  apiKeyToken?: string | null
  keyType?: string
  scopePermissions?: string
  rateLimit?: string | null
  expiryDate?: string | null
  assignedTo?: string | null
  status?: string
  notes?: string | null
  ipRestrictions?: string | null
  webhookUrls?: string | null
}

interface APIKeyModalProps {
  isOpen: boolean
  onClose: () => void
  apiKey?: APIKeyResource
  mode: 'view' | 'edit' | 'create'
  onSave: (apiKey: Partial<APIKeyResource>) => Promise<void>
}

const defaultValues: APIKeyFormData = {
  serviceName: '',
  apiKeyToken: '',
  keyType: 'Production',
  scopePermissions: '',
  rateLimit: '',
  expiryDate: '',
  assignedTo: '',
  status: 'ACTIVE',
  notes: '',
  ipRestrictions: '',
  webhookUrls: '',
}

export function APIKeyModal({ isOpen, onClose, apiKey, mode, onSave }: APIKeyModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<APIKeyFormData>({
    resolver: zodResolver(apiKeyEditSchema),
    defaultValues,
  })

  useEffect(() => {
    if (apiKey && mode !== 'create') {
      reset({
        serviceName: apiKey.serviceName ?? '',
        apiKeyToken: apiKey.apiKeyToken ?? '',
        keyType: (apiKey.keyType as APIKeyFormData['keyType']) ?? 'Production',
        scopePermissions: apiKey.scopePermissions ?? '',
        rateLimit: apiKey.rateLimit ?? '',
        expiryDate: apiKey.expiryDate ? new Date(apiKey.expiryDate).toISOString().split('T')[0] : '',
        assignedTo: apiKey.assignedTo ?? '',
        status: (apiKey.status as APIKeyFormData['status']) ?? 'ACTIVE',
        notes: apiKey.notes ?? '',
        ipRestrictions: apiKey.ipRestrictions ?? '',
        webhookUrls: apiKey.webhookUrls ?? '',
      })
    } else if (mode === 'create') {
      reset(defaultValues)
    }
  }, [apiKey, mode, isOpen, reset])

  const onSubmit = async (data: APIKeyFormData) => {
    if (mode === 'create' && !data.apiKeyToken) {
      toast.error('API key token is required')
      return
    }
    try {
      await onSave(data)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save API key. Please try again.')
    }
  }

  const isViewMode = mode === 'view'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            {mode === 'view' && 'API Key Details'}
            {mode === 'edit' && 'Edit API Key'}
            {mode === 'create' && 'Add New API Key'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this API key.'}
            {mode !== 'view' && 'Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={isViewMode ? (e) => { e.preventDefault(); onClose() } : handleSubmit(onSubmit)}
          className="space-y-8 py-6"
        >
          {/* Key Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Key className="h-4 w-4" />
              Key Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="serviceName" className="text-sm font-medium">
                  Service Name {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="serviceName"
                  {...register('serviceName')}
                  disabled={isViewMode}
                  placeholder="e.g. Stripe, Twilio, SendGrid"
                  className={cn(errors.serviceName && 'border-destructive')}
                />
                {errors.serviceName && <p className="text-xs text-destructive">{errors.serviceName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyType" className="text-sm font-medium">
                  Key Type {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Controller
                  name="keyType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                      <SelectTrigger className={cn('h-10', errors.keyType && 'border-destructive')}>
                        <SelectValue placeholder="Select key type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Sandbox">Sandbox</SelectItem>
                        <SelectItem value="Development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.keyType && <p className="text-xs text-destructive">{errors.keyType.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="apiKeyToken" className="text-sm font-medium">
                  API Key / Token {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id="apiKeyToken"
                  {...register('apiKeyToken')}
                  disabled={isViewMode}
                  placeholder="sk_live_..."
                  className={cn('min-h-[80px] resize-none font-mono text-sm', errors.apiKeyToken && 'border-destructive')}
                />
                {errors.apiKeyToken && <p className="text-xs text-destructive">{errors.apiKeyToken.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="scopePermissions" className="text-sm font-medium">
                  Scope / Permissions {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="scopePermissions"
                  {...register('scopePermissions')}
                  disabled={isViewMode}
                  placeholder="e.g. read:users, write:payments"
                  className={cn(errors.scopePermissions && 'border-destructive')}
                />
                {errors.scopePermissions && <p className="text-xs text-destructive">{errors.scopePermissions.message}</p>}
              </div>
            </div>
          </div>

          {/* Access & Restrictions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4" />
              Access & Restrictions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium">Assigned To</Label>
                <Input
                  id="assignedTo"
                  {...register('assignedTo')}
                  disabled={isViewMode}
                  placeholder="employee@company.mn"
                  className={cn(errors.assignedTo && 'border-destructive')}
                />
                {errors.assignedTo && <p className="text-xs text-destructive">{errors.assignedTo.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateLimit" className="text-sm font-medium">Rate Limit</Label>
                <Input
                  id="rateLimit"
                  {...register('rateLimit')}
                  disabled={isViewMode}
                  placeholder="e.g. 1000 req/min"
                  className={cn(errors.rateLimit && 'border-destructive')}
                />
                {errors.rateLimit && <p className="text-xs text-destructive">{errors.rateLimit.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Expiry Date</Label>
                <Controller
                  name="expiryDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isViewMode}
                          className={cn(
                            'w-full justify-start text-left font-normal h-10',
                            !field.value && 'text-muted-foreground',
                            errors.expiryDate && 'border-destructive'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          {field.value ? format(parseISO(field.value), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? parseISO(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                          disabled={{ before: new Date() }}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate.message}</p>}
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
                        <SelectItem value="REVOKED">Revoked</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ipRestrictions" className="text-sm font-medium">IP Restrictions</Label>
                <Input
                  id="ipRestrictions"
                  {...register('ipRestrictions')}
                  disabled={isViewMode}
                  placeholder="e.g. 192.168.1.0/24, 10.0.0.1"
                  className={cn('font-mono text-sm', errors.ipRestrictions && 'border-destructive')}
                />
                {errors.ipRestrictions && <p className="text-xs text-destructive">{errors.ipRestrictions.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="webhookUrls" className="text-sm font-medium">Webhook URLs</Label>
                <Input
                  id="webhookUrls"
                  {...register('webhookUrls')}
                  disabled={isViewMode}
                  placeholder="https://..."
                  className={cn(errors.webhookUrls && 'border-destructive')}
                />
                {errors.webhookUrls && <p className="text-xs text-destructive">{errors.webhookUrls.message}</p>}
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
                {mode === 'edit' ? 'Update API Key' : 'Add API Key'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
