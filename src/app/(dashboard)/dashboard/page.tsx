'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, AlertTriangle, Shield, Server, Database, Monitor } from 'lucide-react'
import { DataTable } from '@/components/data-table'

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  pendingRequests: number
  expiringAccess: number
  totalSystems: number
  totalDevices: number
  totalServers: number
  totalDatabases: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const t = useTranslations('dashboard')
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingRequests: 0,
    expiringAccess: 0,
    totalSystems: 0,
    totalDevices: 0,
    totalServers: 0,
    totalDatabases: 0
  })
  const [approvalRequests, setApprovalRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch employees data
      const employeesResponse = await fetch('/api/employees')
      const employeesData = await employeesResponse.json()
      const employees = employeesData.data || []

      // Fetch systems data
      const systemsResponse = await fetch('/api/systems')
      const systemsData = await systemsResponse.json()
      const systems = systemsData.data || []

      // Fetch requests data
      const requestsResponse = await fetch('/api/requests')
      const requestsData = await requestsResponse.json()
      const requests = requestsData.data || []

      // Calculate stats
      const totalEmployees = employeesData.pagination?.total || employees.length
      const activeEmployees = employees.filter((emp: any) =>
        emp.employmentStatus === 'FULL_TIME' || emp.employmentStatus === 'PART_TIME' || emp.employmentStatus === 'CONTRACT'
      ).length
      const totalSystems = systemsData.pagination?.total || systems.length

      // Count pending requests
      const pendingRequests = requests.filter((req: any) => req.status === 'PENDING').length

      // Count expiring access (permissions expiring within 7 days)
      const today = new Date()
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      let expiringAccessCount = 0

      for (const employee of employees) {
        if (employee.accessPermissions) {
          const expiring = employee.accessPermissions.filter((perm: any) => {
            if (!perm.expiresAt) return false
            const expiryDate = new Date(perm.expiresAt)
            return expiryDate >= today && expiryDate <= sevenDaysFromNow
          })
          expiringAccessCount += expiring.length
        }
      }

      // Note: Devices, servers, and databases would need their own API endpoints
      // For now, keeping as 0 until those features are implemented
      const totalDevices = 0
      const totalServers = 0
      const totalDatabases = 0

      setStats({
        totalEmployees,
        activeEmployees,
        pendingRequests,
        expiringAccess: expiringAccessCount,
        totalSystems,
        totalDevices,
        totalServers,
        totalDatabases
      })

      // Transform approval requests data for the data table
      const approvalRequestsData = requests.map((request: any) => ({
        id: request.id,
        employeeName: request.employee ? `${request.employee.firstName} ${request.employee.lastName}` : 'Unknown',
        requestType: request.requestType,
        systemName: request.systems?.map((s: any) => s.system?.name).join(', ') || 'N/A',
        priority: request.priority,
        department: request.employee?.department || 'N/A',
        reviewer: request.approvals?.[0]?.approverId || 'Assign reviewer',
        status: request.status,
        requestedAt: request.createdAt
      }))

      setApprovalRequests(approvalRequestsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('welcome', { name: session?.user?.name ?? '' })}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalEmployees')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{t('totalEmployeesDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pendingRequests')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">{t('pendingRequestsDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalSystems')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalSystems}</div>
            <p className="text-xs text-muted-foreground">{t('totalSystemsDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('expiringAccess')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.expiringAccess}</div>
            <p className="text-xs text-muted-foreground">{t('expiringAccessDesc')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resources Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">{t('systemsAndResources')}</h2>
        <p className="text-muted-foreground mb-6">{t('systemsAndResourcesDesc')}</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalSystems')}</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalSystems}</div>
              <p className="text-xs text-muted-foreground">{t('totalSystemsDesc')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('devices')}</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalDevices}</div>
              <p className="text-xs text-muted-foreground">{t('devicesDesc')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('servers')}</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalServers}</div>
              <p className="text-xs text-muted-foreground">{t('serversDesc')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('databases')}</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalDatabases}</div>
              <p className="text-xs text-muted-foreground">{t('databasesDesc')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approval Details Table - Using shadcn/ui DataTable */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t('approvalDetails')}</CardTitle>
          <CardDescription>{t('approvalDetailsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
          ) : approvalRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('noApprovalRequests')}</div>
          ) : (
            <DataTable data={approvalRequests} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}