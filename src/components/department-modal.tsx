'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Mail, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Department {
  id: string
  name: string
  description: string | null
  manager: string | null
  company: string
  isActive: boolean
  createdAt: string
}

interface DepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  department?: Department
  mode: 'view' | 'edit' | 'create'
  onSave: (department: Partial<Department>) => Promise<void>
  companies: Array<{ id: string; name: string }>
}

export function DepartmentModal({
  isOpen,
  onClose,
  department,
  mode,
  onSave,
  companies
}: DepartmentModalProps) {
  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    description: '',
    manager: '',
    company: ''
  })

  const [selectedCompany, setSelectedCompany] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (department && mode !== 'create') {
      setFormData({
        name: department.name,
        description: department.description || '',
        manager: department.manager || '',
        company: department.company
      })
      setSelectedCompany(department.company)
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        manager: '',
        company: ''
      })
      setSelectedCompany('')
    }
    setErrors({})
  }, [department, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) newErrors.name = 'Department name is required'
    if (!selectedCompany) newErrors.company = 'Company is required'
    if (formData.manager && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.manager)) {
      newErrors.manager = 'Invalid email format'
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
      await onSave({
        ...formData,
        company: selectedCompany
      })
      onClose()
    } catch (error) {
      console.error('Error saving department:', error)
      setErrors({ submit: 'Failed to save department. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    setSelectedCompany(company?.name || '')
  }

  const isViewMode = mode === 'view'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {mode === 'view' && 'Department Details'}
            {mode === 'edit' && 'Edit Department'}
            {mode === 'create' && 'Add New Department'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this department.'}
            {mode === 'edit' && 'Update department information. Fields marked with * are required.'}
            {mode === 'create' && 'Fill in the details to add a new department. Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Building2 className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Department Name {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Engineering"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Company {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={companies.find(c => c.name === selectedCompany)?.id || ''}
                  onValueChange={handleCompanyChange}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.company && (
                  <p className="text-xs text-destructive">{errors.company}</p>
                )}
              </div>
            </div>
          </div>

          {/* Management Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <User className="h-4 w-4" />
              Management Information
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="manager" className="text-sm font-medium">
                  Manager Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="manager"
                    type="email"
                    value={formData.manager || ''}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    disabled={isViewMode}
                    className={cn("pl-10", errors.manager && "border-destructive focus-visible:ring-destructive")}
                    placeholder="manager@company.com"
                  />
                </div>
                {errors.manager && (
                  <p className="text-xs text-destructive">{errors.manager}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Building2 className="h-4 w-4" />
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
                  placeholder="Brief description of the department..."
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
                {mode === 'edit' ? 'Update Department' : 'Add Department'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
