'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Building2,
  FileText,
  Calendar,
  Clock,
  Shield,
  AlertCircle,
  Key,
  Database,
  Server,
  Package,
  Cloud,
  Laptop,
  Wrench,
  Network,
  GitBranch,
  Lock,
  FolderOpen,
  DoorOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface ResourceAccessRequest {
  id: string
  requestType: string
  resourceType: string
  resourceId: string
  resourceName: string
  requesterId: string
  requesterName: string
  requesterEmail: string
  requesterDepartment: string | null
  accessLevel: string
  businessJustification: string
  accessRequestTicketId: string | null
  requestedAt: string
  validFrom: string | null
  validTo: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_REVIEW'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  currentApproverId: string | null
  approvals: Array<{
    id: string
    approverId: string
    approverName: string
    approverEmail: string
    approverRole: string | null
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    comments: string | null
    decidedAt: string | null
  }>
}

interface ApprovalDecisionModalProps {
  isOpen: boolean
  onClose: () => void
  request: ResourceAccessRequest
  onSuccess: () => void
}

export function ApprovalDecisionModal({
  isOpen,
  onClose,
  request,
  onSuccess
}: ApprovalDecisionModalProps) {
  const t = useTranslations('approvals.modal')
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [comments, setComments] = useState('')
  const [accessCredentials, setAccessCredentials] = useState({
    username: '',
    password: '',
    host: '',
    port: '',
    connectionString: '',
    apiKey: '',
    accessToken: '',
    otherDetails: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getResourceIcon = (resourceType: string) => {
    const iconProps = { className: "h-5 w-5" }
    switch (resourceType) {
      case 'DATABASE': return <Database {...iconProps} />
      case 'SERVER': return <Server {...iconProps} />
      case 'SOFTWARE_LICENSE': return <Package {...iconProps} />
      case 'SAAS_SUBSCRIPTION': return <Cloud {...iconProps} />
      case 'CLOUD_ACCOUNT': return <Cloud {...iconProps} />
      case 'DEVICE': return <Laptop {...iconProps} />
      case 'INTERNAL_TOOL': return <Wrench {...iconProps} />
      case 'VPN_NETWORK_ACCESS': return <Network {...iconProps} />
      case 'CODE_REPOSITORY': return <GitBranch {...iconProps} />
      case 'API_KEY': return <Key {...iconProps} />
      case 'FILE_STORAGE': return <FolderOpen {...iconProps} />
      case 'PHYSICAL_ACCESS': return <DoorOpen {...iconProps} />
      default: return <Shield {...iconProps} />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50 border-red-200'
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'MEDIUM': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'LOW': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('na')
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const validateApproval = () => {
    const newErrors: Record<string, string> = {}

    if (!decision) {
      newErrors.decision = t('errors.decisionRequired')
    }

    if (decision === 'APPROVED') {
      const hasAnyCredential =
        accessCredentials.username ||
        accessCredentials.password ||
        accessCredentials.connectionString ||
        accessCredentials.apiKey ||
        accessCredentials.accessToken ||
        accessCredentials.otherDetails

      if (!hasAnyCredential) {
        newErrors.credentials = t('errors.credentialsRequired')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateApproval()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch(`/api/resources/access-requests/${request.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          comments,
          accessCredentials: decision === 'APPROVED' ? accessCredentials : null
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || t('errors.submitFailed') })
      }
    } catch {
      setErrors({ submit: t('errors.submitError') })
    } finally {
      setIsLoading(false)
    }
  }

  const isReadOnly = request.status !== 'PENDING'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {getResourceIcon(request.resourceType)}
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold">
                  {isReadOnly ? t('titleReadOnly') : t('titleReview')}
                </DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {request.resourceType.replace(/_/g, ' ')} - {request.resourceName}
                </DialogDescription>
              </div>
            </div>
            <Badge className={cn("ml-4", getPriorityColor(request.priority))}>
              {request.priority}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Request Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('requestInfo')}
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">{t('requestId')}</Label>
                <p className="text-sm font-mono">{request.id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('status')}</Label>
                <Badge variant="outline" className="mt-1">
                  {request.status}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('accessLevel')}</Label>
                <p className="text-sm font-medium">{request.accessLevel}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('requestedDate')}</Label>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(request.requestedAt)}
                </p>
              </div>
              {request.validFrom && (
                <div>
                  <Label className="text-xs text-muted-foreground">{t('validFrom')}</Label>
                  <p className="text-sm">{formatDate(request.validFrom)}</p>
                </div>
              )}
              {request.validTo && (
                <div>
                  <Label className="text-xs text-muted-foreground">{t('validUntil')}</Label>
                  <p className="text-sm">{formatDate(request.validTo)}</p>
                </div>
              )}
              {request.accessRequestTicketId && (
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">{t('ticketId')}</Label>
                  <p className="text-sm font-mono">{request.accessRequestTicketId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Requester Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('requesterSection')}
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{request.requesterName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{request.requesterEmail}</span>
              </div>
              {request.requesterDepartment && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{request.requesterDepartment}</span>
                </div>
              )}
            </div>
          </div>

          {/* Business Justification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('justificationSection')}
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{request.businessJustification}</p>
            </div>
          </div>

          {/* Approval History */}
          {request.approvals && request.approvals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('approvalChain')}
              </h3>
              <div className="space-y-2">
                {request.approvals.map((approval) => (
                  <div key={approval.id} className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{approval.approverName}</span>
                        {approval.approverRole && (
                          <Badge variant="secondary" className="text-xs">
                            {approval.approverRole}
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          approval.status === 'APPROVED' && 'bg-green-50 text-green-800 border-green-200',
                          approval.status === 'REJECTED' && 'bg-red-50 text-red-800 border-red-200',
                          approval.status === 'PENDING' && 'bg-yellow-50 text-yellow-800 border-yellow-200'
                        )}
                      >
                        {approval.status}
                      </Badge>
                    </div>
                    {approval.comments && (
                      <p className="text-xs text-muted-foreground mt-2">{approval.comments}</p>
                    )}
                    {approval.decidedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(approval.decidedAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t" />

          {/* Decision Section - Only show if status is PENDING */}
          {!isReadOnly && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('yourDecision')}
                </h3>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={decision === 'APPROVED' ? 'default' : 'outline'}
                    className={cn(
                      "flex-1",
                      decision === 'APPROVED' && "bg-green-600 hover:bg-green-700"
                    )}
                    onClick={() => setDecision('APPROVED')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('approve')}
                  </Button>
                  <Button
                    type="button"
                    variant={decision === 'REJECTED' ? 'default' : 'outline'}
                    className={cn(
                      "flex-1",
                      decision === 'REJECTED' && "bg-red-600 hover:bg-red-700"
                    )}
                    onClick={() => setDecision('REJECTED')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t('reject')}
                  </Button>
                </div>
                {errors.decision && (
                  <p className="text-xs text-destructive">{errors.decision}</p>
                )}
              </div>

              {/* Access Credentials - Only show if approved */}
              {decision === 'APPROVED' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      {t('credentials')}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {t('credentialsBadge')}
                    </Badge>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t('credentialsAlert')}</AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">{t('username')}</Label>
                      <Input
                        id="username"
                        value={accessCredentials.username}
                        onChange={(e) => setAccessCredentials({...accessCredentials, username: e.target.value})}
                        placeholder={t('usernamePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('password')}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={accessCredentials.password}
                        onChange={(e) => setAccessCredentials({...accessCredentials, password: e.target.value})}
                        placeholder={t('passwordPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="host">{t('host')}</Label>
                      <Input
                        id="host"
                        value={accessCredentials.host}
                        onChange={(e) => setAccessCredentials({...accessCredentials, host: e.target.value})}
                        placeholder={t('hostPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port">{t('port')}</Label>
                      <Input
                        id="port"
                        value={accessCredentials.port}
                        onChange={(e) => setAccessCredentials({...accessCredentials, port: e.target.value})}
                        placeholder={t('portPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="connectionString">{t('connectionString')}</Label>
                      <Input
                        id="connectionString"
                        value={accessCredentials.connectionString}
                        onChange={(e) => setAccessCredentials({...accessCredentials, connectionString: e.target.value})}
                        placeholder={t('connectionStringPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">{t('apiKey')}</Label>
                      <Input
                        id="apiKey"
                        value={accessCredentials.apiKey}
                        onChange={(e) => setAccessCredentials({...accessCredentials, apiKey: e.target.value})}
                        placeholder={t('apiKeyPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accessToken">{t('accessToken')}</Label>
                      <Input
                        id="accessToken"
                        value={accessCredentials.accessToken}
                        onChange={(e) => setAccessCredentials({...accessCredentials, accessToken: e.target.value})}
                        placeholder={t('accessTokenPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="otherDetails">{t('additionalDetails')}</Label>
                      <Textarea
                        id="otherDetails"
                        value={accessCredentials.otherDetails}
                        onChange={(e) => setAccessCredentials({...accessCredentials, otherDetails: e.target.value})}
                        placeholder={t('additionalDetailsPlaceholder')}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                  {errors.credentials && (
                    <p className="text-xs text-destructive">{errors.credentials}</p>
                  )}
                </div>
              )}

              {/* Comments */}
              <div className="space-y-4">
                <Label htmlFor="comments">
                  {t('comments')} {decision === 'REJECTED' && <span className="text-muted-foreground">{t('commentsRequired')}</span>}
                </Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    decision === 'APPROVED'
                      ? t('commentsPlaceholderApproved')
                      : t('commentsPlaceholderRejected')
                  }
                  className="min-h-[100px]"
                />
              </div>

              {errors.submit && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {isReadOnly ? t('close') : t('cancel')}
          </Button>
          {!isReadOnly && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !decision}
              className={cn(
                decision === 'APPROVED' && "bg-green-600 hover:bg-green-700",
                decision === 'REJECTED' && "bg-red-600 hover:bg-red-700"
              )}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('submitDecision')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
