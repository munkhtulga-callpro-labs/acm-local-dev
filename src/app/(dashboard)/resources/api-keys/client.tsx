'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { APIKeyModal } from '@/components/api-key-modal'
import { APIKeysDataTable, type APIKeyResource } from '@/components/api-keys-data-table'
import { Key, ShieldCheck, AlertTriangle, Activity } from 'lucide-react'
import { API } from '@/lib/api'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface APIKeysClientProps {
  initialData: APIKeyResource[]
}

export function APIKeysClient({ initialData }: APIKeysClientProps) {
  const [data, setData] = useState<APIKeyResource[]>(initialData)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    mode: 'view' | 'edit' | 'create'
    apiKey?: APIKeyResource
  }>({ isOpen: false, mode: 'create' })

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch(API.resources.apiKeys.list)
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch {}
  }, [])

  const handleSave = async (apiKeyData: Partial<APIKeyResource>) => {
    const { mode, apiKey } = modalState

    let url: string
    if (mode === 'edit' && apiKey) {
      url = API.resources.apiKeys.detail(apiKey.id)
    } else {
      url = API.resources.apiKeys.list
    }

    const response = await fetch(url, {
      method: mode === 'edit' ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiKeyData),
    })

    if (response.ok) {
      toast.success(mode === 'edit' ? 'API key updated successfully' : 'API key added successfully')
      await refreshData()
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to save API key')
    }
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(API.resources.apiKeys.detail(deleteTarget.id), { method: 'DELETE' })
      if (response.ok) {
        toast.success(`"${deleteTarget.name}" deleted successfully`)
        setData(prev => prev.filter(k => k.id !== deleteTarget.id))
      } else {
        toast.error('Failed to delete API key')
      }
    } catch {
      toast.error('Error deleting API key')
    } finally {
      setDeleteTarget(null)
    }
  }

  const now = new Date()
  const [in30Days] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

  const totalKeys = data.length
  const activeKeys = data.filter((k) => k.status === 'ACTIVE').length
  const productionKeys = data.filter((k) => k.keyType.toLowerCase() === 'production').length
  const expiringSoon = data.filter((k) => {
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
            data={data}
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
