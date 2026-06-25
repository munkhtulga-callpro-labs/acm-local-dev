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
  IconBuilding,
  IconShieldLock,
  IconUserCheck,
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

export type PhysicalAccessResource = {
  id: string
  location: string
  accessType: string
  badgeCardNumber?: string | null
  accessSchedule: string
  accessZones: string
  assignedTo?: string | null
  validFrom: string
  validTo?: string | null
  status: string
  escortRequired: boolean
  authorizationLevel?: string | null
  notes?: string | null
  createdAt: string
}

interface PhysicalAccessDataTableProps {
  data: PhysicalAccessResource[]
  onEdit?: (item: PhysicalAccessResource) => void
  onDelete?: (id: string, name: string) => void
}

type TFunc = ReturnType<typeof useTranslations<'physicalAccess.table'>>

const getStatusBadge = (status: string, t: TFunc) => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
          {t('statusActive')}
        </Badge>
      )
    case 'EXPIRED':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleFilled className="fill-red-500 dark:fill-red-400 mr-1 w-3 h-3" />
          {t('statusExpired')}
        </Badge>
      )
    case 'SUSPENDED':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleFilled className="fill-yellow-500 dark:fill-yellow-400 mr-1 w-3 h-3" />
          {t('statusSuspended')}
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

const getAccessTypeBadge = (type: string, t: TFunc) => {
  switch (type.toLowerCase()) {
    case 'biometric':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-blue-500" />
          {t('typeBiometric')}
        </Badge>
      )
    case 'badge':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconUserCheck className="mr-1 w-3 h-3 text-green-500" />
          {t('typeBadge')}
        </Badge>
      )
    case 'key':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-yellow-500" />
          {t('typeKey')}
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          {type}
        </Badge>
      )
  }
}

export function PhysicalAccessDataTable({ data, onEdit, onDelete }: PhysicalAccessDataTableProps) {
  const t = useTranslations('physicalAccess.table')
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedItem, setSelectedItem] = React.useState<PhysicalAccessResource | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const columns: ColumnDef<PhysicalAccessResource>[] = [
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="px-0 hover:bg-transparent"
        >
          {t('location')}
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconBuilding className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="font-medium">{row.getValue('location')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'accessType',
      header: t('accessType'),
      cell: ({ row }) => getAccessTypeBadge(row.getValue('accessType'), t),
    },
    {
      accessorKey: 'accessZones',
      header: t('zones'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-[160px] block">
          {row.getValue('accessZones')}
        </span>
      ),
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
      accessorKey: 'validTo',
      header: t('validUntil'),
      cell: ({ row }) => {
        const val = row.getValue('validTo') as string | null
        if (!val) return <span className="text-sm text-muted-foreground">{t('noExpiry')}</span>
        const date = new Date(val)
        const isExpired = date < new Date()
        const isSoon = !isExpired && date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        return (
          <span className={`text-sm ${isExpired ? 'text-red-500 font-medium' : isSoon ? 'text-yellow-500 font-medium' : ''}`}>
            {date.toLocaleDateString()}
          </span>
        )
      },
    },
    {
      accessorKey: 'escortRequired',
      header: t('escort'),
      cell: ({ row }) => {
        const required = row.getValue('escortRequired') as boolean
        return required ? (
          <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
            <IconUserCheck className="mr-1 w-3 h-3 text-orange-500" />
            {t('required')}
          </Badge>
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
                <DropdownMenuItem onClick={() => onEdit(item)}>{t('editAccess')}</DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(item.id, item.location)}
                  className="text-destructive"
                >
                  {t('deleteAccess')}
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
          value={(table.getColumn('location')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('location')?.setFilterValue(e.target.value)}
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
                <IconBuilding className="w-4 h-4" />
                {selectedItem?.location}
              </DrawerTitle>
              <DrawerDescription>{t('drawer.description')}</DrawerDescription>
            </DrawerHeader>
            {selectedItem && (
              <div className="p-4 pb-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.accessType')}</p>
                    <div className="mt-1">{getAccessTypeBadge(selectedItem.accessType, t)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.status')}</p>
                    <div className="mt-1">{getStatusBadge(selectedItem.status, t)}</div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.accessZones')}</p>
                    <p className="text-sm mt-1">{selectedItem.accessZones}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.schedule')}</p>
                    <p className="text-sm mt-1">{selectedItem.accessSchedule}</p>
                  </div>
                  {selectedItem.badgeCardNumber && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.badgeCardNumber')}</p>
                      <p className="text-sm mt-1 font-mono">{selectedItem.badgeCardNumber}</p>
                    </div>
                  )}
                  {selectedItem.assignedTo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.assignedTo')}</p>
                      <p className="text-sm mt-1">{selectedItem.assignedTo}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.validFrom')}</p>
                    <p className="text-sm mt-1">{new Date(selectedItem.validFrom).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.validUntil')}</p>
                    <p className="text-sm mt-1">
                      {selectedItem.validTo ? new Date(selectedItem.validTo).toLocaleDateString() : t('drawer.noExpiry')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('drawer.escortRequired')}</p>
                    <p className="text-sm mt-1">{selectedItem.escortRequired ? t('drawer.yes') : t('drawer.no')}</p>
                  </div>
                  {selectedItem.authorizationLevel && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.authorizationLevel')}</p>
                      <p className="text-sm mt-1">{selectedItem.authorizationLevel}</p>
                    </div>
                  )}
                  {selectedItem.notes && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">{t('drawer.notes')}</p>
                      <p className="text-sm mt-1">{selectedItem.notes}</p>
                    </div>
                  )}
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
                  <Button variant="destructive" onClick={() => { setDrawerOpen(false); onDelete(selectedItem.id, selectedItem.location) }} className="flex-1">
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
