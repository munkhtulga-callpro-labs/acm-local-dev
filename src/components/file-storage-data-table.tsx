'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react'
import {
  IconCircleCheckFilled,
  IconCircleFilled,
  IconFolder,
  IconShieldLock,
  IconLock,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

export type FileStorageResource = {
  id: string
  storageType: string
  pathLocation: string
  permissionLevel: string
  quotaLimit?: string | null
  assignedTo?: string | null
  encryptionStatus?: string | null
  ownerDepartment?: string | null
  status: string
  notes?: string | null
  sharingSettings?: string | null
  retentionPolicy?: string | null
  createdAt: string
}

interface FileStorageDataTableProps {
  data: FileStorageResource[]
  onEdit?: (item: FileStorageResource) => void
  onDelete?: (id: string, name: string) => void
}

type TFunc = ReturnType<typeof useTranslations<'fileStorage.table'>>

const getStatusBadge = (status: string, t: TFunc) => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
          {t('statusActive')}
        </Badge>
      )
    case 'ARCHIVED':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleFilled className="fill-yellow-500 dark:fill-yellow-400 mr-1 w-3 h-3" />
          {t('statusArchived')}
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleFilled className="fill-gray-400 dark:fill-gray-500 mr-1 w-3 h-3" />
          {status}
        </Badge>
      )
  }
}

const getPermissionBadge = (level: string, t: TFunc) => {
  const l = level.toLowerCase()
  if (l.includes('full') || l.includes('control')) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconShieldLock className="mr-1 w-3 h-3 text-red-500" />
        {t('permFullControl')}
      </Badge>
    )
  }
  if (l.includes('write')) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconShieldLock className="mr-1 w-3 h-3 text-blue-500" />
        {t('permWrite')}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
      <IconShieldLock className="mr-1 w-3 h-3 text-green-500" />
      {t('permRead')}
    </Badge>
  )
}

export function FileStorageDataTable({ data, onEdit, onDelete }: FileStorageDataTableProps) {
  const t = useTranslations('fileStorage.table')
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedItem, setSelectedItem] = React.useState<FileStorageResource | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const columns: ColumnDef<FileStorageResource>[] = [
    {
      accessorKey: 'pathLocation',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="px-0 hover:bg-transparent"
        >
          {t('pathLocation')}
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconFolder className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="font-medium font-mono text-sm truncate max-w-[240px]">
            {row.getValue('pathLocation')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'storageType',
      header: t('storageType'),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          {row.getValue('storageType')}
        </Badge>
      ),
    },
    {
      accessorKey: 'permissionLevel',
      header: t('permission'),
      cell: ({ row }) => getPermissionBadge(row.getValue('permissionLevel'), t),
    },
    {
      accessorKey: 'quotaLimit',
      header: t('quota'),
      cell: ({ row }) => {
        const val = row.getValue('quotaLimit') as string | null
        return val
          ? <span className="text-sm">{val}</span>
          : <span className="text-sm text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: 'assignedTo',
      header: t('assignedTo'),
      cell: ({ row }) => {
        const val = row.getValue('assignedTo') as string | null
        return val
          ? <span className="text-sm">{val}</span>
          : <span className="text-sm text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: 'encryptionStatus',
      header: t('encryption'),
      cell: ({ row }) => {
        const val = row.getValue('encryptionStatus') as string | null
        return val ? (
          <div className="flex items-center gap-1">
            <IconLock className="w-3 h-3 text-green-500" />
            <span className="text-sm">{val}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => getStatusBadge(row.getValue('status'), t),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t('openMenu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { setSelectedItem(item); setDrawerOpen(true) }}>
                {t('viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(item)}>{t('editStorage')}</DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(item.id, item.pathLocation)}
                  className="text-destructive"
                >
                  {t('deleteStorage')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder={t('searchPlaceholder')}
          value={(table.getColumn('pathLocation')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('pathLocation')?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {t('columns')} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns().filter((c) => c.getCanHide()).map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {t('recordsTotal', { count: table.getFilteredRowModel().rows.length })}
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            {t('previous')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            {t('next')}
          </Button>
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <IconFolder className="w-4 h-4" />
                {selectedItem?.pathLocation}
              </DrawerTitle>
              <DrawerDescription>{t('drawer.description')}</DrawerDescription>
            </DrawerHeader>
            {selectedItem && (
              <div className="p-4 pb-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.storageType')}</p>
                    <p className="text-sm mt-1">{selectedItem.storageType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.permission')}</p>
                    <div className="mt-1">{getPermissionBadge(selectedItem.permissionLevel, t)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.status')}</p>
                    <div className="mt-1">{getStatusBadge(selectedItem.status, t)}</div>
                  </div>
                  {selectedItem.quotaLimit && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.quotaLimit')}</p>
                      <p className="text-sm mt-1">{selectedItem.quotaLimit}</p>
                    </div>
                  )}
                  {selectedItem.assignedTo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.assignedTo')}</p>
                      <p className="text-sm mt-1">{selectedItem.assignedTo}</p>
                    </div>
                  )}
                  {selectedItem.encryptionStatus && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.encryption')}</p>
                      <p className="text-sm mt-1">{selectedItem.encryptionStatus}</p>
                    </div>
                  )}
                  {selectedItem.ownerDepartment && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.ownerDepartment')}</p>
                      <p className="text-sm mt-1">{selectedItem.ownerDepartment}</p>
                    </div>
                  )}
                  {selectedItem.sharingSettings && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.sharingSettings')}</p>
                      <p className="text-sm mt-1">{selectedItem.sharingSettings}</p>
                    </div>
                  )}
                  {selectedItem.retentionPolicy && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.retentionPolicy')}</p>
                      <p className="text-sm mt-1">{selectedItem.retentionPolicy}</p>
                    </div>
                  )}
                  {selectedItem.notes && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.notes')}</p>
                      <p className="text-sm mt-1">{selectedItem.notes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.created')}</p>
                    <p className="text-sm mt-1">{new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
            <DrawerFooter>
              <div className="flex gap-2 w-full">
                {onEdit && selectedItem && (
                  <Button variant="outline" onClick={() => { setDrawerOpen(false); onEdit(selectedItem) }} className="flex-1">
                    {t('drawer.edit')}
                  </Button>
                )}
                {onDelete && selectedItem && (
                  <Button variant="destructive" onClick={() => { setDrawerOpen(false); onDelete(selectedItem.id, selectedItem.pathLocation) }} className="flex-1">
                    {t('drawer.delete')}
                  </Button>
                )}
              </div>
              <DrawerClose asChild>
                <Button variant="outline">{t('drawer.close')}</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
