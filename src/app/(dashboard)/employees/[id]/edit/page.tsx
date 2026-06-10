'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form data
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

  // Dropdown data
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
        console.log('Employee data loaded:', employeeData)
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
        console.log('Form data set:', {
          department: employeeData.department,
          position: employeeData.position,
          company: employeeData.company
        })
      } else {
        setError('Failed to fetch employee details')
        const errorText = await response.text()
        console.error('Employee fetch error:', errorText)
      }
    } catch (error) {
      setError('Error fetching employee details')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      console.log('Fetching dropdown data...')
      
      // Fetch departments
      const deptResponse = await fetch('/api/departments')
      console.log('Departments response:', deptResponse.status)
      if (deptResponse.ok) {
        const deptData = await deptResponse.json()
        console.log('Departments data:', deptData)
        setDepartments(deptData.data || deptData || [])
      } else {
        console.error('Failed to fetch departments:', deptResponse.status)
        const errorText = await deptResponse.text()
        console.error('Departments error:', errorText)
      }

      // Fetch companies
      const compResponse = await fetch('/api/companies')
      console.log('Companies response:', compResponse.status)
      if (compResponse.ok) {
        const compData = await compResponse.json()
        console.log('Companies data:', compData)
        setCompanies(compData.data || compData || [])
      } else {
        console.error('Failed to fetch companies:', compResponse.status)
        const errorText = await compResponse.text()
        console.error('Companies error:', errorText)
      }

      // Fetch positions
      const posResponse = await fetch('/api/positions')
      console.log('Positions response:', posResponse.status)
      if (posResponse.ok) {
        const posData = await posResponse.json()
        console.log('Positions data:', posData)
        setPositions(posData.data || posData || [])
      } else {
        console.error('Failed to fetch positions:', posResponse.status)
        const errorText = await posResponse.text()
        console.error('Positions error:', errorText)
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
        setSuccess('Employee updated successfully!')
        setTimeout(() => {
          router.push(`/employees/${params.id}`)
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update employee')
      }
    } catch (error) {
      setError('Error updating employee')
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

  // Filter positions based on selected department
  const filteredPositions = positions.filter(pos => {
    // Find the department by name to get its ID
    const selectedDept = departments.find(dept => dept.name === formData.department)
    const matches = selectedDept && pos.departmentId === selectedDept.id
    console.log('Position filtering:', {
      position: pos.name,
      department: formData.department,
      selectedDept: selectedDept,
      posDepartmentId: pos.departmentId,
      selectedDeptId: selectedDept?.id,
      matches
    })
    return matches
  })

  console.log('Filtered positions:', filteredPositions)
  console.log('All positions:', positions)
  console.log('All departments:', departments)
  console.log('Form data department:', formData.department)

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
          Back to Employees
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
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Edit Employee
              </h1>
              <p className="text-muted-foreground">
                Update employee information and details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
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

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Personal Information - Takes 1/3 of the width */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Information - Takes 2/3 of the width */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Work Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Select 
                    value={formData.company} 
                    onValueChange={(value) => handleInputChange('company', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
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
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => handleInputChange('department', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
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
                  <Label htmlFor="position">Position</Label>
                  <Select 
                    value={formData.position} 
                    onValueChange={(value) => handleInputChange('position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
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
                  <Label htmlFor="manager">Manager</Label>
                  <Input
                    id="manager"
                    value={formData.manager}
                    onChange={(e) => handleInputChange('manager', e.target.value)}
                    placeholder="Manager email"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
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
                    <Label htmlFor="employmentStatus">Employment Status</Label>
                    <Select 
                      value={formData.employmentStatus} 
                      onValueChange={(value) => handleInputChange('employmentStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full-time</SelectItem>
                        <SelectItem value="PART_TIME">Part-time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="TEMPORARY">Temporary</SelectItem>
                        <SelectItem value="INTERN">Intern</SelectItem>
                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="workLocation">Work Location</Label>
                    <Select 
                      value={formData.workLocation} 
                      onValueChange={(value) => handleInputChange('workLocation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OFFICE">Office</SelectItem>
                        <SelectItem value="REMOTE">Remote</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/employees/${params.id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
