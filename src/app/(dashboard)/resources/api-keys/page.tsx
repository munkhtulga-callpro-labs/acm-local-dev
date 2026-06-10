'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { APIKeyModal } from '@/components/api-key-modal'
import { APIKeysDataTable, type APIKeyResource } from '@/components/api-keys-data-table'
import { Key, ShieldCheck, AlertTriangle, Activity } from 'lucide-react'
import { API } from '@/lib/api'

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKeyResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; apiKey?: APIKeyResource }>({
    isOpen: false,
    mode: 'create',
  })

  useEffect(() => {
    fetchAPIKeys()
  }, [])

  const fetchAPIKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch(API.resources.apiKeys.list)
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.data || [])
      } else {
        setError('Failed to fetch API keys')
      }
    } catch {
      setError('Error fetching API keys')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (apiKeyData: any) => {
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
      setSuccess(mode === 'edit' ? 'API key updated successfully' : 'API key added successfully')
      fetchAPIKeys()
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to save API key')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the key for "${name}"?`)) return
    try {
      const response = await fetch(API.resources.apiKeys.detail(id), { method: 'DELETE' })
      if (response.ok) {
        setSuccess(`"${name}" deleted successfully`)
        fetchAPIKeys()
      } else {
        setError('Failed to delete API key')
      }
    } catch {
      setError('Error deleting API key')
    }
  }

  const now = new Date()
  const [in30Days] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

  const totalKeys = apiKeys.length
  const activeKeys = apiKeys.filter((k) => k.status === 'ACTIVE').length
  const productionKeys = apiKeys.filter((k) => k.keyType.toLowerCase() === 'production').length
  const expiringSoon = apiKeys.filter((k) => {
    if (!k.expiryDate) return false
    const d = new Date(k.expiryDate)
    return d > now && d < in30Days
  }).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
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

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
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

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>API Keys & Integrations</CardTitle>
          <CardDescription className="mt-1.5">
            Track and manage API keys, tokens, and integration credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <APIKeysDataTable
              data={apiKeys}
              onEdit={(apiKey) => setModalState({ isOpen: true, mode: 'edit', apiKey })}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      <APIKeyModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        apiKey={modalState.apiKey}
        mode={modalState.mode}
        onSave={handleSave}
      />
    </div>
  )
}
