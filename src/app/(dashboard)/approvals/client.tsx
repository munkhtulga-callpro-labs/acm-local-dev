'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { ApprovalDecisionModal } from '@/components/approval-decision-modal'
import { ApprovalsDataTable, type ApprovalRequest } from '@/components/approvals-data-table'

interface ApprovalsClientProps {
  initialData: ApprovalRequest[]
}

export function ApprovalsClient({ initialData }: ApprovalsClientProps) {
  const t = useTranslations('approvals')
  const [data, setData] = useState<ApprovalRequest[]>(initialData)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [showDecisionModal, setShowDecisionModal] = useState(false)

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/resources/access-requests?view=pending-approvals')
      if (res.ok) {
        const json = await res.json()
        setData(json.data ?? [])
      }
    } catch {}
  }, [])

  const handleReviewClick = (request: ApprovalRequest) => {
    setSelectedRequest(request)
    setShowDecisionModal(true)
  }

  const handleDecisionComplete = async () => {
    setShowDecisionModal(false)
    setSelectedRequest(null)
    await refreshData()
  }

  const pendingCount = data.filter(r => r.status === 'PENDING').length
  const approvedCount = data.filter(r => r.status === 'APPROVED').length
  const rejectedCount = data.filter(r => r.status === 'REJECTED').length
  const urgentCount = data.filter(r => r.priority === 'URGENT' && r.status === 'PENDING').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pendingApproval')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">{t('pendingApprovalDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('urgent')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentCount}</div>
            <p className="text-xs text-muted-foreground">{t('urgentDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('approved')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">{t('approvedDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('rejected')}</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">{t('rejectedDesc')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t('accessRequests')}</CardTitle>
          <CardDescription className="mt-1.5">
            {t('accessRequestsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noRequests')}
            </div>
          ) : (
            <ApprovalsDataTable data={data} onReview={handleReviewClick} />
          )}
        </CardContent>
      </Card>

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
