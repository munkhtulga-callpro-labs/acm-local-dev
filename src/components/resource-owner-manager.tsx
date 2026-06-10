'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmployeeCombobox } from '@/components/ui/employee-combobox'
import { Building2, User, Users, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResourceOwner {
  id?: string
  ownershipType: 'DEPARTMENT' | 'MAIN_OWNER' | 'SECONDARY_OWNER'
  ownerEmail?: string
  ownerDepartment?: string
  notes?: string
}

interface ResourceOwnerManagerProps {
  owners: ResourceOwner[]
  onChange: (owners: ResourceOwner[]) => void
  employees: Array<{ id: string; firstName: string; lastName: string; email: string }>
  departments: Array<{ id: string; name: string }>
  disabled?: boolean
}

export function ResourceOwnerManager({
  owners,
  onChange,
  employees,
  departments,
  disabled = false
}: ResourceOwnerManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newOwner, setNewOwner] = useState<Partial<ResourceOwner>>({
    ownershipType: 'SECONDARY_OWNER'
  })

  const handleAddOwner = () => {
    if (newOwner.ownershipType === 'DEPARTMENT' && !newOwner.ownerDepartment) {
      return
    }
    if (newOwner.ownershipType !== 'DEPARTMENT' && !newOwner.ownerEmail) {
      return
    }

    onChange([...owners, newOwner as ResourceOwner])
    setNewOwner({ ownershipType: 'SECONDARY_OWNER' })
    setShowAddForm(false)
  }

  const handleRemoveOwner = (index: number) => {
    onChange(owners.filter((_, i) => i !== index))
  }

  const getOwnerTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPARTMENT':
        return <Building2 className="h-4 w-4" />
      case 'MAIN_OWNER':
        return <User className="h-4 w-4" />
      case 'SECONDARY_OWNER':
        return <Users className="h-4 w-4" />
      default:
        return null
    }
  }

  const getOwnerTypeBadge = (type: string) => {
    const colors = {
      DEPARTMENT: 'bg-blue-100 text-blue-800',
      MAIN_OWNER: 'bg-purple-100 text-purple-800',
      SECONDARY_OWNER: 'bg-green-100 text-green-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const hasDepartmentOwner = owners.some(o => o.ownershipType === 'DEPARTMENT')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Resource Owners</Label>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Owner
          </Button>
        )}
      </div>

      {/* Existing Owners */}
      <div className="space-y-2">
        {owners.map((owner, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
                getOwnerTypeBadge(owner.ownershipType)
              )}>
                {getOwnerTypeIcon(owner.ownershipType)}
                {owner.ownershipType.replace('_', ' ')}
              </div>
              <div className="flex-1">
                {owner.ownershipType === 'DEPARTMENT' ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{owner.ownerDepartment}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{owner.ownerEmail}</span>
                  </div>
                )}
              </div>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveOwner(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {owners.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
            No owners assigned. Add at least one owner.
          </div>
        )}
      </div>

      {/* Add Owner Form */}
      {showAddForm && !disabled && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          <h4 className="font-medium text-sm">Add Resource Owner</h4>

          <div className="space-y-2">
            <Label htmlFor="ownershipType" className="text-sm">Owner Type</Label>
            <Select
              value={newOwner.ownershipType}
              onValueChange={(value) => setNewOwner({
                ...newOwner,
                ownershipType: value as any,
                ownerEmail: undefined,
                ownerDepartment: undefined
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {!hasDepartmentOwner && (
                  <SelectItem value="DEPARTMENT">Department Owner</SelectItem>
                )}
                <SelectItem value="SECONDARY_OWNER">Secondary Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newOwner.ownershipType === 'DEPARTMENT' ? (
            <div className="space-y-2">
              <Label htmlFor="ownerDepartment" className="text-sm">Department</Label>
              <Select
                value={newOwner.ownerDepartment}
                onValueChange={(value) => setNewOwner({ ...newOwner, ownerDepartment: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="ownerEmail" className="text-sm">Employee</Label>
              <EmployeeCombobox
                employees={employees}
                value={newOwner.ownerEmail}
                onValueChange={(value) => setNewOwner({ ...newOwner, ownerEmail: value })}
                placeholder="Search and select employee..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ownerNotes" className="text-sm">Notes (Optional)</Label>
            <Input
              id="ownerNotes"
              value={newOwner.notes || ''}
              onChange={(e) => setNewOwner({ ...newOwner, notes: e.target.value })}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddOwner}
              disabled={
                (newOwner.ownershipType === 'DEPARTMENT' && !newOwner.ownerDepartment) ||
                (newOwner.ownershipType !== 'DEPARTMENT' && !newOwner.ownerEmail)
              }
            >
              Add Owner
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddForm(false)
                setNewOwner({ ownershipType: 'SECONDARY_OWNER' })
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
