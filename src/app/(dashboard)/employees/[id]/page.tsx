'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Shield, 
  Clock, 
  Activity,
  Mail,
  Phone,
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  department: string
  position: string
  manager?: string
  company: string
  isActive: boolean
  startDate: string
  endDate?: string
  createdAt: string
  accessPermissions: Array<{
    id: string
    system: {
      id: string
      name: string
      category: string
    }
    accessLevel: string
    grantedAt: string
    expiresAt?: string
    isActive: boolean
  }>
}

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  details: any
  userId: string
  user: {
    name: string
    email: string
  }
  createdAt: string
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [resourceAssignments, setResourceAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchEmployeeDetails()
    }
  }, [params.id])

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch employee details
      const employeeResponse = await fetch(`/api/employees/${params.id}`)
      if (employeeResponse.ok) {
        const employeeData = await employeeResponse.json()
        setEmployee(employeeData)

        // Fetch resource assignments for this employee
        const assignmentsResponse = await fetch(`/api/resources/assignments?assigneeEmail=${employeeData.email}`)
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json()
          setResourceAssignments(assignmentsData.data || [])
        }
      } else {
        setError('Failed to fetch employee details')
      }

      // Fetch audit logs for this employee
      const logsResponse = await fetch(`/api/audit-logs?entityId=${params.id}&entityType=Employee`)
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setAuditLogs(logsData.data || [])
      }
    } catch (error) {
      setError('Error fetching employee details')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/employees/${params.id}/edit`)
  }

  const handleManageAccess = () => {
    // Navigate to access management for this employee
    router.push(`/employees/${params.id}?tab=access`)
  }

  const handleViewSchedule = () => {
    // Navigate to schedule view (placeholder for now)
    alert('Schedule view feature coming soon!')
  }

  const handleSendEmail = () => {
    // Open email client with employee's email
    if (employee) {
      window.open(`mailto:${employee.email}`, '_blank')
    }
  }

  const getAccessLevelColor = (level: string) => {
    if (!level) return 'bg-gray-100 text-gray-800'
    switch (level.toLowerCase()) {
      case 'admin':
      case 'full':
        return 'bg-red-100 text-red-800'
      case 'write':
      case 'edit':
        return 'bg-yellow-100 text-yellow-800'
      case 'read':
      case 'view':
        return 'bg-blue-100 text-blue-800'
      case 'print':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Employee not found'}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => router.push('/employees')} 
          className="mt-4"
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/employees')}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-muted-foreground">{employee.position} • {employee.department}</p>
            </div>
          </div>
          <Button onClick={handleEdit} className="flex items-center">
            <Edit className="mr-2 h-4 w-4" />
            Edit Employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="access">Access Permissions</TabsTrigger>
              <TabsTrigger value="requests">Access Requests</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                      <p className="text-sm">{employee.employeeId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm flex items-center">
                        <Mail className="mr-2 h-4 w-4" />
                        {employee.email}
                      </p>
                    </div>
                    {employee.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-sm flex items-center">
                          <Phone className="mr-2 h-4 w-4" />
                          {employee.phone}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(employee.isActive)}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    Work Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Company</label>
                      <p className="text-sm">{employee.company}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Department</label>
                      <p className="text-sm">{employee.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Position</label>
                      <p className="text-sm">{employee.position}</p>
                    </div>
                    {employee.manager && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Manager</label>
                        <p className="text-sm">{employee.manager}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                      <p className="text-sm flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        {new Date(employee.startDate).toISOString().slice(0, 19).replace('T', ' ')}
                      </p>
                    </div>
                    {employee.endDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">End Date</label>
                        <p className="text-sm flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(employee.endDate).toISOString().slice(0, 19).replace('T', ' ')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          {/* Access Permissions Tab */}
          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Resource Access Assignments
                </CardTitle>
                <CardDescription>
                  Current resource access assignments and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resourceAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {resourceAssignments.map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{assignment.resourceName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {assignment.resourceType} • {assignment.assigneeDepartment}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getAccessLevelColor(assignment.accessLevel)}>
                              {assignment.accessLevel}
                            </Badge>
                            <Badge variant={assignment.status === 'ACTIVE' ? "default" : "secondary"}>
                              {assignment.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>Granted: {new Date(assignment.grantedAt).toISOString().slice(0, 19).replace('T', ' ')}</p>
                          <p>Granted By: {assignment.grantedBy}</p>
                          {assignment.validTo && (
                            <p>Expires: {new Date(assignment.validTo).toISOString().slice(0, 19).replace('T', ' ')}</p>
                          )}
                          {!assignment.validTo && (
                            <p>Expires: No expiry</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No resource assignments found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Access Requests
                </CardTitle>
                <CardDescription>
                  Access request history and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    No access requests found. This feature will show pending, approved, and rejected access requests for this employee.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Activity Log
                </CardTitle>
                <CardDescription>
                  Recent activity and changes for this employee
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length > 0 ? (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-muted-foreground">
                              by {log.user.name} ({log.user.email})
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <Clock className="inline mr-1 h-4 w-4" />
                            {new Date(log.createdAt).toISOString().slice(0, 19).replace('T', ' ')}
                          </div>
                        </div>
                        {log.details && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No activity found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Employee Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="text-center">
                <div className="text-xl font-bold">{resourceAssignments.length}</div>
                <div className="text-xs text-muted-foreground">Resource Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">
                  {Math.floor((Date.now() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-xs text-muted-foreground">Days Employed</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
