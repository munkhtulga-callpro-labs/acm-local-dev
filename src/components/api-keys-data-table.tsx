'use client'

import * as React from 'react'
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
  IconKey,
  IconShieldLock,
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

export type APIKeyResource = {
  id: string
  serviceName: string
  keyType: string
  scopePermissions: string
  rateLimit?: string | null
  expiryDate?: string | null
  assignedTo?: string | null
  status: string
  notes?: string | null
  ipRestrictions?: string | null
  webhookUrls?: string | null
  createdDate: string
}

interface APIKeysDataTableProps {
  data: APIKeyResource[]
  onEdit?: (apiKey: APIKeyResource) => void
  onDelete?: (id: string, name: string) => void
}

const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
          Active
        </Badge>
      )
    case 'REVOKED':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleFilled className="fill-red-500 dark:fill-red-400 mr-1 w-3 h-3" />
          Revoked
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

const getKeyTypeBadge = (keyType: string) => {
  switch (keyType.toLowerCase()) {
    case 'production':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-red-500" />
          Production
        </Badge>
      )
    case 'sandbox':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-yellow-500" />
          Sandbox
        </Badge>
      )
    case 'development':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-blue-500" />
          Development
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          {keyType}
        </Badge>
      )
  }
}

export function APIKeysDataTable({ data, onEdit, onDelete }: APIKeysDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedKey, setSelectedKey] = React.useState<APIKeyResource | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const columns: ColumnDef<APIKeyResource>[] = [
    {
      accessorKey: 'serviceName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="px-0 hover:bg-transparent"
        >
          Service Name
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconKey className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="font-medium">{row.getValue('serviceName')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'keyType',
      header: 'Key Type',
      cell: ({ row }) => getKeyTypeBadge(row.getValue('keyType')),
    },
    {
      accessorKey: 'scopePermissions',
      header: 'Scope',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {row.getValue('scopePermissions')}
        </span>
      ),
    },
    {
      accessorKey: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => {
        const val = row.getValue('assignedTo') as string | null
        return val
          ? <span className="text-sm">{val}</span>
          : <span className="text-sm text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: 'expiryDate',
      header: 'Expires',
      cell: ({ row }) => {
        const val = row.getValue('expiryDate') as string | null
        if (!val) return <span className="text-sm text-muted-foreground">Never</span>
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const apiKey = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { setSelectedKey(apiKey); setDrawerOpen(true) }}>
                View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(apiKey)}>Edit key</DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(apiKey.id, apiKey.serviceName)}
                  className="text-destructive"
                >
                  Delete key
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
          placeholder="Search by service name..."
          value={(table.getColumn('serviceName')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('serviceName')?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} key(s) total
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <IconKey className="w-4 h-4" />
                {selectedKey?.serviceName}
              </DrawerTitle>
              <DrawerDescription>API key details</DrawerDescription>
            </DrawerHeader>
            {selectedKey && (
              <div className="p-4 pb-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Key Type</p>
                    <div className="mt-1">{getKeyTypeBadge(selectedKey.keyType)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedKey.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Scope / Permissions</p>
                    <p className="text-sm mt-1">{selectedKey.scopePermissions}</p>
                  </div>
                  {selectedKey.assignedTo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                      <p className="text-sm mt-1">{selectedKey.assignedTo}</p>
                    </div>
                  )}
                  {selectedKey.rateLimit && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rate Limit</p>
                      <p className="text-sm mt-1">{selectedKey.rateLimit}</p>
                    </div>
                  )}
                  {selectedKey.expiryDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                      <p className="text-sm mt-1">{new Date(selectedKey.expiryDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedKey.ipRestrictions && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">IP Restrictions</p>
                      <p className="text-sm mt-1 font-mono">{selectedKey.ipRestrictions}</p>
                    </div>
                  )}
                  {selectedKey.webhookUrls && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Webhook URLs</p>
                      <p className="text-sm mt-1">{selectedKey.webhookUrls}</p>
                    </div>
                  )}
                  {selectedKey.notes && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="text-sm mt-1">{selectedKey.notes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm mt-1">{new Date(selectedKey.createdDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
            <DrawerFooter>
              <div className="flex gap-2 w-full">
                {onEdit && selectedKey && (
                  <Button variant="outline" onClick={() => { setDrawerOpen(false); onEdit(selectedKey) }} className="flex-1">
                    Edit
                  </Button>
                )}
                {onDelete && selectedKey && (
                  <Button variant="destructive" onClick={() => { setDrawerOpen(false); onDelete(selectedKey.id, selectedKey.serviceName) }} className="flex-1">
                    Delete
                  </Button>
                )}
              </div>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
