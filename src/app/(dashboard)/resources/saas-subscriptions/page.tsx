'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SaaSSubscriptionModal } from '@/components/saas-subscription-modal'
import {
  Cloud,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface SaaSSubscription {
  id: string
  serviceName: string
  category: string
  subscriptionPlan: string
  totalSeats: number
  usedSeats: number
  billingCycle: string
  cost?: number | null
  renewalDate?: string | null
  owner: string
  ownerDepartment?: string | null
  status: string
  ssoEnabled: boolean
  apiAccess: boolean
  createdAt: string
}

export default function SaaSSubscriptionsPage() {
  const t = useTranslations('saasSubscriptions')
  const [subscriptions, setSubscriptions] = useState<SaaSSubscription[]>([])
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; subscription?: SaaSSubscription }>(
    {
      isOpen: false,
      mode: 'create'
    }
  )

  useEffect(() => {
    fetchSubscriptions()
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/resources/saas-subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.data || [])
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

  const handleSaveSubscription = async (subscriptionData: Partial<SaaSSubscription>, owners?: any[]) => {
    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/resources/saas-subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscriptionData)
        })

        if (response.ok) {
          const data = await response.json()
          const resourceId = data.data?.id

          // Save resource owners
          if (resourceId && subscriptionData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: subscriptionData.owner },
              ...(owners || [])
            ]

            const ownersResponse = await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'SAAS_SUBSCRIPTION',
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
          fetchSubscriptions()
        } else {
          const errorData = await response.json()
          setError(errorData.error || t('errors.addFailed'))
          throw new Error(errorData.error || t('errors.addFailed'))
        }
      } else if (modalState.mode === 'edit' && modalState.subscription) {
        const response = await fetch(`/api/resources/saas-subscriptions/${modalState.subscription.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscriptionData)
        })

        if (response.ok) {
          // Save resource owners
          if (subscriptionData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: subscriptionData.owner },
              ...(owners || [])
            ]

            await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'SAAS_SUBSCRIPTION',
                resourceId: modalState.subscription.id,
                owners: allOwners
              })
            })
          }

          setSuccess(t('success.updated'))
          fetchSubscriptions()
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

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return

    try {
      const response = await fetch(`/api/resources/saas-subscriptions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess(t('success.deleted'))
        fetchSubscriptions()
      } else {
        setError(t('errors.deleteFailed'))
      }
    } catch {
      setError(t('errors.deleteError'))
    }
  }

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.subscriptionPlan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.ownerDepartment?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getUtilizationPercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0
  }

  const getUtilizationBadge = (used: number, total: number) => {
    const percentage = getUtilizationPercentage(used, total)

    if (percentage >= 95) {
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {percentage.toFixed(0)}%
        </Badge>
      )
    } else if (percentage >= 80) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {percentage.toFixed(0)}%
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <TrendingDown className="h-3 w-3" />
          {percentage.toFixed(0)}%
        </Badge>
      )
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      INACTIVE: 'bg-gray-100 text-gray-800'
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Cloud className="mr-3 h-8 w-8" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
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

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
            <Plus className="mr-2 h-4 w-4" />
            {t('addSubscription')}
          </Button>
        </div>
      </div>

      {/* Subscription Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('cardTitle', { count: filteredSubscriptions.length })}</CardTitle>
          <CardDescription>
            {t('cardDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <Cloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t('noSubscriptions')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                {t('noSubscriptionsDesc')}
              </p>
              <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addSubscription')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.serviceName')}</TableHead>
                  <TableHead>{t('table.category')}</TableHead>
                  <TableHead>{t('table.plan')}</TableHead>
                  <TableHead>{t('table.users')}</TableHead>
                  <TableHead>{t('table.utilization')}</TableHead>
                  <TableHead>{t('table.cost')}</TableHead>
                  <TableHead>{t('table.billingCycle')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead className="w-[100px]">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Cloud className="mr-2 h-4 w-4 text-muted-foreground" />
                        {subscription.serviceName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subscription.category}</Badge>
                    </TableCell>
                    <TableCell>{subscription.subscriptionPlan}</TableCell>
                    <TableCell>
                      {subscription.usedSeats} / {subscription.totalSeats}
                    </TableCell>
                    <TableCell>
                      {getUtilizationBadge(subscription.usedSeats, subscription.totalSeats)}
                    </TableCell>
                    <TableCell>
                      {subscription.cost ? `$${subscription.cost.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{subscription.billingCycle}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(subscription.status)}>
                        {subscription.status === 'ACTIVE' ? t('table.statusActive')
                          : subscription.status === 'EXPIRED' ? t('table.statusExpired')
                          : subscription.status === 'CANCELLED' ? t('table.statusCancelled')
                          : subscription.status === 'INACTIVE' ? t('table.statusInactive')
                          : subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'view', subscription })}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('table.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'edit', subscription })}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('table.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteSubscription(subscription.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('table.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SaaSSubscriptionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        subscription={modalState.subscription}
        mode={modalState.mode}
        onSave={handleSaveSubscription}
        employees={employees}
        departments={departments}
      />
    </div>
  )
}
