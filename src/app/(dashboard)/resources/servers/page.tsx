'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ServerModal } from '@/components/server-modal'
import {
  Server,
  Activity,
  Shield,
  HardDrive,
} from 'lucide-react'
import { ServersDataTable, type ServerResource } from '@/components/servers-data-table'

export default function ServersPage() {
  const t = useTranslations('servers')
  const [servers, setServers] = useState<ServerResource[]>([])
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; server?: any }>({
    isOpen: false,
    mode: 'create'
  })

  useEffect(() => {
    fetchServers()
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchServers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/resources/servers')
      if (response.ok) {
        const data = await response.json()
        setServers(data.data || [])
      } else {
        setError(t('errors.fetchFailed'))
      }
    } catch (error) {
      setError(t('errors.fetchError'))
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

  const handleSaveServer = async (serverData: any, owners?: any[]) => {
    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/resources/servers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serverData)
        })

        if (response.ok) {
          const data = await response.json()
          const resourceId = data.data?.id

          // Save resource owners
          if (resourceId && serverData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: serverData.owner },
              ...(owners || [])
            ]

            const ownersResponse = await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'SERVER',
                resourceId: resourceId,
                owners: allOwners
              })
            })

            if (!ownersResponse.ok) {
              const ownersError = await ownersResponse.json()
              setError(t('errors.ownersFailed', { error: ownersError.error || 'Unknown error' }))
            }
          }

          setSuccess(t('success.added'))
          fetchServers()
        } else {
          const errorData = await response.json()
          setError(errorData.error || t('errors.addFailed'))
          throw new Error(errorData.error || t('errors.addFailed'))
        }
      } else if (modalState.mode === 'edit' && modalState.server) {
        const response = await fetch(`/api/resources/servers/${modalState.server.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serverData)
        })

        if (response.ok) {
          // Save resource owners
          if (serverData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: serverData.owner },
              ...(owners || [])
            ]

            await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'SERVER',
                resourceId: modalState.server.id,
                owners: allOwners
              })
            })
          }

          setSuccess(t('success.updated'))
          fetchServers()
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

  const handleEditClick = (server: ServerResource) => {
    setModalState({ isOpen: true, mode: 'edit', server })
  }

  const handleDeleteServer = async (id: string, name: string) => {
    if (!confirm(t('confirmDelete', { name }))) return

    try {
      const response = await fetch(`/api/resources/servers/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess(t('success.deleted', { name }))
        fetchServers()
      } else {
        setError(t('errors.deleteFailed'))
      }
    } catch {
      setError(t('errors.deleteError'))
    }
  }

  const totalServers = servers.length
  const activeServers = servers.filter(s => s.isActive).length
  const productionServers = servers.filter(s => s.environment.toLowerCase() === 'production').length
  const adminAccessServers = servers.filter(s => s.accessLevel.toLowerCase() === 'admin' || s.accessLevel.toLowerCase() === 'full').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
          <Server className="mr-2 h-4 w-4" />
          {t('addServer')}
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
            <CardTitle className="text-sm font-medium">{t('stats.totalServers')}</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServers}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.activeServers', { count: activeServers })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.production')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionServers}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.productionDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.adminAccess')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminAccessServers}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.adminAccessDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.inactive')}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServers - activeServers}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.inactiveDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Servers Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t('serversCard')}</CardTitle>
          <CardDescription className="mt-1.5">
            {t('serversCardDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noServers')}
            </div>
          ) : (
            <ServersDataTable
              data={servers}
              onEdit={handleEditClick}
              onDelete={handleDeleteServer}
            />
          )}
        </CardContent>
      </Card>

      <ServerModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        server={modalState.server}
        mode={modalState.mode}
        onSave={handleSaveServer}
        employees={employees}
        departments={departments}
      />
    </div>
  )
}
