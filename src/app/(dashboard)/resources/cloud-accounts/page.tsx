'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CloudAccountModal } from '@/components/cloud-account-modal'
import {
  Cloud,
  Shield,
  Activity,
  DollarSign,
} from 'lucide-react'
import { CloudAccountsDataTable, type CloudAccountResource } from '@/components/cloud-accounts-data-table'

export default function CloudAccountsPage() {
  const t = useTranslations('cloudAccounts')
  const [cloudAccounts, setCloudAccounts] = useState<CloudAccountResource[]>([])
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; cloudAccount?: any }>({
    isOpen: false,
    mode: 'create'
  })

  useEffect(() => {
    fetchCloudAccounts()
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchCloudAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/resources/cloud-accounts')
      if (response.ok) {
        const data = await response.json()
        setCloudAccounts(data.data || [])
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

  const handleSaveCloudAccount = async (cloudAccountData: any, owners?: any[]) => {
    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/resources/cloud-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cloudAccountData)
        })

        if (response.ok) {
          const data = await response.json()
          const resourceId = data.data?.id

          // Save resource owners
          if (resourceId && cloudAccountData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: cloudAccountData.owner },
              ...(owners || [])
            ]

            const ownersResponse = await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'CLOUD_ACCOUNT',
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
          fetchCloudAccounts()
        } else {
          const errorData = await response.json()
          setError(errorData.error || t('errors.addFailed'))
          throw new Error(errorData.error || t('errors.addFailed'))
        }
      } else if (modalState.mode === 'edit' && modalState.cloudAccount) {
        const response = await fetch(`/api/resources/cloud-accounts/${modalState.cloudAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cloudAccountData)
        })

        if (response.ok) {
          // Save resource owners
          if (cloudAccountData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: cloudAccountData.owner },
              ...(owners || [])
            ]

            await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'CLOUD_ACCOUNT',
                resourceId: modalState.cloudAccount.id,
                owners: allOwners
              })
            })
          }

          setSuccess(t('success.updated'))
          fetchCloudAccounts()
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

  const handleEditClick = (account: CloudAccountResource) => {
    setModalState({ isOpen: true, mode: 'edit', cloudAccount: account })
  }

  const handleDeleteCloudAccount = async (id: string, name: string) => {
    if (!confirm(t('confirmDelete', { name }))) return

    try {
      const response = await fetch(`/api/resources/cloud-accounts/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess(t('success.deleted', { name }))
        fetchCloudAccounts()
      } else {
        setError(t('errors.deleteFailed'))
      }
    } catch {
      setError(t('errors.deleteError'))
    }
  }

  const totalAccounts = cloudAccounts.length
  const productionAccounts = cloudAccounts.filter(a => a.environment.toLowerCase() === 'production').length
  const mfaEnabled = cloudAccounts.filter(a => a.mfaRequired).length
  const activeAccounts = cloudAccounts.filter(a => a.status === 'ACTIVE').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
          <Cloud className="mr-2 h-4 w-4" />
          {t('addAccount')}
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
            <CardTitle className="text-sm font-medium">{t('stats.totalAccounts')}</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.activeCount', { count: activeAccounts })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.production')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionAccounts}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.productionDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.mfaEnabled')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mfaEnabled}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.mfaEnabledDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.costCenters')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cloudAccounts.filter(a => a.costCenter).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('stats.costCentersDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cloud Accounts Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t('cardTitle')}</CardTitle>
          <CardDescription className="mt-1.5">
            {t('cardDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cloudAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noAccounts')}
            </div>
          ) : (
            <CloudAccountsDataTable
              data={cloudAccounts}
              onEdit={handleEditClick}
              onDelete={handleDeleteCloudAccount}
            />
          )}
        </CardContent>
      </Card>

      <CloudAccountModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        cloudAccount={modalState.cloudAccount}
        mode={modalState.mode}
        onSave={handleSaveCloudAccount}
        employees={employees}
        departments={departments}
      />
    </div>
  )
}
