'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileStorageModal } from '@/components/file-storage-modal'
import { FileStorageDataTable, type FileStorageResource } from '@/components/file-storage-data-table'
import { HardDrive, Lock, Database, Activity } from 'lucide-react'
import { createFileStorage, updateFileStorage, deleteFileStorage } from '@/lib/actions/file-storage'
import { type FileStorageFormData } from '@/lib/schemas/file-storage'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface FileStorageClientProps {
  initialData: FileStorageResource[]
}

export function FileStorageClient({ initialData }: FileStorageClientProps) {
  const t = useTranslations('fileStorage')
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    mode: 'view' | 'edit' | 'create'
    fileStorage?: FileStorageResource
  }>({ isOpen: false, mode: 'create' })

  const handleSave = async (data: FileStorageFormData): Promise<boolean> => {
    const { mode, fileStorage } = modalState

    try {
      const result = mode === 'edit' && fileStorage
        ? await updateFileStorage(fileStorage.id, data)
        : await createFileStorage(data)

      if (result?.error) {
        if (typeof result.error === 'string') {
          toast.error(result.error === 'Forbidden'
            ? t('errors.forbidden')
            : t('errors.sessionExpired'))
        } else {
          toast.error(t('errors.formErrors'))
        }
        return false
      }

      toast.success(mode === 'edit' ? t('success.updated') : t('success.added'))
      router.refresh()
      return true
    } catch {
      toast.error(t('errors.saveFailed'))
      return false
    }
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const result = await deleteFileStorage(deleteTarget.id)
      if (result?.error) {
        toast.error(result.error === 'Forbidden'
          ? t('errors.deleteForbidden')
          : t('errors.sessionExpired'))
        return
      }
      toast.success(t('success.deleted', { name: deleteTarget.name }))
      router.refresh()
    } catch {
      toast.error(t('errors.deleteError'))
    } finally {
      setDeleteTarget(null)
    }
  }

  const totalRecords = initialData.length
  const activeRecords = initialData.filter((f) => f.status === 'ACTIVE').length
  const encryptedRecords = initialData.filter((f) => f.encryptionStatus && f.encryptionStatus.toLowerCase() !== 'none').length
  const withQuota = initialData.filter((f) => f.quotaLimit).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
          <HardDrive className="mr-2 h-4 w-4" />
          {t('addStorage')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalRecords')}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">{t('stats.activeCount', { count: activeRecords })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.active')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRecords}</div>
            <p className="text-xs text-muted-foreground">{t('stats.activeDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.encrypted')}</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{encryptedRecords}</div>
            <p className="text-xs text-muted-foreground">{t('stats.encryptedDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.withQuota')}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withQuota}</div>
            <p className="text-xs text-muted-foreground">{t('stats.withQuotaDesc')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t('cardTitle')}</CardTitle>
          <CardDescription className="mt-1.5">
            {t('cardDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          <FileStorageDataTable
            data={initialData}
            onEdit={(item) => setModalState({ isOpen: true, mode: 'edit', fileStorage: item })}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <FileStorageModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        fileStorage={modalState.fileStorage}
        mode={modalState.mode}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('deleteDialog.title')}
        description={t('deleteDialog.description', { name: deleteTarget?.name ?? '' })}
        onConfirm={confirmDelete}
        confirmLabel={t('deleteDialog.confirm')}
      />
    </div>
  )
}
