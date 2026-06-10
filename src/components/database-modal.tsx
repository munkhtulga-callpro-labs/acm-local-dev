'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Database, Server, User, Key, FileText, Shield, Calendar, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResourceOwnershipSection } from '@/components/resource-ownership-section'

interface DatabaseResource {
  id?: string
  name: string
  databaseType: string
  version?: string | null
  host: string
  port: number
  databaseName?: string | null
  schema?: string | null
  connectionString?: string | null
  adminUser?: string | null
  isEncrypted: boolean
  encryptionType?: string | null
  backupEnabled: boolean
  backupFrequency?: string | null
  lastBackupDate?: string | null
  owner: string
  environment: string
  accessLevel: string
  description?: string | null

  // ISO 27001 Compliance Fields
  requestedBy?: string | null
  approvedBy?: string | null
  approvalDate?: string | null
  businessJustification?: string | null
  accessRequestTicketId?: string | null
  expiryDate?: string | null
  reviewDate?: string | null

  isActive: boolean
}

interface ResourceOwner {
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface DatabaseModalProps {
  isOpen: boolean
  onClose: () => void
  database?: DatabaseResource
  mode: 'view' | 'edit' | 'create'
  onSave: (database: Partial<DatabaseResource>, owners: ResourceOwner[]) => Promise<void>
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments: Array<{ id: string; name: string }>
}

export function DatabaseModal({
  isOpen,
  onClose,
  database,
  mode,
  onSave,
  employees,
  departments
}: DatabaseModalProps) {
  const [formData, setFormData] = useState<Partial<DatabaseResource>>({
    name: '',
    databaseType: 'PostgreSQL',
    version: '',
    host: '',
    port: 5432,
    databaseName: '',
    schema: 'public',
    connectionString: '',
    adminUser: '',
    isEncrypted: true,
    encryptionType: 'AES-256',
    backupEnabled: true,
    backupFrequency: 'daily',
    owner: '',
    environment: 'production',
    accessLevel: 'read',
    description: '',
    isActive: true
  })

  const [owners, setOwners] = useState<ResourceOwner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (database && mode !== 'create') {
      setFormData({
        ...database,
        expiryDate: database.expiryDate ? new Date(database.expiryDate).toISOString().split('T')[0] : '',
        reviewDate: database.reviewDate ? new Date(database.reviewDate).toISOString().split('T')[0] : '',
        approvalDate: database.approvalDate ? new Date(database.approvalDate).toISOString().split('T')[0] : '',
        lastBackupDate: database.lastBackupDate ? new Date(database.lastBackupDate).toISOString().split('T')[0] : '',
      })

      // ✅ FIX: Load existing owners from API when editing
      const loadOwners = async () => {
        try {
          const response = await fetch(`/api/resources/owners?resourceType=DATABASE&resourceId=${database.id}`)
          if (response.ok) {
            const data = await response.json()
            setOwners(data.data || [])
            console.log('✅ Loaded existing owners:', data.data?.length)
          } else {
            console.error('Failed to load owners:', response.statusText)
            setOwners([])
          }
        } catch (error) {
          console.error('Error loading owners:', error)
          setOwners([])
        }
      }
      loadOwners()
    } else if (mode === 'create') {
      // Reset owners when creating new resource
      setOwners([])
      setFormData({
        name: '',
        databaseType: 'PostgreSQL',
        version: '',
        host: '',
        port: 5432,
        databaseName: '',
        schema: 'public',
        connectionString: '',
        adminUser: '',
        isEncrypted: true,
        encryptionType: 'AES-256',
        backupEnabled: true,
        backupFrequency: 'daily',
        owner: '',
        environment: 'production',
        accessLevel: 'read',
        description: '',
        requestedBy: '',
        approvedBy: '',
        businessJustification: '',
        isActive: true
      })
    }
    setErrors({})
  }, [database, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) newErrors.name = 'Database name is required'
    if (!formData.databaseType) newErrors.databaseType = 'Database type is required'
    if (!formData.host?.trim()) newErrors.host = 'Host is required'
    if (!formData.port || formData.port < 1 || formData.port > 65535) newErrors.port = 'Valid port number is required (1-65535)'
    if (!formData.owner?.trim()) newErrors.owner = 'Owner is required'
    if (!formData.environment) newErrors.environment = 'Environment is required'
    if (!formData.accessLevel) newErrors.accessLevel = 'Access level is required'

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
      console.error('Error saving database:', error)
      setErrors({ submit: 'Failed to save database. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const isViewMode = mode === 'view'

  const databaseTypes = ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server', 'MariaDB', 'Cassandra', 'DynamoDB', 'Other']
  const environments = ['development', 'staging', 'production', 'testing']
  const accessLevels = ['read', 'write', 'admin', 'full']
  const backupFrequencies = ['hourly', 'daily', 'weekly', 'monthly']

  // Default ports for database types
  const defaultPorts: Record<string, number> = {
    'PostgreSQL': 5432,
    'MySQL': 3306,
    'MongoDB': 27017,
    'Redis': 6379,
    'Oracle': 1521,
    'SQL Server': 1433,
    'MariaDB': 3306,
    'Cassandra': 9042,
    'DynamoDB': 8000,
    'Other': 5432
  }

  const handleDatabaseTypeChange = (value: string) => {
    setFormData({
      ...formData,
      databaseType: value,
      port: defaultPorts[value] || 5432
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            {mode === 'view' && 'Database Resource Details'}
            {mode === 'edit' && 'Edit Database Resource'}
            {mode === 'create' && 'Add New Database Resource'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === 'view' && 'View detailed information about this database resource.'}
            {mode === 'edit' && 'Update database resource information. Fields marked with * are required for ISO 27001 compliance.'}
            {mode === 'create' && 'Register a new database resource. Fields marked with * are required for ISO 27001 compliance.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Database Configuration Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Server className="h-4 w-4" />
              Database Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Database Name {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
                  placeholder="production-db"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="databaseType" className="text-sm font-medium">
                  Database Type {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.databaseType}
                  onValueChange={handleDatabaseTypeChange}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.databaseType && "border-destructive")}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {databaseTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.databaseType && <p className="text-xs text-destructive">{errors.databaseType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="version" className="text-sm font-medium">
                  Version
                </Label>
                <Input
                  id="version"
                  value={formData.version || ''}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  disabled={isViewMode}
                  placeholder="15.4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment" className="text-sm font-medium">
                  Environment {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value) => setFormData({ ...formData, environment: value })}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={cn("h-10", errors.environment && "border-destructive")}>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((env) => (
                      <SelectItem key={env} value={env}>
                        {env.charAt(0).toUpperCase() + env.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.environment && <p className="text-xs text-destructive">{errors.environment}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="host" className="text-sm font-medium">
                  Host {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="host"
                  value={formData.host || ''}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  disabled={isViewMode}
                  className={cn(errors.host && "border-destructive focus-visible:ring-destructive")}
                  placeholder="localhost or db.example.com"
                />
                {errors.host && <p className="text-xs text-destructive">{errors.host}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="port" className="text-sm font-medium">
                  Port {!isViewMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port || ''}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 0 })}
                  disabled={isViewMode}
                  className={cn(errors.port && "border-destructive focus-visible:ring-destructive")}
                  placeholder="5432"
                />
                {errors.port && <p className="text-xs text-destructive">{errors.port}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="databaseName" className="text-sm font-medium">
                  Database Name
                </Label>
                <Input
                  id="databaseName"
                  value={formData.databaseName || ''}
                  onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
                  disabled={isViewMode}
                  placeholder="myapp_db"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schema" className="text-sm font-medium">
                  Schema
                </Label>
                <Input
                  id="schema"
                  value={formData.schema || ''}
                  onChange={(e) => setFormData({ ...formData, schema: e.target.value })}
                  disabled={isViewMode}
                  placeholder="public"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminUser" className="text-sm font-medium">
                  Admin User
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminUser"
                    value={formData.adminUser || ''}
                    onChange={(e) => setFormData({ ...formData, adminUser: e.target.value })}
                    disabled={isViewMode}
                    className="pl-10"
                    placeholder="postgres"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Backup Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4" />
              Security & Backup
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="isEncrypted" className="text-sm font-medium">
                  Encryption Status
                </Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="isEncrypted"
                    checked={formData.isEncrypted || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isEncrypted: checked })}
                    disabled={isViewMode}
                  />
                  <Label htmlFor="isEncrypted" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.isEncrypted ? 'Encrypted' : 'Not Encrypted'}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="encryptionType" className="text-sm font-medium">
                  Encryption Type
                </Label>
                <Input
                  id="encryptionType"
                  value={formData.encryptionType || ''}
                  onChange={(e) => setFormData({ ...formData, encryptionType: e.target.value })}
                  disabled={isViewMode || !formData.isEncrypted}
                  placeholder="AES-256"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupEnabled" className="text-sm font-medium">
                  Backup Status
                </Label>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="backupEnabled"
                    checked={formData.backupEnabled || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, backupEnabled: checked })}
                    disabled={isViewMode}
                  />
                  <Label htmlFor="backupEnabled" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.backupEnabled ? 'Backup Enabled' : 'Backup Disabled'}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupFrequency" className="text-sm font-medium">
                  Backup Frequency
                </Label>
                <Select
                  value={formData.backupFrequency || ''}
                  onValueChange={(value) => setFormData({ ...formData, backupFrequency: value })}
                  disabled={isViewMode || !formData.backupEnabled}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {backupFrequencies.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.accessLevel && <p className="text-xs text-destructive">{errors.accessLevel}</p>}
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

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <FileText className="h-4 w-4" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isViewMode}
                  className="min-h-[80px] resize-none"
                  placeholder="Additional notes about this database resource..."
                />
              </div>

              {!isViewMode && (
                <div className="space-y-2">
                  <Label htmlFor="isActive" className="text-sm font-medium">
                    Status
                  </Label>
                  <div className="flex items-center space-x-3 pt-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive" className="text-sm text-muted-foreground cursor-pointer">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>
              )}
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
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-28"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'edit' ? 'Update Database' : 'Add Database'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
