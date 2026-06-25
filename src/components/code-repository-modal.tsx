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
import { GitBranch, Building2, Key, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResourceOwnershipSection } from '@/components/resource-ownership-section'

interface ResourceOwner {
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface CodeRepositoryResource {
  id?: string
  platform: string
  repositoryName: string
  organizationTeam: string
  accessLevel: string
  branchRestrictions?: string | null
  assignedTo?: string | null
  ownerDepartment?: string | null
  status: string
  notes?: string | null
  webhookAccess: boolean
  deploymentKeys?: string | null
  owner: string
}

interface CodeRepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  codeRepository?: CodeRepositoryResource
  mode: 'view' | 'edit' | 'create'
  onSave: (codeRepository: Partial<CodeRepositoryResource>, owners?: ResourceOwner[]) => Promise<void>
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments?: Array<{ id: string; name: string }>
}

export function CodeRepositoryModal({
  isOpen,
  onClose,
  codeRepository,
  mode,
  onSave,
  employees,
  departments = []
}: CodeRepositoryModalProps) {
  const t = useTranslations('codeRepositories.modal')
  const [formData, setFormData] = useState<Partial<CodeRepositoryResource>>({
    platform: 'GitHub',
    repositoryName: '',
    organizationTeam: '',
    accessLevel: 'Read',
    branchRestrictions: '',
    assignedTo: '',
    ownerDepartment: '',
    status: 'ACTIVE',
    notes: '',
    webhookAccess: false,
    deploymentKeys: '',
    owner: ''
  })

  const [owners, setOwners] = useState<ResourceOwner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOwners = async () => {
      if (codeRepository?.id && mode !== 'create') {
        try {
          const response = await fetch(`/api/resources/owners?resourceType=CODE_REPOSITORY&resourceId=${codeRepository.id}`)
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

    if (codeRepository && mode !== 'create') {
      setFormData({
        ...codeRepository,
        owner: '', // Will be populated by fetchOwners
      })
      fetchOwners()
    } else if (mode === 'create') {
      setFormData({
        platform: 'GitHub',
        repositoryName: '',
        organizationTeam: '',
        accessLevel: 'Read',
        branchRestrictions: '',
        assignedTo: '',
        ownerDepartment: '',
        status: 'ACTIVE',
        notes: '',
        webhookAccess: false,
        deploymentKeys: '',
        owner: ''
      })
      setOwners([])
    }
    setErrors({})
  }, [codeRepository, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.platform) newErrors.platform = t('errors.platformRequired')
    if (!formData.repositoryName?.trim()) newErrors.repositoryName = t('errors.repositoryNameRequired')
    if (!formData.organizationTeam?.trim()) newErrors.organizationTeam = t('errors.organizationTeamRequired')
    if (!formData.accessLevel) newErrors.accessLevel = t('errors.accessLevelRequired')
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
      console.error('Error saving code repository:', error)
      setErrors({ submit: t('errors.saveFailed') })
    } finally {
      setIsLoading(false)
    }
  }

  const isViewMode = mode === 'view'

  const platforms = ['GitHub', 'GitLab', 'Bitbucket', 'Azure DevOps', 'AWS CodeCommit', 'Other']
  const accessLevels = ['Read', 'Write', 'Admin', 'Maintain', 'Triage']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
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
          {/* Repository Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <GitBranch className="h-4 w-4" />
              {t('repoInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="platform" className="text-sm font-medium">
                  {t('platform')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.platform && "border-destructive")}>
                    <SelectValue placeholder={t('selectPlatform')} />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.platform && <p className="text-xs text-destructive">{errors.platform}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="repositoryName" className="text-sm font-medium">
                  {t('repositoryName')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="repositoryName"
                  value={formData.repositoryName || ''}
                  onChange={(e) => setFormData({ ...formData, repositoryName: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.repositoryName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="my-awesome-project"
                />
                {errors.repositoryName && <p className="text-xs text-destructive">{errors.repositoryName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationTeam" className="text-sm font-medium">
                  {t('organizationTeam')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="organizationTeam"
                  value={formData.organizationTeam || ''}
                  onChange={(e) => setFormData({ ...formData, organizationTeam: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.organizationTeam && "border-destructive focus-visible:ring-destructive")}
                  placeholder="acme-corp"
                />
                {errors.organizationTeam && <p className="text-xs text-destructive">{errors.organizationTeam}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessLevel" className="text-sm font-medium">
                  {t('accessLevel')} {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.accessLevel}
                  onValueChange={(value) => setFormData({ ...formData, accessLevel: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.accessLevel && "border-destructive")}>
                    <SelectValue placeholder={t('selectAccessLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accessLevels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.accessLevel && <p className="text-xs text-destructive">{errors.accessLevel}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchRestrictions" className="text-sm font-medium">
                  {t('branchRestrictions')}
                </Label>
                <Input
                  id="branchRestrictions"
                  value={formData.branchRestrictions || ''}
                  onChange={(e) => setFormData({ ...formData, branchRestrictions: e.target.value })}
                  disabled={isViewMode}
                  placeholder="main, develop, production"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium">
                  {t('assignedTo')}
                </Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo || ''}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  disabled={isViewMode}
                  placeholder="john.doe@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerDepartment" className="text-sm font-medium">
                  {t('ownerDepartment')}
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ownerDepartment"
                    value={formData.ownerDepartment || ''}
                    onChange={(e) => setFormData({ ...formData, ownerDepartment: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                    placeholder="Engineering"
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
                    <SelectItem value="SUSPENDED">{t('statusSuspended')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Access Control Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Key className="h-4 w-4" />
              {t('accessControl')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="webhookAccess" className="text-sm font-medium">
                  {t('webhookAccess')}
                </Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="webhookAccess"
                    checked={formData.webhookAccess || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, webhookAccess: checked })}
                    disabled={isViewMode}
                  />
                  <Label htmlFor="webhookAccess" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.webhookAccess ? t('webhookEnabled') : t('webhookDisabled')}
                  </Label>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deploymentKeys" className="text-sm font-medium">
                  {t('deploymentKeys')}
                </Label>
                <Textarea
                  id="deploymentKeys"
                  value={formData.deploymentKeys || ''}
                  onChange={(e) => setFormData({ ...formData, deploymentKeys: e.target.value })}
                  disabled={isViewMode}
                  className="min-h-[60px] resize-none font-mono text-xs"
                  placeholder="ssh-rsa AAAAB3NzaC1yc2E..."
                />
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

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                {t('notes')}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isViewMode}
                className="min-h-[80px] resize-none"
                placeholder="Additional notes about this repository access..."
              />
            </div>
          </div>

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
                {mode === 'edit' ? t('updateRepo') : t('addRepo')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
