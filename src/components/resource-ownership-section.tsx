'use client'

import { Label } from '@/components/ui/label'
import { Building2 } from 'lucide-react'
import { EmployeeCombobox } from '@/components/ui/employee-combobox'
import { ResourceOwnerManager } from '@/components/resource-owner-manager'
import { cn } from '@/lib/utils'

interface ResourceOwner {
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface ResourceOwnershipSectionProps {
  // Data
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments?: Array<{ id: string; name: string }>

  // Primary Owner
  owner: string | undefined
  onOwnerChange: (value: string) => void
  ownerError?: string

  // Additional Owners
  owners: ResourceOwner[]
  onOwnersChange: (owners: ResourceOwner[]) => void

  // View mode
  disabled?: boolean

  // Optional customization
  sectionTitle?: string
  primaryOwnerLabel?: string
  primaryOwnerPlaceholder?: string
  primaryOwnerHelp?: string
  additionalOwnersLabel?: string
  additionalOwnersViewLabel?: string
  additionalOwnersHelp?: string
}

export function ResourceOwnershipSection({
  employees,
  departments = [],
  owner,
  onOwnerChange,
  ownerError,
  owners,
  onOwnersChange,
  disabled = false,
  sectionTitle = 'Resource Ownership',
  primaryOwnerLabel = 'Primary Owner',
  primaryOwnerPlaceholder = 'Search and select primary owner...',
  primaryOwnerHelp = 'Primary owner manages this resource and approves access requests',
  additionalOwnersLabel = 'Additional Owners (Optional)',
  additionalOwnersViewLabel,
  additionalOwnersHelp = 'Add department owners and secondary owners who will also approve access requests',
}: ResourceOwnershipSectionProps) {
  const isViewMode = disabled

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
        <Building2 className="h-4 w-4" />
        {sectionTitle}
      </h3>

      <div className="space-y-4">
        {/* Primary Owner */}
        <div className="space-y-2">
          <Label htmlFor="owner" className="text-sm font-medium">
            {primaryOwnerLabel} {!isViewMode && <span className="text-destructive">*</span>}
          </Label>
          <EmployeeCombobox
            employees={employees}
            value={owner}
            onValueChange={onOwnerChange}
            placeholder={primaryOwnerPlaceholder}
            disabled={isViewMode}
            className={cn(ownerError && "border-destructive")}
          />
          {ownerError && <p className="text-xs text-destructive">{ownerError}</p>}
          <p className="text-xs text-muted-foreground">
            {primaryOwnerHelp}
          </p>
        </div>

        {/* Additional Owners - Edit/Create Mode */}
        {!isViewMode && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{additionalOwnersLabel}</Label>
            <ResourceOwnerManager
              owners={owners}
              onChange={onOwnersChange}
              employees={employees}
              departments={departments}
              disabled={isViewMode}
            />
            <p className="text-xs text-muted-foreground">
              {additionalOwnersHelp}
            </p>
          </div>
        )}

        {/* Additional Owners - View Mode */}
        {isViewMode && owners.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{additionalOwnersViewLabel ?? additionalOwnersLabel}</Label>
            <ResourceOwnerManager
              owners={owners}
              onChange={onOwnersChange}
              employees={employees}
              departments={departments}
              disabled={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}
