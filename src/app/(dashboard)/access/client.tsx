'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, CheckCircle, AlertTriangle, XCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccessControlDataTable, type AccessAssignment } from '@/components/access-control-data-table'

interface AccessClientProps {
  initialData: AccessAssignment[]
}

export function AccessClient({ initialData }: AccessClientProps) {
  const now = new Date()

  const isExpiringSoon = (validTo: string | null) => {
    if (!validTo) return false
    const daysUntilExpiry = Math.floor((new Date(validTo).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30
  }

  const activeCount = initialData.filter(a => a.status === 'ACTIVE' && a.isActive).length
  const revokedCount = initialData.filter(a => a.status === 'REVOKED' || !a.isActive).length
  const expiredCount = initialData.filter(a => a.validTo && new Date(a.validTo) < now).length
  const expiringSoonCount = initialData.filter(a => isExpiringSoon(a.validTo)).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Access Control</h1>
        <p className="text-muted-foreground">Manage and monitor resource access assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Currently granted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoonCount}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredCount}</div>
            <p className="text-xs text-muted-foreground">Past validity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revoked</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revokedCount}</div>
            <p className="text-xs text-muted-foreground">Access removed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Resource Assignments</CardTitle>
            <CardDescription className="mt-1.5">
              Manage and monitor resource access assignments
            </CardDescription>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Request Access
          </Button>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {initialData.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No resource assignments found. Assignments are created when access requests are approved.
              </AlertDescription>
            </Alert>
          ) : (
            <AccessControlDataTable data={initialData} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
