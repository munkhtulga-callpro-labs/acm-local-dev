'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Activity,
  Download,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { AuditLogsDataTable, type AuditLog } from '@/components/audit-logs-data-table'

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      // Fetch all logs without pagination for the data table
      const response = await fetch('/api/audit-logs?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.data || [])
      } else {
        setError('Failed to fetch audit logs')
      }
    } catch (error) {
      setError('Error fetching audit logs')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = () => {
    // TODO: Implement CSV export
    console.log('Exporting audit logs...')
  }

  const totalLogs = auditLogs.length
  const activityLogs = auditLogs.filter(log => log.action.includes('UPDATE') || log.action.includes('MODIFY')).length
  const securityLogs = auditLogs.filter(log => log.action.includes('LOGIN') || log.action.includes('SIGNIN') || log.action.includes('LOGOUT')).length
  const accessLogs = auditLogs.filter(log => log.action.includes('GRANT') || log.action.includes('REVOKE') || log.action.includes('APPROVE') || log.action.includes('REJECT')).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground">Complete audit trail of system activities</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">
              All audit entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityLogs}</div>
            <p className="text-xs text-muted-foreground">
              Updates and modifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityLogs}</div>
            <p className="text-xs text-muted-foreground">
              Authentication events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Changes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessLogs}</div>
            <p className="text-xs text-muted-foreground">
              Access grants and revocations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription className="mt-1.5">
              System activity and security logs
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No audit logs found.
              </AlertDescription>
            </Alert>
          ) : (
            <AuditLogsDataTable data={auditLogs} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
