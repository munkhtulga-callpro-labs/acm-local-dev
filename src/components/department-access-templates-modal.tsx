'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Boxes, Layers, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AccessTemplate {
  id: string
  kind: 'SYSTEM' | 'RESOURCE'
  systemId: string | null
  resourceType: string | null
  resourceId: string | null
  resourceName: string | null
  accessLevel: string
  isRequired: boolean
  isActive: boolean
  system?: { id: string; name: string; category: string } | null
}

interface CatalogEntry {
  id: string
  resourceType: string
  displayName: string
}

interface DepartmentAccessTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  department?: { id: string; name: string }
  canManage: boolean
}

type DraftState = {
  kind: 'SYSTEM' | 'RESOURCE'
  systemId: string
  catalogKey: string
  accessLevel: string
  isRequired: boolean
  isActive: boolean
}

const emptyDraft: DraftState = {
  kind: 'SYSTEM',
  systemId: '',
  catalogKey: '',
  accessLevel: '',
  isRequired: true,
  isActive: true,
}

// The catalog is a flat list across 12 resource tables where ids are only unique
// per type, so pair the two into a single select value.
const catalogKeyOf = (entry: Pick<CatalogEntry, 'resourceType' | 'id'>) =>
  `${entry.resourceType}:${entry.id}`

export function DepartmentAccessTemplatesModal({
  isOpen,
  onClose,
  department,
  canManage,
}: DepartmentAccessTemplatesModalProps) {
  const t = useTranslations('departments.accessTemplates')

  const [templates, setTemplates] = useState<AccessTemplate[]>([])
  const [systems, setSystems] = useState<Array<{ id: string; name: string }>>([])
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftState>(emptyDraft)

  const fetchTemplates = useCallback(async () => {
    if (!department) return
    try {
      setLoading(true)
      const response = await fetch(`/api/departments/${department.id}/access-templates`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || t('errors.fetchFailed'))
      setTemplates(data.data || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.fetchFailed'))
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [department, t])

  useEffect(() => {
    if (!isOpen || !department) return

    fetchTemplates()

    // Pickers are only needed by the add/edit form, but loading them up front keeps
    // the form from flashing empty selects when it opens.
    fetch('/api/systems?limit=200')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const list = data?.data ?? data?.systems ?? data
        if (Array.isArray(list)) {
          setSystems(
            (list as Array<{ id: string; name: string }>).map(s => ({ id: s.id, name: s.name }))
          )
        }
      })
      .catch(() => setSystems([]))

    fetch('/api/resources/catalog')
      .then(res => (res.ok ? res.json() : null))
      .then(data => setCatalog(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setCatalog([]))
  }, [isOpen, department, fetchTemplates])

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setDraft(emptyDraft)
  }

  const handleClose = () => {
    resetForm()
    setError('')
    onClose()
  }

  const startEdit = (template: AccessTemplate) => {
    setEditingId(template.id)
    setDraft({
      kind: template.kind,
      systemId: template.systemId ?? '',
      catalogKey:
        template.resourceType && template.resourceId
          ? catalogKeyOf({ resourceType: template.resourceType, id: template.resourceId })
          : '',
      accessLevel: template.accessLevel,
      isRequired: template.isRequired,
      isActive: template.isActive,
    })
    setShowForm(true)
  }

  const draftIsValid =
    draft.accessLevel.trim().length > 0 &&
    (draft.kind === 'SYSTEM' ? draft.systemId.length > 0 : draft.catalogKey.length > 0)

  const buildPayload = () => {
    const common = {
      accessLevel: draft.accessLevel.trim(),
      isRequired: draft.isRequired,
      isActive: draft.isActive,
    }

    if (draft.kind === 'SYSTEM') {
      return { kind: 'SYSTEM' as const, systemId: draft.systemId, ...common }
    }

    const entry = catalog.find(c => catalogKeyOf(c) === draft.catalogKey)
    return {
      kind: 'RESOURCE' as const,
      resourceType: entry?.resourceType ?? '',
      resourceId: entry?.id ?? '',
      resourceName: entry?.displayName ?? '',
      ...common,
    }
  }

  const handleSave = async () => {
    if (!department || !draftIsValid) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch(
        editingId
          ? `/api/departments/${department.id}/access-templates/${editingId}`
          : `/api/departments/${department.id}/access-templates`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload()),
        }
      )

      const data = await response.json()
      if (!response.ok) {
        // Field errors come back as a zod fieldErrors map; flatten to one line.
        const message =
          typeof data.error === 'string'
            ? data.error
            : Object.values(data.error ?? {}).flat().join(', ') || t('errors.saveFailed')
        throw new Error(message)
      }

      resetForm()
      await fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (template: AccessTemplate) => {
    if (!department) return
    const label = template.system?.name ?? template.resourceName ?? ''
    if (!confirm(t('confirmDelete', { name: label }))) return

    try {
      setError('')
      const response = await fetch(
        `/api/departments/${department.id}/access-templates/${template.id}`,
        { method: 'DELETE' }
      )
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.deleteFailed'))
      }
      await fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.deleteFailed'))
    }
  }

  const catalogByType = useMemo(() => {
    return catalog.reduce<Record<string, CatalogEntry[]>>((acc, entry) => {
      ;(acc[entry.resourceType] ??= []).push(entry)
      return acc
    }, {})
  }, [catalog])

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title', { department: department?.name ?? '' })}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t('templateCount', { count: templates.length })}
            </Label>
            {canManage && !showForm && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {t('addTemplate')}
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
              {t('empty')}
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={cn(
                    'flex items-center justify-between p-3 border rounded-lg bg-muted/30',
                    !template.isActive && 'opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 shrink-0">
                      {template.kind === 'SYSTEM' ? (
                        <Layers className="h-3.5 w-3.5" />
                      ) : (
                        <Boxes className="h-3.5 w-3.5" />
                      )}
                      {t(`kind.${template.kind}`)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">
                        {template.system?.name ?? template.resourceName ?? '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('accessLevelLabel')}: {template.accessLevel}
                        {template.isRequired && ` · ${t('required')}`}
                        {!template.isActive && ` · ${t('inactive')}`}
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showForm && canManage && (
            <div className="border rounded-lg p-4 space-y-4 bg-card">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  {editingId ? t('editTemplate') : t('addTemplate')}
                </h4>
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{t('kindLabel')}</Label>
                <Select
                  value={draft.kind}
                  onValueChange={value =>
                    setDraft({ ...draft, kind: value as DraftState['kind'], systemId: '', catalogKey: '' })
                  }
                  // Kind is fixed on edit: the API rejects switching, since the
                  // template would then point at a different thing entirely.
                  disabled={editingId !== null}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYSTEM">{t('kind.SYSTEM')}</SelectItem>
                    <SelectItem value="RESOURCE">{t('kind.RESOURCE')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {draft.kind === 'SYSTEM' ? (
                <div className="space-y-2">
                  <Label className="text-sm">{t('systemLabel')}</Label>
                  <Select
                    value={draft.systemId}
                    onValueChange={value => setDraft({ ...draft, systemId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('systemPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {systems.map(system => (
                        <SelectItem key={system.id} value={system.id}>
                          {system.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm">{t('resourceLabel')}</Label>
                  <Select
                    value={draft.catalogKey}
                    onValueChange={value => setDraft({ ...draft, catalogKey: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('resourcePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(catalogByType).map(([type, entries]) => (
                        <div key={type}>
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            {type.replace(/_/g, ' ')}
                          </div>
                          {entries.map(entry => (
                            <SelectItem key={catalogKeyOf(entry)} value={catalogKeyOf(entry)}>
                              {entry.displayName}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="templateAccessLevel" className="text-sm">
                  {t('accessLevelLabel')}
                </Label>
                <Input
                  id="templateAccessLevel"
                  value={draft.accessLevel}
                  onChange={e => setDraft({ ...draft, accessLevel: e.target.value })}
                  placeholder={t('accessLevelPlaceholder')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">{t('requiredLabel')}</Label>
                  <p className="text-xs text-muted-foreground">{t('requiredHint')}</p>
                </div>
                <Switch
                  checked={draft.isRequired}
                  onCheckedChange={checked => setDraft({ ...draft, isRequired: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">{t('activeLabel')}</Label>
                  <p className="text-xs text-muted-foreground">{t('activeHint')}</p>
                </div>
                <Switch
                  checked={draft.isActive}
                  onCheckedChange={checked => setDraft({ ...draft, isActive: checked })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleSave} disabled={!draftIsValid || saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {editingId ? t('saveChanges') : t('addTemplate')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}

          {!canManage && (
            <p className="text-xs text-muted-foreground">{t('readOnlyNotice')}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
