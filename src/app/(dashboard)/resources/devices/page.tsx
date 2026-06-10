'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DeviceModal } from '@/components/device-modal'
import {
  Laptop,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Shield,
  CheckCircle2,
  XCircle,
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

interface DeviceResource {
  id: string
  deviceType: string
  makeModel: string
  serialNumber?: string | null
  assetTag?: string | null
  operatingSystem?: string | null
  assignedTo?: string | null
  assignmentDate?: string | null
  location?: string | null
  condition?: string | null
  purchaseDate?: string | null
  warrantyExpiry?: string | null
  status: string
  specifications?: string | null
  purchaseCost?: number | null
  owner: string
  createdAt: string
  updatedAt: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceResource[]>([])
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; device?: any }>({
    isOpen: false,
    mode: 'create'
  })

  useEffect(() => {
    fetchDevices()
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/resources/devices')
      if (response.ok) {
        const data = await response.json()
        setDevices(data.data || [])
      } else {
        setError('Failed to fetch devices')
      }
    } catch (error) {
      setError('Error fetching devices')
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

  const handleSaveDevice = async (deviceData: any, owners?: any[]) => {
    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/resources/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deviceData)
        })

        if (response.ok) {
          const data = await response.json()
          const resourceId = data.data?.id

          // Save resource owners
          if (resourceId && deviceData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: deviceData.owner },
              ...(owners || [])
            ]

            const ownersResponse = await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'DEVICE',
                resourceId: resourceId,
                owners: allOwners
              })
            })

            if (!ownersResponse.ok) {
              const ownersError = await ownersResponse.json()
              setError(`Device created but failed to save owners: ${ownersError.error || 'Unknown error'}`)
            }
          }

          setSuccess('Device added successfully')
          fetchDevices()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to add device')
          throw new Error(errorData.error || 'Failed to add device')
        }
      } else if (modalState.mode === 'edit' && modalState.device) {
        const response = await fetch(`/api/resources/devices/${modalState.device.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deviceData)
        })

        if (response.ok) {
          // Save resource owners
          if (deviceData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: deviceData.owner },
              ...(owners || [])
            ]

            await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'DEVICE',
                resourceId: modalState.device.id,
                owners: allOwners
              })
            })
          }

          setSuccess('Device updated successfully')
          fetchDevices()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to update device')
          throw new Error(errorData.error || 'Failed to update device')
        }
      }
    } catch (error) {
      throw error
    }
  }

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device resource?')) return

    try {
      const response = await fetch(`/api/resources/devices/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Device deleted successfully')
        fetchDevices()
      } else {
        setError('Failed to delete device')
      }
    } catch (error) {
      setError('Error deleting device')
    }
  }

  const filteredDevices = devices.filter(dev =>
    dev.deviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dev.makeModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dev.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dev.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dev.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dev.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDeviceTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      'Laptop': 'bg-blue-100 text-blue-800',
      'Desktop': 'bg-purple-100 text-purple-800',
      'Mobile': 'bg-green-100 text-green-800',
      'Tablet': 'bg-cyan-100 text-cyan-800',
      'Printer': 'bg-orange-100 text-orange-800',
      'Scanner': 'bg-yellow-100 text-yellow-800',
      'Network Equipment': 'bg-red-100 text-red-800',
      'Security Device': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800'
    }
    return variants[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'AVAILABLE': 'bg-green-100 text-green-800',
      'ASSIGNED': 'bg-blue-100 text-blue-800',
      'IN_USE': 'bg-cyan-100 text-cyan-800',
      'MAINTENANCE': 'bg-yellow-100 text-yellow-800',
      'RETIRED': 'bg-gray-100 text-gray-800',
      'LOST': 'bg-red-100 text-red-800',
      'STOLEN': 'bg-red-100 text-red-800'
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  // Parse makeModel to extract brand and model for the modal
  const parseDeviceForModal = (device: DeviceResource) => {
    const parts = device.makeModel?.split(' ') || []
    const brand = parts[0] || ''
    const model = parts.slice(1).join(' ') || ''

    return {
      ...device,
      brand,
      model
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Laptop className="mr-3 h-8 w-8" />
          Device Resources
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage laptops, desktops, mobile devices, and hardware assets - ISO 27001 Compliant
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
              placeholder="Search devices by type, model, serial number, asset tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Device Table */}
      <Card>
        <CardHeader>
          <CardTitle>Devices ({filteredDevices.length})</CardTitle>
          <CardDescription>
            Track and manage physical hardware devices and equipment inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-12">
              <Laptop className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Devices Found
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                Get started by adding your first device resource
              </p>
              <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
                <Plus className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Type</TableHead>
                  <TableHead>Make/Model</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Encryption</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => {
                  // Check if OS suggests encryption (Windows/macOS/iOS)
                  const hasEncryption = device.operatingSystem?.toLowerCase().includes('windows') ||
                                       device.operatingSystem?.toLowerCase().includes('mac') ||
                                       device.operatingSystem?.toLowerCase().includes('ios')

                  return (
                    <TableRow key={device.id}>
                      <TableCell>
                        <Badge className={getDeviceTypeBadge(device.deviceType)}>
                          {device.deviceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Laptop className="mr-2 h-4 w-4 text-muted-foreground" />
                          {device.makeModel}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{device.serialNumber || '-'}</TableCell>
                      <TableCell className="text-sm">{device.assetTag || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {device.assignedTo ? (
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[150px]">{device.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(device.status)}>
                          {device.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasEncryption ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs">Enabled</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs">N/A</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'view', device: parseDeviceForModal(device) })}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'edit', device: parseDeviceForModal(device) })}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteDevice(device.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DeviceModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        device={modalState.device}
        mode={modalState.mode}
        onSave={handleSaveDevice}
        employees={employees}
        departments={departments}
      />
    </div>
  )
}
