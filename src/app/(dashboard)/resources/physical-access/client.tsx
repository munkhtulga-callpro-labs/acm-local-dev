'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PhysicalAccessModal } from '@/components/physical-access-modal'
import { PhysicalAccessDataTable, type PhysicalAccessResource } from '@/components/physical-access-data-table'
import { DoorOpen, Users, AlertTriangle, Activity } from 'lucide-react'
import { createPhysicalAccess, updatePhysicalAccess, deletePhysicalAccess } from '@/lib/actions/physical-access'
import { type PhysicalAccessFormData } from '@/lib/schemas/physical-access'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface PhysicalAccessClientProps {
  initialData: PhysicalAccessResource[]
}

export function PhysicalAccessClient({ initialData }: PhysicalAccessClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    mode: 'view' | 'edit' | 'create'
    physicalAccess?: PhysicalAccessResource
  }>({ isOpen: false, mode: 'create' })

  const handleSave = async (data: PhysicalAccessFormData): Promise<boolean> => {
    const { mode, physicalAccess } = modalState

    try {
      const result = mode === 'edit' && physicalAccess
        ? await updatePhysicalAccess(physicalAccess.id, data)
        : await createPhysicalAccess(data)

      if (result?.error) {
        if (typeof result.error === 'string') {
          toast.error(result.error === 'Forbidden'
            ? 'You don\'t have permission to manage physical access'
            : 'Session expired, please log in again')
        } else {
          toast.error('Please fix the form errors and try again')
        }
        // Keep the modal open so the user doesn't lose their input
        return false
      }

      toast.success(mode === 'edit' ? 'Physical access updated successfully' : 'Physical access added successfully')
      router.refresh()
      return true
    } catch {
      toast.error('Something went wrong. Please try again.')
      return false
    }
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const result = await deletePhysicalAccess(deleteTarget.id)
      if (result?.error) {
        toast.error(result.error === 'Forbidden'
          ? 'You don\'t have permission to delete physical access'
          : 'Session expired, please log in again')
        return
      }
      toast.success(`"${deleteTarget.name}" deleted successfully`)
      router.refresh()
    } catch {
      toast.error('Error deleting physical access record')
    } finally {
      setDeleteTarget(null)
    }
  }

  const now = new Date()
  const [in30Days] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

  const totalRecords = initialData.length
  const activeRecords = initialData.filter((r) => r.status === 'ACTIVE').length
  const escortRequired = initialData.filter((r) => r.escortRequired).length
  const expiringSoon = initialData.filter((r) => {
    if (!r.validTo) return false
    const d = new Date(r.validTo)
    return d > now && d < in30Days
  }).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Physical Access</h1>
          <p className="text-muted-foreground">Manage building and room access permissions — ISO 27001 Compliant</p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
          <DoorOpen className="mr-2 h-4 w-4" />
          Add Access
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">{activeRecords} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRecords}</div>
            <p className="text-xs text-muted-foreground">Currently granted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escort Required</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escortRequired}</div>
            <p className="text-xs text-muted-foreground">Supervised access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Physical Access Records</CardTitle>
          <CardDescription className="mt-1.5">
            Track and manage building, room, and zone access permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          <PhysicalAccessDataTable
            data={initialData}
            onEdit={(item) => setModalState({ isOpen: true, mode: 'edit', physicalAccess: item })}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <PhysicalAccessModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        physicalAccess={modalState.physicalAccess}
        mode={modalState.mode}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Physical Access"
        description={`Are you sure you want to delete access for "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmLabel="Delete"
      />
    </div>
  )
}
