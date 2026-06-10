'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DepartmentModal } from '@/components/department-modal'
import {
  Building2,
  Users,
} from 'lucide-react'
import { DepartmentsDataTable, type Department } from '@/components/departments-data-table'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; department?: Department }>({
    isOpen: false,
    mode: 'create'
  })

  useEffect(() => {
    fetchDepartments()
    fetchCompanies()
  }, [])


  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        // Handle both direct array and wrapped response
        const departments = Array.isArray(data) ? data : (data.data || [])
        setDepartments(departments)
        setError('') // Clear any previous errors
      } else {
        const errorData = await response.json()
        setError(`Failed to fetch departments: ${errorData.error || 'Unknown error'}`)
        setDepartments([]) // Set empty array to prevent undefined errors
      }
    } catch (error) {
      setError('Error fetching departments')
      setDepartments([]) // Set empty array to prevent undefined errors
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        const companiesData = data.data || data
        setCompanies(companiesData.map((c: any) => ({ id: c.id, name: c.name })))
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleSaveDepartment = async (departmentData: Partial<Department>) => {
    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(departmentData)
        })

        if (response.ok) {
          setSuccess('Department added successfully')
          fetchDepartments()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to add department')
          throw new Error(errorData.error || 'Failed to add department')
        }
      } else if (modalState.mode === 'edit' && modalState.department) {
        const response = await fetch(`/api/departments/${modalState.department.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(departmentData)
        })

        if (response.ok) {
          setSuccess('Department updated successfully')
          fetchDepartments()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to update department')
          throw new Error(errorData.error || 'Failed to update department')
        }
      }
    } catch (error) {
      throw error
    }
  }

  const handleEditClick = (department: Department) => {
    setModalState({ isOpen: true, mode: 'edit', department })
  }

  const handleDeleteClick = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess(`${name} has been deleted successfully`)
        fetchDepartments()
      } else {
        setError('Failed to delete department')
      }
    } catch (error) {
      setError('Error deleting department')
    }
  }

  const totalDepartments = departments.length
  const activeDepartments = departments.filter(d => d.isActive).length
  const totalEmployees = departments.reduce((sum, d) => sum + d.employeeCount, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Department Management</h1>
        <p className="text-muted-foreground">Manage departments and organizational structure</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              {activeDepartments} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Department Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDepartments > 0 ? Math.round(totalEmployees / totalDepartments) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Employees per department
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Departments Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Departments</CardTitle>
          <CardDescription className="mt-1.5">
            Manage department information and structure
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No departments found
            </div>
          ) : (
            <DepartmentsDataTable
              data={departments}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onAdd={() => setModalState({ isOpen: true, mode: 'create' })}
            />
          )}
        </CardContent>
      </Card>

      <DepartmentModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        department={modalState.department}
        mode={modalState.mode}
        onSave={handleSaveDepartment}
        companies={companies}
      />
    </div>
  )
}
