'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Cloud, Calendar, Loader2, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResourceOwnershipSection } from '@/components/resource-ownership-section'

interface ResourceOwner {
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface SaaSSubscription {
  id?: string
  serviceName: string
  category: string
  subscriptionPlan: string
  totalSeats: number
  usedSeats: number
  billingCycle: string
  cost?: number | null
  renewalDate?: string | null
  owner: string
  ownerDepartment?: string | null
  status: string
  ssoEnabled: boolean
  apiAccess: boolean
}

interface SaaSSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  subscription?: SaaSSubscription
  mode: 'view' | 'edit' | 'create'
  onSave: (subscription: Partial<SaaSSubscription>, owners?: ResourceOwner[]) => Promise<void>
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments?: Array<{ id: string; name: string }>
}

export function SaaSSubscriptionModal({
  isOpen,
  onClose,
  subscription,
  mode,
  onSave,
  employees,
  departments = []
}: SaaSSubscriptionModalProps) {
  const [formData, setFormData] = useState<Partial<SaaSSubscription>>({
    serviceName: '',
    category: 'Communication',
    subscriptionPlan: '',
    totalSeats: 1,
    usedSeats: 0,
    billingCycle: 'Monthly',
    cost: 0,
    owner: '',
    ownerDepartment: '',
    status: 'ACTIVE',
    ssoEnabled: false,
    apiAccess: false
  })

  const t = useTranslations('saasSubscriptions.modal')
  const [owners, setOwners] = useState<ResourceOwner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOwners = async () => {
      if (subscription?.id && mode !== 'create') {
        try {
          const response = await fetch(`/api/resources/owners?resourceType=SAAS_SUBSCRIPTION&resourceId=${subscription.id}`)
          if (response.ok) {
            const data = await response.json()
            // Find the MAIN_OWNER and set it as the primary owner
            const mainOwner = data.data?.find((o: any) => o.ownershipType === 'MAIN_OWNER')
            if (mainOwner && mainOwner.ownerEmail) {
              setFormData(prev => ({ ...prev, owner: mainOwner.ownerEmail }))
            }
            // Get additional owners (excluding MAIN_OWNER)
            const additionalOwners = data.data?.filter((o: any) => o.ownershipType !== 'MAIN_OWNER') || []
            setOwners(additionalOwners)
          }
        } catch (error) {
          console.error('Error fetching owners:', error)
        }
      }
    }

    if (subscription && mode !== 'create') {
      setFormData({
        ...subscription,
        renewalDate: subscription.renewalDate ? new Date(subscription.renewalDate).toISOString().split('T')[0] : '',
        owner: '', // Will be populated by fetchOwners
      })
      fetchOwners()
    } else if (mode === 'create') {
      setFormData({
        serviceName: '',
        category: 'Communication',
        subscriptionPlan: '',
        totalSeats: 1,
        usedSeats: 0,
        billingCycle: 'Monthly',
        cost: 0,
        owner: '',
        ownerDepartment: '',
        status: 'ACTIVE',
        ssoEnabled: false,
        apiAccess: false
      })
      setOwners([])
    }
    setErrors({})
  }, [subscription, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.serviceName?.trim()) newErrors.serviceName = t('errors.serviceNameRequired')
    if (!formData.subscriptionPlan?.trim()) newErrors.subscriptionPlan = t('errors.subscriptionPlanRequired')
    if (!formData.category) newErrors.category = t('errors.categoryRequired')
    if (!formData.billingCycle) newErrors.billingCycle = t('errors.billingCycleRequired')
    if (!formData.totalSeats || formData.totalSeats < 1) newErrors.totalSeats = t('errors.totalSeatsRequired')
    if (formData.usedSeats !== undefined && formData.usedSeats < 0) newErrors.usedSeats = t('errors.usedSeatsNegative')
    if (formData.usedSeats !== undefined && formData.totalSeats !== undefined && formData.usedSeats > formData.totalSeats) {
      newErrors.usedSeats = t('errors.usedSeatsExceed')
    }
    if (!formData.owner?.trim()) newErrors.owner = t('errors.ownerRequired')

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'view') {
      onClose()
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await onSave(formData, owners)
      onClose()
    } catch (error) {
      console.error('Error saving SaaS subscription:', error)
      setErrors({ submit: t('errors.saveFailed') })
    } finally {
      setIsLoading(false)
    }
  }

  const isViewMode = mode === 'view'

  const categories = ['Communication', 'Productivity', 'Development', 'Finance', 'Marketing', 'Customer Service', 'Infrastructure', 'Security', 'Other']
  const billingCycles = ['Monthly', 'Quarterly', 'Yearly', 'Bi-Yearly']

  // Calculate utilization percentage
  const utilizationPercentage = formData.totalSeats && formData.totalSeats > 0
    ? ((formData.usedSeats || 0) / formData.totalSeats) * 100
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" />
            {mode === 'view' && t('titleView')}
            {mode === 'edit' && t('titleEdit')}
            {mode === 'create' && t('titleCreate')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && t('descriptionView')}
            {mode === 'edit' && t('descriptionEdit')}
            {mode === 'create' && t('descriptionCreate')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Subscription Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Cloud className="h-4 w-4" />
              {t('subscriptionInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="serviceName" className="text-sm font-medium">
                  {t('serviceName')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="serviceName"
                  value={formData.serviceName || ''}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.serviceName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Slack, Microsoft 365, GitHub"
                />
                {errors.serviceName && <p className="text-xs text-destructive">{errors.serviceName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  {t('category')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.category && "border-destructive")}>
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan" className="text-sm font-medium">
                  {t('subscriptionPlan')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="subscriptionPlan"
                  value={formData.subscriptionPlan || ''}
                  onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.subscriptionPlan && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Enterprise, Business, Pro"
                />
                {errors.subscriptionPlan && <p className="text-xs text-destructive">{errors.subscriptionPlan}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ssoEnabled" className="text-sm font-medium">
                  {t('ssoEnabled')}
                </Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="ssoEnabled"
                    checked={formData.ssoEnabled || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, ssoEnabled: checked })}
                    disabled={isViewMode}
                  />
                  <Label htmlFor="ssoEnabled" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.ssoEnabled ? t('enabled') : t('disabled')}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiAccess" className="text-sm font-medium">
                  {t('apiAccess')}
                </Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="apiAccess"
                    checked={formData.apiAccess || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, apiAccess: checked })}
                    disabled={isViewMode}
                  />
                  <Label htmlFor="apiAccess" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.apiAccess ? t('enabled') : t('disabled')}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Billing & Usage Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <DollarSign className="h-4 w-4" />
              {t('billingUsage')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="billingCycle" className="text-sm font-medium">
                  {t('billingCycle')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.billingCycle}
                  onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.billingCycle && "border-destructive")}>
                    <SelectValue placeholder={t('selectBillingCycle')} />
                  </SelectTrigger>
                  <SelectContent>
                    {billingCycles.map((cycle) => (
                      <SelectItem key={cycle} value={cycle}>{cycle}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.billingCycle && <p className="text-xs text-destructive">{errors.billingCycle}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">
                  {t('costUsd')}
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost !== null && formData.cost !== undefined ? formData.cost : ''}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value ? parseFloat(e.target.value) : null })}
                  disabled={isViewMode}
                  placeholder="999.99"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewalDate" className="text-sm font-medium">
                  {t('renewalDate')}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="renewalDate"
                    type="date"
                    value={formData.renewalDate || ''}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  {t('status')}
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t('selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('statusActive')}</SelectItem>
                    <SelectItem value="INACTIVE">{t('statusInactive')}</SelectItem>
                    <SelectItem value="EXPIRED">{t('statusExpired')}</SelectItem>
                    <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalSeats" className="text-sm font-medium">
                  {t('totalSeats')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="totalSeats"
                  type="number"
                  value={formData.totalSeats || ''}
                  onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) || 0 })}
                  disabled={isViewMode}
                  className={cn(errors.totalSeats && "border-destructive focus-visible:ring-destructive")}
                  placeholder="10"
                />
                {errors.totalSeats && <p className="text-xs text-destructive">{errors.totalSeats}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="usedSeats" className="text-sm font-medium">
                  {t('currentUsers')}
                </Label>
                <Input
                  id="usedSeats"
                  type="number"
                  value={formData.usedSeats !== undefined ? formData.usedSeats : ''}
                  onChange={(e) => setFormData({ ...formData, usedSeats: parseInt(e.target.value) || 0 })}
                  disabled={isViewMode}
                  className={cn(errors.usedSeats && "border-destructive focus-visible:ring-destructive")}
                  placeholder="0"
                />
                {errors.usedSeats && <p className="text-xs text-destructive">{errors.usedSeats}</p>}
              </div>

              {/* Utilization Display */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">
                  {t('utilization')}
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('seatsUsed', { used: formData.usedSeats || 0, total: formData.totalSeats || 0 })}
                    </span>
                    <span className="font-medium">
                      {utilizationPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={cn(
                        "h-2.5 rounded-full transition-all",
                        utilizationPercentage >= 95 ? "bg-red-500" :
                        utilizationPercentage >= 80 ? "bg-yellow-500" :
                        "bg-green-500"
                      )}
                      style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Ownership Section */}
          <ResourceOwnershipSection
            employees={employees}
            departments={departments}
            owner={formData.owner}
            onOwnerChange={(value) => setFormData({ ...formData, owner: value })}
            ownerError={errors.owner}
            owners={owners}
            onOwnersChange={setOwners}
            disabled={isViewMode}
          />

          {errors.submit && (
            <div className="rounded-md bg-destructive/10 p-4 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{errors.submit}</p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="min-w-24"
            >
              {isViewMode ? t('close') : t('cancel')}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-28"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? t('updateSubscription') : t('addSubscription')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
