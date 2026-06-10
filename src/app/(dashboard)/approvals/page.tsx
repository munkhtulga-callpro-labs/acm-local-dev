'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { ApprovalDecisionModal } from '@/components/approval-decision-modal'
import { ApprovalsDataTable, type ApprovalRequest } from '@/components/approvals-data-table'

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [showDecisionModal, setShowDecisionModal] = useState(false)

  useEffect(() => {
    fetchApprovalRequests()
  }, [])

  const fetchApprovalRequests = async () => {
    try {
      setLoading(true)
      // Fetch requests pending approval by current user
      const response = await fetch('/api/resources/access-requests?view=pending-approvals')
      const data = await response.json()
      setRequests(data.data || [])
    } catch (error) {
      console.error('Error fetching approval requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewClick = (request: ApprovalRequest) => {
    setSelectedRequest(request)
    setShowDecisionModal(true)
  }

  const handleDecisionComplete = () => {
    setShowDecisionModal(false)
    setSelectedRequest(null)
    fetchApprovalRequests() // Refresh list
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING').length
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length
  const urgentCount = requests.filter(r => r.priority === 'URGENT' && r.status === 'PENDING').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Resource Access Approvals</h1>
        <p className="text-muted-foreground">Review and approve resource access requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentCount}</div>
            <p className="text-xs text-muted-foreground">
              High priority pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              Access granted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">
              Access denied
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Access Requests</CardTitle>
          <CardDescription className="mt-1.5">
            Review and manage resource access requests
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approval requests found
            </div>
          ) : (
            <ApprovalsDataTable data={requests} onReview={handleReviewClick} />
          )}
        </CardContent>
      </Card>

      {/* Approval Decision Modal */}
      {selectedRequest && (
        <ApprovalDecisionModal
          isOpen={showDecisionModal}
          onClose={() => setShowDecisionModal(false)}
          request={selectedRequest}
          onSuccess={handleDecisionComplete}
        />
      )}
    </div>
  )
}
