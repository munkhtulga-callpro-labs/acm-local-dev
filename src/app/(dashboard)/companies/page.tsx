'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building, Plus } from 'lucide-react'
import { CompanyModal } from '@/components/company-modal'
import { CompaniesDataTable, type Company } from '@/components/companies-data-table'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; company?: Company }>({
    isOpen: false,
    mode: 'create'
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.data || data)
      } else {
        setError('Failed to fetch companies')
      }
    } catch (error) {
      setError('Error fetching companies')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompany = async (companyData: Partial<Company>) => {
    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyData)
        })

        if (response.ok) {
          setSuccess('Company added successfully')
          fetchCompanies()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to add company')
          throw new Error(errorData.error || 'Failed to add company')
        }
      } else if (modalState.mode === 'edit' && modalState.company) {
        const response = await fetch(`/api/companies/${modalState.company.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyData)
        })

        if (response.ok) {
          setSuccess('Company updated successfully')
          fetchCompanies()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to update company')
          throw new Error(errorData.error || 'Failed to update company')
        }
      }
    } catch (error) {
      throw error
    }
  }

  const handleDeleteCompany = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess(`Company "${name}" deleted successfully`)
        fetchCompanies()
      } else {
        setError('Failed to delete company')
      }
    } catch (error) {
      setError('Error deleting company')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building className="h-8 w-8" />
            Company Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage companies and organizational structure
          </p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-50">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Companies Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <CompaniesDataTable
              data={companies}
              onEdit={(company) => setModalState({ isOpen: true, mode: 'edit', company })}
              onDelete={handleDeleteCompany}
            />
          )}
        </CardContent>
      </Card>

      <CompanyModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        company={modalState.company}
        mode={modalState.mode}
        onSave={handleSaveCompany}
      />
    </div>
  )
}
