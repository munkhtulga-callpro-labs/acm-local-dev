'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SoftwareLicenseModal } from '@/components/software-license-modal'
import {
  Package,
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

interface SoftwareLicense {
  id: string
  softwareName: string
  vendor: string
  licenseType: string
  totalSeats: number
  assignedSeats: number
  cost?: number | null
  purchaseDate?: string | null
  expiryRenewalDate?: string | null
  autoRenewal: boolean
  status: string
  owner: string
  createdAt: string
}

export default function SoftwareLicensesPage() {
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([])
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; license?: SoftwareLicense }>(
    {
      isOpen: false,
      mode: 'create'
    }
  )

  useEffect(() => {
    fetchLicenses()
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchLicenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/resources/software-licenses')
      if (response.ok) {
        const data = await response.json()
        setLicenses(data.data || [])
      } else {
        setError('Failed to fetch software licenses')
      }
    } catch (error) {
      setError('Error fetching software licenses')
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

  const handleSaveLicense = async (licenseData: Partial<SoftwareLicense>, owners?: any[]) => {
    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/resources/software-licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(licenseData)
        })

        if (response.ok) {
          const data = await response.json()
          const resourceId = data.data?.id

          // Save resource owners
          if (resourceId && licenseData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: licenseData.owner },
              ...(owners || [])
            ]

            const ownersResponse = await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'SOFTWARE_LICENSE',
                resourceId: resourceId,
                owners: allOwners
              })
            })

            if (!ownersResponse.ok) {
              const ownersError = await ownersResponse.json()
              setError(`Software license created but failed to save owners: ${ownersError.error || 'Unknown error'}`)
            }
          }

          setSuccess('Software license added successfully')
          fetchLicenses()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to add software license')
          throw new Error(errorData.error || 'Failed to add software license')
        }
      } else if (modalState.mode === 'edit' && modalState.license) {
        const response = await fetch(`/api/resources/software-licenses/${modalState.license.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(licenseData)
        })

        if (response.ok) {
          // Save resource owners
          if (licenseData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: licenseData.owner },
              ...(owners || [])
            ]

            await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'SOFTWARE_LICENSE',
                resourceId: modalState.license.id,
                owners: allOwners
              })
            })
          }

          setSuccess('Software license updated successfully')
          fetchLicenses()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to update software license')
          throw new Error(errorData.error || 'Failed to update software license')
        }
      }
    } catch (error) {
      throw error
    }
  }

  const handleDeleteLicense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this software license?')) return

    try {
      const response = await fetch(`/api/resources/software-licenses/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Software license deleted successfully')
        fetchLicenses()
      } else {
        setError('Failed to delete software license')
      }
    } catch (error) {
      setError('Error deleting software license')
    }
  }

  const filteredLicenses = licenses.filter(license =>
    license.softwareName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.licenseType?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getUtilizationPercentage = (assigned: number, total: number) => {
    return total > 0 ? (assigned / total) * 100 : 0
  }

  const getUtilizationBadge = (assigned: number, total: number) => {
    const percentage = getUtilizationPercentage(assigned, total)

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
      EXPIRING_SOON: 'bg-yellow-100 text-yellow-800',
      INACTIVE: 'bg-gray-100 text-gray-800'
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Package className="mr-3 h-8 w-8" />
          Software Licenses
        </h1>
        <p className="text-muted-foreground mt-2">
          Track software licenses and seat allocations - ISO 27001 Compliant
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
              placeholder="Search licenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
            <Plus className="mr-2 h-4 w-4" />
            Add License
          </Button>
        </div>
      </div>

      {/* License Table */}
      <Card>
        <CardHeader>
          <CardTitle>Software Licenses ({filteredLicenses.length})</CardTitle>
          <CardDescription>
            Manage software licenses, track seat allocations, and monitor renewal dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Software Licenses Found
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                Get started by adding your first software license
              </p>
              <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
                <Plus className="mr-2 h-4 w-4" />
                Add License
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Software Name</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Auto Renew</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        {license.softwareName}
                      </div>
                    </TableCell>
                    <TableCell>{license.vendor}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{license.licenseType}</Badge>
                    </TableCell>
                    <TableCell>
                      {license.assignedSeats} / {license.totalSeats}
                    </TableCell>
                    <TableCell>
                      {getUtilizationBadge(license.assignedSeats, license.totalSeats)}
                    </TableCell>
                    <TableCell>
                      {license.cost ? `$${license.cost.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={license.autoRenewal ? 'default' : 'secondary'}>
                        {license.autoRenewal ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(license.status)}>
                        {license.status}
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
                          <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'view', license })}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'edit', license })}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteLicense(license.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

      <SoftwareLicenseModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        license={modalState.license}
        mode={modalState.mode}
        onSave={handleSaveLicense}
        employees={employees}
        departments={departments}
      />
    </div>
  )
}
