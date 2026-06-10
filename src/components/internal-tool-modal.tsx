'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wrench, Link2, FileText, Calendar, Loader2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResourceOwnershipSection } from '@/components/resource-ownership-section'

interface InternalTool {
  id?: string
  toolName: string
  url: string
  purposeCategory: string
  accessLevel: string
  authenticationMethod: string
  networkAccess: string
  ownerDepartment?: string | null
  userGroups?: string | null
  status: string
  notes?: string | null
  documentationLink?: string | null
  integrationSystems?: string | null
  owner?: string | null
}

interface ResourceOwner {
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface InternalToolModalProps {
  isOpen: boolean
  onClose: () => void
  tool?: InternalTool
  mode: 'view' | 'edit' | 'create'
  onSave: (tool: Partial<InternalTool>, owners: ResourceOwner[]) => Promise<void>
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments: Array<{ id: string; name: string }>
}

export function InternalToolModal({
  isOpen,
  onClose,
  tool,
  mode,
  onSave,
  employees,
  departments
}: InternalToolModalProps) {
  const [formData, setFormData] = useState<Partial<InternalTool>>({
    toolName: '',
    url: '',
    purposeCategory: 'Development',
    accessLevel: 'User',
    authenticationMethod: 'SSO',
    networkAccess: 'Internal',
    ownerDepartment: '',
    userGroups: '',
    status: 'ACTIVE',
    notes: '',
    documentationLink: '',
    integrationSystems: '',
    owner: ''
  })

  const [owners, setOwners] = useState<ResourceOwner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOwners = async () => {
      if (tool?.id && mode !== 'create') {
        try {
          const response = await fetch(`/api/resources/owners?resourceType=INTERNAL_TOOL&resourceId=${tool.id}`)
          if (response.ok) {
            const data = await response.json()
            const mainOwner = data.data?.find((o: any) => o.ownershipType === 'MAIN_OWNER')
            if (mainOwner && mainOwner.ownerEmail) {
              setFormData(prev => ({ ...prev, owner: mainOwner.ownerEmail }))
            }
            const additionalOwners = data.data?.filter((o: any) => o.ownershipType !== 'MAIN_OWNER') || []
            setOwners(additionalOwners)
          }
        } catch (error) {
          console.error('Error fetching owners:', error)
        }
      }
    }

    if (tool && mode !== 'create') {
      setFormData({ ...tool, owner: '' })
      fetchOwners()
    } else if (mode === 'create') {
      setOwners([])
      setFormData({
        toolName: '',
        url: '',
        purposeCategory: 'Development',
        accessLevel: 'User',
        authenticationMethod: 'SSO',
        networkAccess: 'Internal',
        ownerDepartment: '',
        userGroups: '',
        status: 'ACTIVE',
        notes: '',
        documentationLink: '',
        integrationSystems: '',
        owner: ''
      })
    }
    setErrors({})
  }, [tool, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.toolName?.trim()) newErrors.toolName = 'Tool name is required'
    if (!formData.url?.trim()) newErrors.url = 'URL is required'
    if (!formData.purposeCategory) newErrors.purposeCategory = 'Purpose category is required'
    if (!formData.accessLevel) newErrors.accessLevel = 'Access level is required'
    if (!formData.authenticationMethod) newErrors.authenticationMethod = 'Authentication method is required'
    if (!formData.networkAccess) newErrors.networkAccess = 'Network access is required'
    if (!formData.owner?.trim()) newErrors.owner = 'Primary owner is required'

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
      console.error('Error saving internal tool:', error)
      setErrors({ submit: 'Failed to save internal tool. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const isViewMode = mode === 'view'

  const purposeCategories = ['Development', 'Productivity', 'Monitoring', 'Analytics', 'Security', 'Communication', 'Testing', 'Deployment', 'Documentation', 'Other']
  const accessLevels = ['User', 'Admin', 'Read-only', 'Full Access', 'Limited', 'Restricted']
  const authenticationMethods = ['SSO', 'LDAP', 'OAuth', 'API Key', 'Username/Password', 'Certificate', 'Multi-Factor']
  const networkAccessOptions = ['Internal', 'VPN', 'Public', 'Restricted', 'Private Network']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            {mode === 'view' && 'Internal Tool Details'}
            {mode === 'edit' && 'Edit Internal Tool'}
            {mode === 'create' && 'Add New Internal Tool'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this internal tool.'}
            {mode === 'edit' && 'Update internal tool information. Fields marked with * are required.'}
            {mode === 'create' && 'Register a new internal tool. Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Tool Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Wrench className="h-4 w-4" />
              Tool Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="toolName" className="text-sm font-medium">
                  Tool Name {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="toolName"
                  value={formData.toolName || ''}
                  onChange={(e) => setFormData({ ...formData, toolName: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.toolName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Jenkins CI/CD"
                />
                {errors.toolName && <p className="text-xs text-destructive">{errors.toolName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium">
                  URL {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="url"
                    value={formData.url || ''}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    disabled={isViewMode}
                    className={cn("pl-10", errors.url && "border-destructive focus-visible:ring-destructive")}
                    placeholder="https://jenkins.company.com"
                  />
                </div>
                {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purposeCategory" className="text-sm font-medium">
                  Purpose Category {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.purposeCategory}
                  onValueChange={(value) => setFormData({ ...formData, purposeCategory: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.purposeCategory && "border-destructive")}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposeCategories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.purposeCategory && <p className="text-xs text-destructive">{errors.purposeCategory}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerDepartment" className="text-sm font-medium">
                  Owner Department
                </Label>
                <Input
                  id="ownerDepartment"
                  value={formData.ownerDepartment || ''}
                  onChange={(e) => setFormData({ ...formData, ownerDepartment: e.target.value })}
                  disabled={isViewMode}
                  placeholder="Engineering"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userGroups" className="text-sm font-medium">
                  User Groups
                </Label>
                <Input
                  id="userGroups"
                  value={formData.userGroups || ''}
                  onChange={(e) => setFormData({ ...formData, userGroups: e.target.value })}
                  disabled={isViewMode}
                  placeholder="Developers, DevOps"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentationLink" className="text-sm font-medium">
                  Documentation Link
                </Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="documentationLink"
                    value={formData.documentationLink || ''}
                    onChange={(e) => setFormData({ ...formData, documentationLink: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                    placeholder="https://docs.company.com/jenkins"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isViewMode}
                  className="min-h-[80px] resize-none"
                  placeholder="Additional notes about this internal tool..."
                />
              </div>
            </div>
          </div>

          {/* Access & Integration Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4" />
              Access & Integration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="accessLevel" className="text-sm font-medium">
                  Access Level {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.accessLevel}
                  onValueChange={(value) => setFormData({ ...formData, accessLevel: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.accessLevel && "border-destructive")}>
                    <SelectValue placeholder="Select access level" />
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
                <Label htmlFor="authenticationMethod" className="text-sm font-medium">
                  Authentication Method {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.authenticationMethod}
                  onValueChange={(value) => setFormData({ ...formData, authenticationMethod: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.authenticationMethod && "border-destructive")}>
                    <SelectValue placeholder="Select authentication" />
                  </SelectTrigger>
                  <SelectContent>
                    {authenticationMethods.map((method) => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.authenticationMethod && <p className="text-xs text-destructive">{errors.authenticationMethod}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="networkAccess" className="text-sm font-medium">
                  Network Access {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.networkAccess}
                  onValueChange={(value) => setFormData({ ...formData, networkAccess: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.networkAccess && "border-destructive")}>
                    <SelectValue placeholder="Select network access" />
                  </SelectTrigger>
                  <SelectContent>
                    {networkAccessOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.networkAccess && <p className="text-xs text-destructive">{errors.networkAccess}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="DEPRECATED">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="integrationSystems" className="text-sm font-medium">
                  Integration Systems
                </Label>
                <Input
                  id="integrationSystems"
                  value={formData.integrationSystems || ''}
                  onChange={(e) => setFormData({ ...formData, integrationSystems: e.target.value })}
                  disabled={isViewMode}
                  placeholder="GitHub, Slack, JIRA"
                />
              </div>
            </div>
          </div>

          {/* Resource Ownership Section */}
          <ResourceOwnershipSection
            employees={employees}
            departments={departments}
            owner={formData.owner || undefined}
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
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-28"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? 'Update Tool' : 'Add Tool'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
