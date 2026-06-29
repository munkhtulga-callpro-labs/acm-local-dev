'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { User, Briefcase, Mail, Phone, Calendar, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Employee {
  id: string
  employeeId?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  department: string
  position: string
  manager?: string
  company: string
  isActive?: boolean
  startDate: string
  endDate?: string
}

interface EmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  employee?: Employee
  mode: 'view' | 'edit' | 'create'
  onSave: (employee: Partial<Employee>) => Promise<void>
  companies: Array<{ id: string; name: string }>
  departments: Array<{ id: string; name: string; company: string }>
  positions: Array<{ id: string; name: string; departmentId: string }>
}

export function EmployeeModal({
  isOpen,
  onClose,
  employee,
  mode,
  onSave,
  companies,
  departments,
  positions
}: EmployeeModalProps) {
  const t = useTranslations('employees.modal')

  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    manager: '',
    company: '',
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
  })

  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filteredDepartments = departments

  const selectedDept = departments.find(d => d.name === selectedDepartment)
  const filteredPositions = selectedDept
    ? positions.filter(pos => pos.departmentId === selectedDept.id)
    : []

  useEffect(() => {
    if (employee && mode !== 'create') {
      setFormData(employee)
      setSelectedCompany(employee.company)
      setSelectedDepartment(employee.department)
      setSelectedPosition(employee.position)
    } else if (mode === 'create') {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        manager: '',
        company: '',
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
      })
      setSelectedCompany('')
      setSelectedDepartment('')
      setSelectedPosition('')
    }
    setErrors({})
  }, [employee, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName?.trim()) newErrors.firstName = t('errors.firstNameRequired')
    if (!formData.lastName?.trim()) newErrors.lastName = t('errors.lastNameRequired')
    if (!formData.email?.trim()) {
      newErrors.email = t('errors.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('errors.invalidEmail')
    }
    if (!selectedCompany) newErrors.company = t('errors.companyRequired')
    if (!selectedDepartment) newErrors.department = t('errors.departmentRequired')
    if (!selectedPosition) newErrors.position = t('errors.positionRequired')
    if (!formData.startDate) newErrors.startDate = t('errors.startDateRequired')

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
        company: selectedCompany,
        department: selectedDepartment,
        position: selectedPosition,
      })
      onClose()
    } catch (error) {
      console.error('Error saving employee:', error)
      setErrors({ submit: t('errors.saveFailed') })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    setSelectedCompany(company?.name || '')
    setSelectedDepartment('')
    setSelectedPosition('')
  }

  const handleDepartmentChange = (departmentName: string) => {
    setSelectedDepartment(departmentName)
    setSelectedPosition('')
  }

  const isViewMode = mode === 'view'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            {mode === 'view' && t('titleView')}
            {mode === 'edit' && t('titleEdit')}
            {mode === 'create' && t('titleCreate')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && t('descriptionView')}
            {mode === 'edit' && t('descriptionEdit')}
            {mode === 'create' && t('descriptionCreate')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <User className="h-4 w-4" />
              {t('basicInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  {t('firstName')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.firstName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  {t('lastName')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.lastName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Mail className="h-4 w-4" />
              {t('contactInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('emailAddress')} {!isViewMode && <span className="text-destructive">*</span>}
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
                    placeholder="john.doe@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t('phoneNumber')}
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
            </div>
          </div>

          {/* Employment Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Briefcase className="h-4 w-4" />
              {t('employmentDetails')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  {t('company')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={companies.find(c => c.name === selectedCompany)?.id || ''}
                  onValueChange={handleCompanyChange}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t('selectCompany')} />
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

              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">
                  {t('department')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={handleDepartmentChange}
                  disabled={isViewMode || !selectedCompany}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={!selectedCompany ? t('selectCompanyFirst') : t('selectDepartment')} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-xs text-destructive">{errors.department}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-medium">
                  {t('position')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={selectedPosition}
                  onValueChange={(value) => setSelectedPosition(value)}
                  disabled={isViewMode || !selectedDepartment}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={!selectedDepartment ? t('selectDepartmentFirst') : t('selectPosition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPositions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.name}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.position && (
                  <p className="text-xs text-destructive">{errors.position}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager" className="text-sm font-medium">
                  {t('managerEmail')}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="manager"
                    type="email"
                    value={formData.manager || ''}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                    placeholder="manager@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  {t('startDate')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={isViewMode}
                    className={cn("pl-10", errors.startDate && "border-destructive focus-visible:ring-destructive")}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-xs text-destructive">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  {t('endDate')}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                  />
                </div>
              </div>

              {!isViewMode && (
                <div className="space-y-2">
                  <Label htmlFor="isActive" className="text-sm font-medium">
                    {t('employmentStatus')}
                  </Label>
                  <div className="flex items-center space-x-3 pt-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive" className="text-sm text-muted-foreground cursor-pointer">
                      {formData.isActive ? t('activeEmployee') : t('inactiveEmployee')}
                    </Label>
                  </div>
                </div>
              )}
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
              {isViewMode ? t('close') : t('cancel')}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-28"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? t('updateEmployee') : t('addEmployee')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
