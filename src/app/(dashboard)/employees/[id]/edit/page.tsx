'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Save,
  User,
  Building2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  department: string
  position: string
  manager?: string
  company: string
  isActive: boolean
  startDate: string
  endDate?: string
  employmentStatus: string
  workLocation: string
}

export default function EditEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('employees.edit')
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    manager: '',
    company: '',
    isActive: true,
    startDate: '',
    endDate: '',
    employmentStatus: 'FULL_TIME',
    workLocation: 'OFFICE'
  })

  const [departments, setDepartments] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])

  useEffect(() => {
    if (params.id) {
      fetchEmployeeDetails()
      fetchDropdownData()
    }
  }, [params.id])

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/employees/${params.id}`)
      if (response.ok) {
        const employeeData = await response.json()
        setEmployee(employeeData)
        setFormData({
          firstName: employeeData.firstName || '',
          lastName: employeeData.lastName || '',
          email: employeeData.email || '',
          phone: employeeData.phone || '',
          department: employeeData.department || '',
          position: employeeData.position || '',
          manager: employeeData.manager || '',
          company: employeeData.company || '',
          isActive: employeeData.isActive ?? true,
          startDate: employeeData.startDate ? new Date(employeeData.startDate).toISOString().split('T')[0] : '',
          endDate: employeeData.endDate ? new Date(employeeData.endDate).toISOString().split('T')[0] : '',
          employmentStatus: employeeData.employmentStatus || 'FULL_TIME',
          workLocation: employeeData.workLocation || 'OFFICE'
        })
      } else {
        setError(t('errors.fetchFailed'))
        const errorText = await response.text()
        console.error('Employee fetch error:', errorText)
      }
    } catch (error) {
      setError(t('errors.fetchError'))
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const deptResponse = await fetch('/api/departments')
      if (deptResponse.ok) {
        const deptData = await deptResponse.json()
        setDepartments(deptData.data || deptData || [])
      }

      const compResponse = await fetch('/api/companies')
      if (compResponse.ok) {
        const compData = await compResponse.json()
        setCompanies(compData.data || compData || [])
      }

      const posResponse = await fetch('/api/positions')
      if (posResponse.ok) {
        const posData = await posResponse.json()
        setPositions(posData.data || posData || [])
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/employees/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(t('success.updated'))
        setTimeout(() => {
          router.push(`/employees/${params.id}`)
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || t('errors.updateFailed'))
      }
    } catch (error) {
      setError(t('errors.updateError'))
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const filteredPositions = positions.filter(pos => {
    const selectedDept = departments.find(dept => dept.name === formData.department)
    return selectedDept && pos.departmentId === selectedDept.id
  })

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error && !employee) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push('/employees')}
          className="mt-4"
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToEmployees')}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/employees/${params.id}`)}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('title')}
              </h1>
              <p className="text-muted-foreground">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                {t('personalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">{t('labels.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('labels.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('labels.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t('labels.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                {t('workInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company">{t('labels.company')}</Label>
                  <Select
                    value={formData.company}
                    onValueChange={(value) => handleInputChange('company', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.company')} />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.name}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">{t('labels.department')}</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleInputChange('department', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.department')} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="position">{t('labels.position')}</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => handleInputChange('position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.position')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPositions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.name}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="manager">{t('labels.manager')}</Label>
                  <Input
                    id="manager"
                    value={formData.manager}
                    onChange={(e) => handleInputChange('manager', e.target.value)}
                    placeholder={t('placeholders.manager')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">{t('labels.startDate')}</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">{t('labels.endDate')}</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employmentStatus">{t('labels.employmentStatus')}</Label>
                    <Select
                      value={formData.employmentStatus}
                      onValueChange={(value) => handleInputChange('employmentStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">{t('employmentStatus.fullTime')}</SelectItem>
                        <SelectItem value="PART_TIME">{t('employmentStatus.partTime')}</SelectItem>
                        <SelectItem value="CONTRACT">{t('employmentStatus.contract')}</SelectItem>
                        <SelectItem value="TEMPORARY">{t('employmentStatus.temporary')}</SelectItem>
                        <SelectItem value="INTERN">{t('employmentStatus.intern')}</SelectItem>
                        <SelectItem value="ON_LEAVE">{t('employmentStatus.onLeave')}</SelectItem>
                        <SelectItem value="TERMINATED">{t('employmentStatus.terminated')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="workLocation">{t('labels.workLocation')}</Label>
                    <Select
                      value={formData.workLocation}
                      onValueChange={(value) => handleInputChange('workLocation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OFFICE">{t('workLocation.office')}</SelectItem>
                        <SelectItem value="REMOTE">{t('workLocation.remote')}</SelectItem>
                        <SelectItem value="HYBRID">{t('workLocation.hybrid')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/employees/${params.id}`)}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('saveChanges')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
