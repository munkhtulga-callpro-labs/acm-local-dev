'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VPNNetworkModal } from '@/components/vpn-network-modal'
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Network,
  User,
  Calendar
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

interface VPNNetworkResource {
  id: string
  profileName: string
  vpnType: string
  networkSegments: string
  accessLevel: string
  owner?: string | null
  deviceRestrictions?: string | null
  assignedTo?: string | null
  validFrom: string
  validTo?: string | null
  status: string
  notes?: string | null
  ipWhitelist?: string | null
  splitTunnel: boolean
  requestedBy?: string | null
  approvedBy?: string | null
  createdAt: string
}

export default function VPNNetworkPage() {
  const t = useTranslations('vpnNetwork')
  const [vpnNetworks, setVpnNetworks] = useState<VPNNetworkResource[]>([])
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; vpnNetwork?: VPNNetworkResource }>({
    isOpen: false,
    mode: 'create'
  })

  useEffect(() => {
    fetchVPNNetworks()
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchVPNNetworks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/resources/vpn-network-access')
      if (response.ok) {
        const data = await response.json()
        setVpnNetworks(data.data || [])
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

  const handleSaveVPNNetwork = async (vpnNetworkData: Partial<VPNNetworkResource>, owners?: any[]) => {
    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/resources/vpn-network-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vpnNetworkData)
        })

        if (response.ok) {
          const data = await response.json()
          const resourceId = data.data?.id

          // Save resource owners
          if (resourceId && vpnNetworkData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: vpnNetworkData.owner },
              ...(owners || [])
            ]

            await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'VPN_NETWORK_ACCESS',
                resourceId: resourceId,
                owners: allOwners
              })
            })
          }

          setSuccess(t('success.added'))
          fetchVPNNetworks()
        } else {
          const errorData = await response.json()
          setError(errorData.error || t('errors.addFailed'))
          throw new Error(errorData.error || t('errors.addFailed'))
        }
      } else if (modalState.mode === 'edit' && modalState.vpnNetwork) {
        const response = await fetch(`/api/resources/vpn-network-access/${modalState.vpnNetwork.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vpnNetworkData)
        })

        if (response.ok) {
          // Update resource owners
          if (vpnNetworkData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: vpnNetworkData.owner },
              ...(owners || [])
            ]

            await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'VPN_NETWORK_ACCESS',
                resourceId: modalState.vpnNetwork.id,
                owners: allOwners
              })
            })
          }

          setSuccess(t('success.updated'))
          fetchVPNNetworks()
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

  const handleDeleteVPNNetwork = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return

    try {
      const response = await fetch(`/api/resources/vpn-network-access/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess(t('success.deleted'))
        fetchVPNNetworks()
      } else {
        setError(t('errors.deleteFailed'))
      }
    } catch {
      setError(t('errors.deleteError'))
    }
  }

  const filteredVPNNetworks = vpnNetworks.filter(vpn =>
    vpn.profileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vpn.vpnType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vpn.networkSegments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vpn.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vpn.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getVPNTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      'Site-to-Site': 'bg-blue-100 text-blue-800',
      'Remote Access': 'bg-green-100 text-green-800',
      'Client VPN': 'bg-purple-100 text-purple-800',
      'SSL VPN': 'bg-orange-100 text-orange-800',
      'IPSec VPN': 'bg-cyan-100 text-cyan-800',
      'MPLS': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    }
    return variants[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'EXPIRED': 'bg-red-100 text-red-800',
      'SUSPENDED': 'bg-orange-100 text-orange-800'
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  const getAccessLevelBadge = (level: string) => {
    const variants: Record<string, string> = {
      'Standard': 'bg-green-100 text-green-800',
      'Elevated': 'bg-blue-100 text-blue-800',
      'Privileged': 'bg-orange-100 text-orange-800',
      'Admin': 'bg-red-100 text-red-800',
      'Full Access': 'bg-purple-100 text-purple-800'
    }
    return variants[level] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Shield className="mr-3 h-8 w-8" />
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
            {t('addAccess')}
          </Button>
        </div>
      </div>

      {/* VPN Network Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('cardTitle', { count: filteredVPNNetworks.length })}</CardTitle>
          <CardDescription>
            {t('cardDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredVPNNetworks.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t('noAccess')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                {t('noAccessDesc')}
              </p>
              <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addAccess')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.profileName')}</TableHead>
                  <TableHead>{t('table.vpnType')}</TableHead>
                  <TableHead>{t('table.accessLevel')}</TableHead>
                  <TableHead>{t('table.networkSegments')}</TableHead>
                  <TableHead>{t('table.assignedTo')}</TableHead>
                  <TableHead>{t('table.validPeriod')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead className="w-[100px]">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVPNNetworks.map((vpn) => (
                  <TableRow key={vpn.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{vpn.profileName}</div>
                          {vpn.splitTunnel && (
                            <div className="text-xs text-muted-foreground">{t('splitTunnel')}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getVPNTypeBadge(vpn.vpnType)}>
                        {vpn.vpnType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAccessLevelBadge(vpn.accessLevel)}>
                        {vpn.accessLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Network className="mr-2 h-3 w-3 text-muted-foreground" />
                        <div className="text-sm max-w-[200px] truncate" title={vpn.networkSegments}>
                          {vpn.networkSegments}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vpn.assignedTo ? (
                        <div className="flex items-center text-sm">
                          <User className="mr-2 h-3 w-3 text-muted-foreground" />
                          {vpn.assignedTo}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">{t('unassigned')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-3 w-3 text-muted-foreground" />
                        <div>
                          <div>{formatDate(vpn.validFrom)}</div>
                          {vpn.validTo && (
                            <div className="text-xs text-muted-foreground">{t('validTo', { date: formatDate(vpn.validTo) })}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(vpn.status)}>
                        {vpn.status}
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
                          <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'view', vpnNetwork: vpn })}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('table.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'edit', vpnNetwork: vpn })}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('table.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteVPNNetwork(vpn.id)}
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

      <VPNNetworkModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        vpnNetwork={modalState.vpnNetwork}
        mode={modalState.mode}
        onSave={handleSaveVPNNetwork}
        employees={employees}
        departments={departments}
      />
    </div>
  )
}
