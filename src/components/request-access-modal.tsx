'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Loader2, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { createAccessRequest } from '@/lib/actions/access-requests'

const RESOURCE_TYPES = [
  'DATABASE', 'SERVER', 'SOFTWARE_LICENSE', 'SAAS_SUBSCRIPTION',
  'CLOUD_ACCOUNT', 'DEVICE', 'INTERNAL_TOOL', 'VPN_NETWORK_ACCESS',
  'CODE_REPOSITORY', 'API_KEY', 'FILE_STORAGE', 'PHYSICAL_ACCESS',
] as const

interface RequestAccessModalProps {
  isOpen: boolean
  onClose: () => void
  resource?: { id: string; displayName: string; resourceType: string }
  onSuccess: () => void
}

export function RequestAccessModal({
  isOpen,
  onClose,
  resource,
  onSuccess
}: RequestAccessModalProps) {
  const [formData, setFormData] = useState({
    resourceType: resource?.resourceType ?? '',
    resourceName: resource?.displayName ?? '',
    accessLevel: '',
    businessJustification: '',
    accessRequestTicketId: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    priority: 'MEDIUM'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!resource && !formData.resourceType) {
      newErrors.resourceType = 'Resource type is required'
    }
    if (!resource && !formData.resourceName.trim()) {
      newErrors.resourceName = 'Resource name is required'
    }
    if (!formData.accessLevel) {
      newErrors.accessLevel = 'Access level is required'
    }
    if (!formData.businessJustification || formData.businessJustification.length < 20) {
      newErrors.businessJustification = 'Business justification is required (minimum 20 characters)'
    }
    if (!formData.validFrom) {
      newErrors.validFrom = 'Start date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await createAccessRequest({
        resourceType: resource?.resourceType ?? formData.resourceType,
        resourceId: resource?.id ?? formData.resourceName.trim().toLowerCase().replace(/\s+/g, '-'),
        resourceName: resource?.displayName ?? formData.resourceName.trim(),
        accessLevel: formData.accessLevel,
        businessJustification: formData.businessJustification,
        accessRequestTicketId: formData.accessRequestTicketId || null,
        validFrom: formData.validFrom,
        validTo: formData.validTo || null,
        priority: formData.priority,
      })

      if (result?.error) {
        if (typeof result.error === 'string') {
          toast.error(result.error)
        } else {
          toast.error('Please fix the form errors and try again')
        }
      } else {
        onSuccess()
        setFormData({
          resourceType: resource?.resourceType ?? '',
          resourceName: resource?.displayName ?? '',
          accessLevel: '',
          businessJustification: '',
          accessRequestTicketId: '',
          validFrom: new Date().toISOString().split('T')[0],
          validTo: '',
          priority: 'MEDIUM',
        })
      }
    } catch {
      toast.error('Error submitting request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const accessLevels = {
    DATABASE: ['Read', 'Write', 'Admin', 'Full'],
    SERVER: ['SSH Access', 'RDP Access', 'Admin Access', 'Root Access'],
    SOFTWARE_LICENSE: ['User', 'Power User', 'Admin'],
    SAAS_SUBSCRIPTION: ['Viewer', 'Editor', 'Admin'],
    CLOUD_ACCOUNT: ['Read Only', 'Power User', 'Admin'],
    DEVICE: ['User', 'Admin'],
    INTERNAL_TOOL: ['User', 'Admin'],
    VPN_NETWORK_ACCESS: ['Standard', 'Elevated', 'Full'],
    CODE_REPOSITORY: ['Read', 'Write', 'Admin'],
    API_KEY: ['Read', 'Write'],
    FILE_STORAGE: ['Read', 'Write', 'Full Control'],
    PHYSICAL_ACCESS: ['Standard Hours', 'Extended Hours', '24/7']
  }

  const activeResourceType = resource?.resourceType ?? formData.resourceType
  const availableAccessLevels = accessLevels[activeResourceType as keyof typeof accessLevels] || ['Read', 'Write', 'Admin']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold">
            Request Access to Resource
          </DialogTitle>
          {resource && (
            <div className="text-base text-muted-foreground space-y-2">
              <div><span className="font-medium text-foreground">Resource:</span> {resource.displayName}</div>
              <div><span className="font-medium text-foreground">Type:</span> {resource.resourceType.replace(/_/g, ' ')}</div>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Resource picker — only shown when no resource is pre-selected */}
          {!resource && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Resource Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.resourceType}
                  onValueChange={(value) => setFormData({ ...formData, resourceType: value, accessLevel: '' })}
                >
                  <SelectTrigger className={cn('h-10', errors.resourceType && 'border-destructive')}>
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.resourceType && <p className="text-xs text-destructive">{errors.resourceType}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="resourceName" className="text-sm font-medium">
                  Resource Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="resourceName"
                  value={formData.resourceName}
                  onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
                  placeholder="e.g. Production Database"
                  className={cn(errors.resourceName && 'border-destructive')}
                />
                {errors.resourceName && <p className="text-xs text-destructive">{errors.resourceName}</p>}
              </div>
            </div>
          )}

          {/* Access Level */}
          <div className="space-y-2">
            <Label htmlFor="accessLevel" className="text-sm font-medium">
              Access Level <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.accessLevel}
              onValueChange={(value) => setFormData({ ...formData, accessLevel: value })}
            >
              <SelectTrigger className={cn("h-10", errors.accessLevel && "border-destructive")}>
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                {availableAccessLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accessLevel && <p className="text-xs text-destructive">{errors.accessLevel}</p>}
          </div>

          {/* Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom" className="text-sm font-medium">
                Access From <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="validFrom"
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-10 w-full justify-start text-left font-normal',
                      !formData.validFrom && 'text-muted-foreground',
                      errors.validFrom && 'border-destructive'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {formData.validFrom ? format(parseISO(formData.validFrom), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.validFrom ? parseISO(formData.validFrom) : undefined}
                    onSelect={(date) => setFormData({ ...formData, validFrom: date ? format(date, 'yyyy-MM-dd') : '' })}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.validFrom && <p className="text-xs text-destructive">{errors.validFrom}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validTo" className="text-sm font-medium">
                Access Until (Optional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="validTo"
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-10 w-full justify-start text-left font-normal',
                      !formData.validTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {formData.validTo ? format(parseISO(formData.validTo), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.validTo ? parseISO(formData.validTo) : undefined}
                    onSelect={(date) => setFormData({ ...formData, validTo: date ? format(date, 'yyyy-MM-dd') : '' })}
                    disabled={formData.validFrom ? { before: parseISO(formData.validFrom) } : undefined}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">Leave empty for permanent access</p>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium">
              Priority
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ticket ID */}
          <div className="space-y-2">
            <Label htmlFor="accessRequestTicketId" className="text-sm font-medium">
              Access Request Ticket ID (Optional)
            </Label>
            <Input
              id="accessRequestTicketId"
              value={formData.accessRequestTicketId}
              onChange={(e) => setFormData({ ...formData, accessRequestTicketId: e.target.value })}
              placeholder="TICK-12345"
            />
            <p className="text-xs text-muted-foreground">If you have an existing ticket for this request</p>
          </div>

          {/* Business Justification */}
          <div className="space-y-2">
            <Label htmlFor="businessJustification" className="text-sm font-medium">
              Business Justification <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="businessJustification"
              value={formData.businessJustification}
              onChange={(e) => setFormData({ ...formData, businessJustification: e.target.value })}
              className={cn("min-h-[120px] resize-none", errors.businessJustification && "border-destructive")}
              placeholder="Explain why you need access to this resource and how it will be used..."
            />
            <div className="flex justify-between items-center">
              {errors.businessJustification && (
                <p className="text-xs text-destructive">{errors.businessJustification}</p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                {formData.businessJustification.length} / 20 minimum
              </p>
            </div>
          </div>

          {/* ISO 27001 Compliance Notice */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">ISO 27001 Compliance</p>
                <p>
                  Your request will be reviewed by the resource owner. You will receive an email notification
                  with access credentials once approved. Please ensure your justification is clear and complete.
                </p>
              </div>
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
