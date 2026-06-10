'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Key, Shield, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface APIKeyResource {
  id?: string
  serviceName: string
  apiKeyToken?: string | null
  keyType: string
  scopePermissions: string
  rateLimit?: string | null
  expiryDate?: string | null
  assignedTo?: string | null
  status: string
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

const defaultForm: Partial<APIKeyResource> = {
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
  const [formData, setFormData] = useState<Partial<APIKeyResource>>(defaultForm)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (apiKey && mode !== 'create') {
      setFormData({
        ...apiKey,
        expiryDate: apiKey.expiryDate
          ? new Date(apiKey.expiryDate).toISOString().split('T')[0]
          : '',
      })
    } else if (mode === 'create') {
      setFormData(defaultForm)
    }
    setErrors({})
  }, [apiKey, mode, isOpen])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.serviceName?.trim()) e.serviceName = 'Service name is required'
    if (!formData.apiKeyToken?.trim()) e.apiKeyToken = 'API key token is required'
    if (!formData.keyType) e.keyType = 'Key type is required'
    if (!formData.scopePermissions?.trim()) e.scopePermissions = 'Scope / permissions is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mode === 'view') { onClose(); return }
    if (!validate()) return
    setIsLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch {
      setErrors({ submit: 'Failed to save API key. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const set = (field: keyof APIKeyResource) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))

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

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
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
                  value={formData.serviceName || ''}
                  onChange={set('serviceName')}
                  disabled={isViewMode}
                  placeholder="e.g. Stripe, Twilio, SendGrid"
                  className={cn(errors.serviceName && 'border-destructive')}
                />
                {errors.serviceName && <p className="text-xs text-destructive">{errors.serviceName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyType" className="text-sm font-medium">
                  Key Type {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.keyType}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, keyType: v }))}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn('h-10', errors.keyType && 'border-destructive')}>
                    <SelectValue placeholder="Select key type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Sandbox">Sandbox</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                  </SelectContent>
                </Select>
                {errors.keyType && <p className="text-xs text-destructive">{errors.keyType}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="apiKeyToken" className="text-sm font-medium">
                  API Key / Token {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id="apiKeyToken"
                  value={formData.apiKeyToken || ''}
                  onChange={set('apiKeyToken')}
                  disabled={isViewMode}
                  placeholder="sk_live_..."
                  className={cn('min-h-[80px] resize-none font-mono text-sm', errors.apiKeyToken && 'border-destructive')}
                />
                {errors.apiKeyToken && <p className="text-xs text-destructive">{errors.apiKeyToken}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="scopePermissions" className="text-sm font-medium">
                  Scope / Permissions {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="scopePermissions"
                  value={formData.scopePermissions || ''}
                  onChange={set('scopePermissions')}
                  disabled={isViewMode}
                  placeholder="e.g. read:users, write:payments"
                  className={cn(errors.scopePermissions && 'border-destructive')}
                />
                {errors.scopePermissions && <p className="text-xs text-destructive">{errors.scopePermissions}</p>}
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
                  value={formData.assignedTo || ''}
                  onChange={set('assignedTo')}
                  disabled={isViewMode}
                  placeholder="employee@company.mn"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateLimit" className="text-sm font-medium">Rate Limit</Label>
                <Input
                  id="rateLimit"
                  value={formData.rateLimit || ''}
                  onChange={set('rateLimit')}
                  disabled={isViewMode}
                  placeholder="e.g. 1000 req/min"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={set('expiryDate')}
                  disabled={isViewMode}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="REVOKED">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ipRestrictions" className="text-sm font-medium">IP Restrictions</Label>
                <Input
                  id="ipRestrictions"
                  value={formData.ipRestrictions || ''}
                  onChange={set('ipRestrictions')}
                  disabled={isViewMode}
                  placeholder="e.g. 192.168.1.0/24, 10.0.0.1"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="webhookUrls" className="text-sm font-medium">Webhook URLs</Label>
                <Input
                  id="webhookUrls"
                  value={formData.webhookUrls || ''}
                  onChange={set('webhookUrls')}
                  disabled={isViewMode}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={set('notes')}
                  disabled={isViewMode}
                  className="min-h-[80px] resize-none"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="rounded-md bg-destructive/10 p-4 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{errors.submit}</p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="min-w-24">
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button type="submit" disabled={isLoading} className="min-w-28">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? 'Update API Key' : 'Add API Key'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
