'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DatabaseModal } from '@/components/database-modal'
import {
  Database,
  Server,
  Shield,
} from 'lucide-react'
import { DatabasesDataTable, type DatabaseResource } from '@/components/databases-data-table'

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<DatabaseResource[]>([])
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; database?: DatabaseResource }>({
    isOpen: false,
    mode: 'create'
  })

  useEffect(() => {
    fetchDatabases()
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchDatabases = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/resources/databases')
      if (response.ok) {
        const data = await response.json()
        setDatabases(data.data || [])
      } else {
        setError('Failed to fetch databases')
      }
    } catch (error) {
      setError('Error fetching databases')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.data || data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data || data || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleSaveDatabase = async (databaseData: Partial<DatabaseResource>, owners: any[]) => {
    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/resources/databases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(databaseData)
        })

        if (response.ok) {
          const data = await response.json()
          const resourceId = data.data?.id

          if (resourceId && databaseData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: databaseData.owner },
              ...owners
            ]

            const ownersResponse = await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'DATABASE',
                resourceId: resourceId,
                owners: allOwners
              })
            })

            if (!ownersResponse.ok) {
              const ownersError = await ownersResponse.json()
              setError(`Database created but failed to save owners: ${ownersError.error || 'Unknown error'}`)
            }
          }

          setSuccess('Database added successfully')
          fetchDatabases()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to add database')
          throw new Error(errorData.error || 'Failed to add database')
        }
      } else if (modalState.mode === 'edit' && modalState.database) {
        const response = await fetch(`/api/resources/databases/${modalState.database.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(databaseData)
        })

        if (response.ok) {
          if (databaseData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: databaseData.owner },
              ...owners
            ]

            await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'DATABASE',
                resourceId: modalState.database.id,
                owners: allOwners
              })
            })
          }

          setSuccess('Database updated successfully')
          fetchDatabases()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to update database')
          throw new Error(errorData.error || 'Failed to update database')
        }
      }
    } catch (error) {
      throw error
    }
  }

  const handleViewDatabase = (database: DatabaseResource) => {
    setModalState({ isOpen: true, mode: 'view', database })
  }

  const handleEditDatabase = (database: DatabaseResource) => {
    setModalState({ isOpen: true, mode: 'edit', database })
  }

  const handleDeleteDatabase = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      const response = await fetch(`/api/resources/databases/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess(`${name} deleted successfully`)
        fetchDatabases()
      } else {
        setError('Failed to delete database')
      }
    } catch (error) {
      setError('Error deleting database')
    }
  }

  const totalDatabases = databases.length
  const activeDatabases = databases.filter(db => db.isActive).length
  const encryptedDatabases = databases.filter(db => db.isEncrypted).length
  const productionDatabases = databases.filter(db => db.environment.toLowerCase() === 'production').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Database Resources</h1>
          <p className="text-muted-foreground">Manage database access and permissions - ISO 27001 Compliant</p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
          <Database className="mr-2 h-4 w-4" />
          Add Database
        </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Databases</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDatabases}</div>
            <p className="text-xs text-muted-foreground">
              {activeDatabases} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionDatabases}</div>
            <p className="text-xs text-muted-foreground">
              Production databases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encrypted</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{encryptedDatabases}</div>
            <p className="text-xs text-muted-foreground">
              With encryption enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDatabases > 0 ? Math.round((encryptedDatabases / totalDatabases) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Encryption rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Databases</CardTitle>
          <CardDescription className="mt-1.5">
            Track and manage access to MySQL, PostgreSQL, MongoDB, and other database systems
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : databases.length === 0 ? (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Databases Found
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Get started by adding your first database resource
              </p>
            </div>
          ) : (
            <DatabasesDataTable
              data={databases}
              onView={handleViewDatabase}
              onEdit={handleEditDatabase}
              onDelete={handleDeleteDatabase}
            />
          )}
        </CardContent>
      </Card>

      <DatabaseModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        database={modalState.database}
        mode={modalState.mode}
        onSave={handleSaveDatabase}
        employees={employees}
        departments={departments}
      />
    </div>
  )
}
