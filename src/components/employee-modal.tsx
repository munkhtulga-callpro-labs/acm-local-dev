'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { User, Briefcase, Mail, Phone, Calendar, Building2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
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

  // Filter departments and positions based on selected company/department
  // Since departments are now company-agnostic (company="All"), show all departments
  const filteredDepartments = departments
  
  // Find the selected department by name to get its ID
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

    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!selectedCompany) newErrors.company = 'Company is required'
    if (!selectedDepartment) newErrors.department = 'Department is required'
    if (!selectedPosition) newErrors.position = 'Position is required'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'

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
      setErrors({ submit: 'Failed to save employee. Please try again.' })
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
            {mode === 'view' && 'Employee Details'}
            {mode === 'edit' && 'Edit Employee'}
            {mode === 'create' && 'Add New Employee'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this employee.'}
            {mode === 'edit' && 'Update employee information. Fields marked with * are required.'}
            {mode === 'create' && 'Fill in the details to add a new employee. Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <User className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name {!isViewMode && <span className="text-destructive">*</span>}
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
                  Last Name {!isViewMode && <span className="text-destructive">*</span>}
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
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address {!isViewMode && <span className="text-destructive">*</span>}
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
            </div>
          </div>

          {/* Employment Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Briefcase className="h-4 w-4" />
              Employment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">
                  Department {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={handleDepartmentChange}
                  disabled={isViewMode || !selectedCompany}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={!selectedCompany ? "Select company first" : "Select department"} />
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
                  Position {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={selectedPosition}
                  onValueChange={(value) => setSelectedPosition(value)}
                  disabled={isViewMode || !selectedDepartment}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={!selectedDepartment ? "Select department first" : "Select position"} />
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
                  Manager Email
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
                  Start Date {!isViewMode && <span className="text-destructive">*</span>}
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
                  End Date
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
                    Employment Status
                  </Label>
                  <div className="flex items-center space-x-3 pt-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive" className="text-sm text-muted-foreground cursor-pointer">
                      {formData.isActive ? 'Active Employee' : 'Inactive Employee'}
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
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-28"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? 'Update Employee' : 'Add Employee'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
