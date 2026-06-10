'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building, Mail, Phone, Globe, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Company {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  isActive: boolean
  createdAt: string
}

interface CompanyModalProps {
  isOpen: boolean
  onClose: () => void
  company?: Company
  mode: 'view' | 'edit' | 'create'
  onSave: (company: Partial<Company>) => Promise<void>
}

export function CompanyModal({
  isOpen,
  onClose,
  company,
  mode,
  onSave
}: CompanyModalProps) {
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    description: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (company && mode !== 'create') {
      setFormData(company)
    } else if (mode === 'create') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        description: ''
      })
    }
    setErrors({})
  }, [company, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) newErrors.name = 'Company name is required'

    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (formData.website?.trim() && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(formData.website)) {
      newErrors.website = 'Invalid website URL'
    }

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
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving company:', error)
      setErrors({ submit: 'Failed to save company. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const isViewMode = mode === 'view'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            {mode === 'view' && 'Company Details'}
            {mode === 'edit' && 'Edit Company'}
            {mode === 'create' && 'Add New Company'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this company.'}
            {mode === 'edit' && 'Update company information. Fields marked with * are required.'}
            {mode === 'create' && 'Fill in the details to add a new company. Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Building className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Company Name {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Acme Corporation"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isViewMode}
                    className={cn("pl-10", errors.email && "border-destructive focus-visible:ring-destructive")}
                    placeholder="contact@acmecorp.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium">
                  Website
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={isViewMode}
                    className={cn("pl-10", errors.website && "border-destructive focus-visible:ring-destructive")}
                    placeholder="https://www.acmecorp.com"
                  />
                </div>
                {errors.website && (
                  <p className="text-xs text-destructive">{errors.website}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Building className="h-4 w-4" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isViewMode}
                  className="min-h-[100px] resize-none"
                  placeholder="Brief description of the company..."
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
                {mode === 'edit' ? 'Update Company' : 'Add Company'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
