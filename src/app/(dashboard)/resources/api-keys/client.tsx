'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { APIKeyModal } from '@/components/api-key-modal'
import { APIKeysDataTable, type APIKeyResource } from '@/components/api-keys-data-table'
import { Key, ShieldCheck, AlertTriangle, Activity } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { createApiKey, updateApiKey, deleteApiKey } from '@/lib/actions/api-keys'

interface APIKeysClientProps {
  initialData: APIKeyResource[]
}

export function APIKeysClient({ initialData }: APIKeysClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    mode: 'view' | 'edit' | 'create'
    apiKey?: APIKeyResource
  }>({ isOpen: false, mode: 'create' })

  const handleSave = async (apiKeyData: Partial<APIKeyResource>) => {
    const { mode, apiKey } = modalState

    const result = mode === 'edit' && apiKey
      ? await updateApiKey(apiKey.id, apiKeyData)
      : await createApiKey(apiKeyData)

    if (result?.error) {
      if (typeof result.error === 'string') {
        toast.error(result.error === 'Forbidden'
          ? 'You don\'t have permission to manage API keys'
          : 'Session expired, please log in again')
      } else {
        toast.error('Please fix the form errors and try again')
      }
    } else {
      toast.success(mode === 'edit' ? 'API key updated successfully' : 'API key added successfully')
      router.refresh()
    }
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const result = await deleteApiKey(deleteTarget.id)
      if (result?.error) {
        toast.error(result.error === 'Forbidden'
          ? 'You don\'t have permission to delete API keys'
          : 'Session expired, please log in again')
        return
      }
      toast.success(`"${deleteTarget.name}" deleted successfully`)
      router.refresh()
    } catch {
      toast.error('Error deleting API key')
    } finally {
      setDeleteTarget(null)
    }
  }

  const now = new Date()
  const [in30Days] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

  const totalKeys = initialData.length
  const activeKeys = initialData.filter((k) => k.status === 'ACTIVE').length
  const productionKeys = initialData.filter((k) => k.keyType.toLowerCase() === 'production').length
  const expiringSoon = initialData.filter((k) => {
    if (!k.expiryDate) return false
    const d = new Date(k.expiryDate)
    return d > now && d < in30Days
  }).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground">Manage API keys and integration tokens — ISO 27001 Compliant</p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
          <Key className="mr-2 h-4 w-4" />
          Add API Key
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKeys}</div>
            <p className="text-xs text-muted-foreground">{activeKeys} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeKeys}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionKeys}</div>
            <p className="text-xs text-muted-foreground">Live environment keys</p>
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
          <CardTitle>API Keys & Integrations</CardTitle>
          <CardDescription className="mt-1.5">
            Track and manage API keys, tokens, and integration credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          <APIKeysDataTable
            data={initialData}
            onEdit={(apiKey) => setModalState({ isOpen: true, mode: 'edit', apiKey })}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <APIKeyModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        apiKey={modalState.apiKey}
        mode={modalState.mode}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete API Key"
        description={`Are you sure you want to delete the key for "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmLabel="Delete"
      />
    </div>
  )
}
