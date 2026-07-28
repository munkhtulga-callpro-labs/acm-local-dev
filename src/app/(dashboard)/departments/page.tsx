'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DepartmentModal } from '@/components/department-modal'
import { DepartmentAccessTemplatesModal } from '@/components/department-access-templates-modal'
import { isPrivilegedRole } from '@/lib/roles'
import {
  Building2,
  Users,
} from 'lucide-react'
import { DepartmentsDataTable, type Department } from '@/components/departments-data-table'

export default function DepartmentsPage() {
  const t = useTranslations('departments')
  const { data: session } = useSession()
  const canManageAccessTemplates = isPrivilegedRole(session?.user?.role ?? '')
  const [departments, setDepartments] = useState<Department[]>([])
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; department?: Department }>({
    isOpen: false,
    mode: 'create'
  })
  const [accessModalState, setAccessModalState] = useState<{ isOpen: boolean; department?: Department }>({
    isOpen: false
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
        setError(t('errors.fetchFailed', { error: errorData.error || 'Unknown error' }))
        setDepartments([])
      }
    } catch {
      setError(t('errors.fetchError'))
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
          setSuccess(t('success.added'))
          fetchDepartments()
        } else {
          const errorData = await response.json()
          setError(errorData.error || t('errors.addFailed'))
          throw new Error(errorData.error || t('errors.addFailed'))
        }
      } else if (modalState.mode === 'edit' && modalState.department) {
        const response = await fetch(`/api/departments/${modalState.department.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(departmentData)
        })

        if (response.ok) {
          setSuccess(t('success.updated'))
          fetchDepartments()
        } else {
          const errorData = await response.json()
          setError(errorData.error || t('errors.updateFailed'))
          throw new Error(errorData.error || t('errors.updateFailed'))
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
    if (!confirm(t('confirmDelete', { name }))) return

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess(t('success.deleted', { name }))
        fetchDepartments()
      } else {
        setError(t('errors.deleteFailed'))
      }
    } catch {
      setError(t('errors.deleteError'))
    }
  }

  const totalDepartments = departments.length
  const activeDepartments = departments.filter(d => d.isActive).length
  const totalEmployees = departments.reduce((sum, d) => sum + d.employeeCount, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
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
            <CardTitle className="text-sm font-medium">{t('totalDepartments')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              {t('activeDepartments', { count: activeDepartments })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalEmployees')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {t('acrossAllDepartments')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('avgSize')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDepartments > 0 ? Math.round(totalEmployees / totalDepartments) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('employeesPerDepartment')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Departments Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t('departmentsCard')}</CardTitle>
          <CardDescription className="mt-1.5">
            {t('departmentsCardDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noDepartments')}
            </div>
          ) : (
            <DepartmentsDataTable
              data={departments}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onManageAccess={(department) => setAccessModalState({ isOpen: true, department })}
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

      <DepartmentAccessTemplatesModal
        isOpen={accessModalState.isOpen}
        onClose={() => setAccessModalState({ isOpen: false })}
        department={accessModalState.department}
        canManage={canManageAccessTemplates}
      />
    </div>
  )
}
