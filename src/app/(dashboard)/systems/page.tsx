'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Search, 
  Plus, 
  Server,
  Database,
  Monitor
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SystemsDataTable, System } from '@/components/systems-data-table'
// Temporarily disabled - incomplete components
// import { ResourcesDataTable, Resource } from '@/components/resources-data-table'
// import { DevicesDataTable, Device } from '@/components/devices-data-table'
// import { ServersDataTable, Server as ServerType } from '@/components/servers-data-table'
// import { DatabasesDataTable, Database as DatabaseType } from '@/components/databases-data-table'

// Placeholder types for incomplete features
type Resource = any
type Device = any
type ServerType = any
type DatabaseType = any
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export default function SystemsPage() {
  const [systems, setSystems] = useState<System[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [servers, setServers] = useState<ServerType[]>([])
  const [databases, setDatabases] = useState<DatabaseType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('systems')

  useEffect(() => {
    fetchSystems()
    fetchResources()
    fetchDevices()
    fetchServers()
    fetchDatabases()
  }, [])

  const fetchSystems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/systems')
      if (response.ok) {
        const data = await response.json()
        setSystems(data.data || [])
      } else {
        setError('Failed to fetch systems')
      }
    } catch (error) {
      setError('Error fetching systems')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResources = async () => {
    try {
      // Mock data for resources
      const mockResources: Resource[] = [
        {
          id: '1',
          name: 'Office 365 License',
          type: 'Software',
          description: 'Microsoft Office 365 Business Premium',
          category: 'Production',
          location: 'Cloud',
          owner: 'admin@callpro.mn',
          administrator: 'it@callpro.mn',
          status: 'ACTIVE',
          isActive: true,
          createdAt: '2024-10-20T09:00:00Z'
        },
        {
          id: '2',
          name: 'VPN Access',
          type: 'Service',
          description: 'Corporate VPN for remote access',
          category: 'Production',
          location: 'Network',
          owner: 'admin@callpro.mn',
          administrator: 'it@callpro.mn',
          status: 'ACTIVE',
          isActive: true,
          createdAt: '2024-10-15T14:30:00Z'
        }
      ]
      setResources(mockResources)
    } catch (error) {
      console.error('Error fetching resources:', error)
    }
  }

  const fetchDevices = async () => {
    try {
      // Mock data for devices
      const mockDevices: Device[] = [
        {
          id: '1',
          name: 'MacBook Pro - John Doe',
          type: 'Laptop',
          model: 'MacBook Pro 16"',
          serialNumber: 'C02XK0JGH6Q7',
          macAddress: '00:1B:44:11:3A:B7',
          ipAddress: '192.168.1.100',
          location: 'Office - Desk 1',
          owner: 'john.doe@callpro.mn',
          administrator: 'it@callpro.mn',
          status: 'ACTIVE',
          isActive: true,
          createdAt: '2024-10-20T09:00:00Z'
        },
        {
          id: '2',
          name: 'iPhone 15 - Jane Smith',
          type: 'Mobile',
          model: 'iPhone 15 Pro',
          serialNumber: 'F2LQ3LL/A',
          macAddress: '00:1B:44:11:3A:B8',
          ipAddress: '192.168.1.101',
          location: 'Remote',
          owner: 'jane.smith@callpro.mn',
          administrator: 'it@callpro.mn',
          status: 'ACTIVE',
          isActive: true,
          createdAt: '2024-10-15T14:30:00Z'
        }
      ]
      setDevices(mockDevices)
    } catch (error) {
      console.error('Error fetching devices:', error)
    }
  }

  const fetchServers = async () => {
    try {
      // Mock data for servers
      const mockServers: ServerType[] = [
        {
          id: '1',
          name: 'Web Server - Production',
          type: 'Web',
          os: 'Ubuntu 22.04 LTS',
          cpu: 'Intel Xeon E5-2686 v4',
          memory: '32GB RAM',
          storage: '500GB SSD',
          ipAddress: '10.0.1.10',
          location: 'Data Center A',
          administrator: 'devops@callpro.mn',
          status: 'ACTIVE',
          isActive: true,
          createdAt: '2024-10-20T09:00:00Z'
        },
        {
          id: '2',
          name: 'Database Server - Staging',
          type: 'Database',
          os: 'Ubuntu 22.04 LTS',
          cpu: 'Intel Xeon E5-2686 v4',
          memory: '64GB RAM',
          storage: '1TB SSD',
          ipAddress: '10.0.2.20',
          location: 'Data Center B',
          administrator: 'devops@callpro.mn',
          status: 'ACTIVE',
          isActive: true,
          createdAt: '2024-10-15T14:30:00Z'
        }
      ]
      setServers(mockServers)
    } catch (error) {
      console.error('Error fetching servers:', error)
    }
  }

  const fetchDatabases = async () => {
    try {
      // Mock data for databases
      const mockDatabases: DatabaseType[] = [
        {
          id: '1',
          name: 'PostgreSQL - Production',
          type: 'PostgreSQL',
          version: '15.4',
          host: 'db-prod-01.callpro.mn',
          port: 5432,
          size: '500GB',
          location: 'Data Center A',
          administrator: 'devops@callpro.mn',
          status: 'ACTIVE',
          isActive: true,
          createdAt: '2024-10-20T09:00:00Z'
        },
        {
          id: '2',
          name: 'Redis - Cache',
          type: 'Redis',
          version: '7.0.12',
          host: 'redis-prod-01.callpro.mn',
          port: 6379,
          size: '50GB',
          location: 'Data Center A',
          administrator: 'devops@callpro.mn',
          status: 'ACTIVE',
          isActive: true,
          createdAt: '2024-10-15T14:30:00Z'
        }
      ]
      setDatabases(mockDatabases)
    } catch (error) {
      console.error('Error fetching databases:', error)
    }
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Systems & Resources</h1>
        <p className="text-muted-foreground">Manage systems, devices, servers, databases, and other resources for access control</p>
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
            <CardTitle className="text-sm font-medium">Total Systems</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systems.length}</div>
            <p className="text-xs text-muted-foreground">
              All registered systems
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground">
              Laptops, phones, etc.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servers.length}</div>
            <p className="text-xs text-muted-foreground">
              Production & staging
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Databases</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{databases.length}</div>
            <p className="text-xs text-muted-foreground">
              Data storage systems
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="databases">Databases</TabsTrigger>
        </TabsList>

        {/* Systems Tab */}
        <TabsContent value="systems" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Systems Management</CardTitle>
              <CardDescription>
                Manage integrated systems and applications
              </CardDescription>
            </CardHeader>
            <CardContent>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading systems...</div>
              ) : systems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No systems found</div>
              ) : (
                <SystemsDataTable data={systems} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Resources Management</CardTitle>
                <CardDescription>
                  Manage software licenses, VPN access, and other resources
                </CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Resource
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading resources...</div>
              ) : resources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No resources found</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Resources table coming soon</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Devices Management</CardTitle>
                <CardDescription>
                  Manage laptops, phones, tablets, and other devices
                </CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Device
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading devices...</div>
              ) : devices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No devices found</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Devices table coming soon</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Servers Tab */}
        <TabsContent value="servers" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Servers Management</CardTitle>
                <CardDescription>
                  Manage production, staging, and development servers
                </CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Server
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading servers...</div>
              ) : servers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No servers found</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Servers table coming soon</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Databases Tab */}
        <TabsContent value="databases" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Databases Management</CardTitle>
                <CardDescription>
                  Manage PostgreSQL, MySQL, Redis, and other databases
                </CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Database
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading databases...</div>
              ) : databases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No databases found</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Databases table coming soon</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
