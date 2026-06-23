"use client"

import * as React from "react"
import { format as formatDateFns } from 'date-fns'
import { useTranslations } from "next-intl"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconCircleCheckFilled,
  IconX,
  IconClock,
  IconUser,
  IconActivity,
  IconAlertTriangle,
  IconDownload,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"
import * as XLSX from "xlsx"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const auditLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  details: z.any().optional(),
  oldValues: z.any().optional(),
  newValues: z.any().optional(),
  userId: z.string(),
  user: z.object({
    name: z.string(),
    email: z.string(),
  }),
  createdAt: z.string(),
})

export type AuditLog = z.infer<typeof auditLogSchema>

const getActionIcon = (action: string) => {
  if (action.includes('LOGIN') || action.includes('SIGNIN')) {
    return <IconUser className="w-3 h-3 mr-1 text-blue-500" />
  } else if (action.includes('APPROVE')) {
    return <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 w-3 h-3 mr-1" />
  } else if (action.includes('REJECT')) {
    return <IconX className="w-3 h-3 mr-1 text-red-500" />
  } else if (action.includes('CREATE') || action.includes('GRANT')) {
    return <IconCircleCheckFilled className="fill-blue-500 dark:fill-blue-400 w-3 h-3 mr-1" />
  } else if (action.includes('DELETE') || action.includes('REVOKE')) {
    return <IconX className="w-3 h-3 mr-1 text-red-500" />
  } else if (action.includes('UPDATE') || action.includes('MODIFY')) {
    return <IconActivity className="w-3 h-3 mr-1 text-yellow-500" />
  }
  return <IconAlertTriangle className="w-3 h-3 mr-1" />
}

const getActionBadge = (action: string) => {
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
      {getActionIcon(action)}
      {action.replace(/_/g, ' ')}
    </Badge>
  )
}

const formatDate = (dateString: string) => formatDateFns(new Date(dateString), 'yyyy-MM-dd HH:mm:ss')

const formatAuditDetails = (log: AuditLog): string => {
  const { action, oldValues, newValues, entityType } = log

  // Handle CREATE actions
  if (action.includes('CREATE') || action.includes('GRANT')) {
    if (newValues && typeof newValues === 'object') {
      const items: string[] = []
      if (newValues.name) items.push(`Name: ${newValues.name}`)
      if (newValues.email) items.push(`Email: ${newValues.email}`)
      if (newValues.host) items.push(`Host: ${newValues.host}`)
      if (newValues.serviceName) items.push(`Service: ${newValues.serviceName}`)
      if (newValues.owner) items.push(`Owner: ${newValues.owner}`)
      if (items.length > 0) return items.join(', ')
    }
    return `Created new ${entityType.replace('Resource', '')}`
  }

  // Handle DELETE actions
  if (action.includes('DELETE') || action.includes('REVOKE')) {
    if (oldValues && typeof oldValues === 'object') {
      const items: string[] = []
      if (oldValues.name) items.push(`Name: ${oldValues.name}`)
      if (oldValues.email) items.push(`Email: ${oldValues.email}`)
      if (oldValues.host) items.push(`Host: ${oldValues.host}`)
      if (oldValues.serviceName) items.push(`Service: ${oldValues.serviceName}`)
      if (items.length > 0) return `Deleted: ${items.join(', ')}`
    }
    return `Deleted ${entityType.replace('Resource', '')}`
  }

  // Handle UPDATE actions
  if (action.includes('UPDATE') || action.includes('MODIFY')) {
    if (oldValues && newValues && typeof oldValues === 'object' && typeof newValues === 'object') {
      const changes: string[] = []

      // Compare all fields to find what changed
      const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)])
      allKeys.forEach(key => {
        const oldVal = oldValues[key]
        const newVal = newValues[key]

        if (oldVal !== newVal && newVal !== undefined) {
          const displayKey = key.replace(/([A-Z])/g, ' $1').trim()
          changes.push(`${displayKey}: ${oldVal} → ${newVal}`)
        }
      })

      if (changes.length > 0) {
        return changes.slice(0, 2).join(', ') + (changes.length > 2 ? ` (+${changes.length - 2} more)` : '')
      }
    }
    return `Updated ${entityType.replace('Resource', '')}`
  }

  // Handle APPROVE/REJECT actions
  if (action.includes('APPROVE') || action.includes('REJECT')) {
    if (newValues && typeof newValues === 'object') {
      const items: string[] = []
      if (newValues.resourceName) items.push(`Resource: ${newValues.resourceName}`)
      if (newValues.requesterName) items.push(`Requester: ${newValues.requesterName}`)
      if (items.length > 0) return items.join(', ')
    }
    return `${action.includes('APPROVE') ? 'Approved' : 'Rejected'} request`
  }

  // Default fallback
  return 'No details available'
}

const exportAuditLogs = (logs: AuditLog[], format: 'csv' | 'xlsx') => {
  const rows = logs.map((log) => ({
    Timestamp: formatDate(log.createdAt),
    Action: log.action,
    User: log.user?.name || 'System',
    'User Email': log.user?.email || '',
    'Entity Type': log.entityType,
    'Entity ID': log.entityId,
    Details: formatAuditDetails(log),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs')

  const timestamp = formatDateFns(new Date(), 'yyyy-MM-dd-HH-mm-ss')
  XLSX.writeFile(workbook, `audit-logs-${timestamp}.${format}`, format === 'csv' ? { bookType: 'csv' } : undefined)
}

type TFunc = ReturnType<typeof useTranslations<'auditLogs.table'>>

const createColumns = (t: TFunc): ColumnDef<AuditLog>[] => [
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('timestamp')}
          {column.getIsSorted() === "asc" ? (
            <IconArrowUp className="h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <IconArrowDown className="h-3 w-3" />
          ) : (
            <IconArrowsSort className="h-3 w-3" />
          )}
        </button>
      )
    },
    size: 180,
    cell: ({ row }) => (
      <div className="flex items-center text-sm text-muted-foreground">
        <IconClock className="mr-2 h-3 w-3" />
        {formatDate(row.original.createdAt)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "action",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('action')}
          {column.getIsSorted() === "asc" ? (
            <IconArrowUp className="h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <IconArrowDown className="h-3 w-3" />
          ) : (
            <IconArrowsSort className="h-3 w-3" />
          )}
        </button>
      )
    },
    size: 200,
    cell: ({ row }) => getActionBadge(row.original.action),
    enableSorting: true,
  },
  {
    accessorFn: (row) => row.user?.name || 'System',
    id: "user",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('user')}
          {column.getIsSorted() === "asc" ? (
            <IconArrowUp className="h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <IconArrowDown className="h-3 w-3" />
          ) : (
            <IconArrowsSort className="h-3 w-3" />
          )}
        </button>
      )
    },
    size: 220,
    cell: ({ row }) => (
      <TableCellViewer item={row.original} />
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "entityType",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('entityType')}
          {column.getIsSorted() === "asc" ? (
            <IconArrowUp className="h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <IconArrowDown className="h-3 w-3" />
          ) : (
            <IconArrowsSort className="h-3 w-3" />
          )}
        </button>
      )
    },
    size: 150,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-2 py-0.5 text-xs">
        {row.original.entityType}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "details",
    header: t('details'),
    size: 300,
    cell: ({ row }) => (
      <div className="max-w-md text-sm text-muted-foreground truncate" title={formatAuditDetails(row.original)}>
        {formatAuditDetails(row.original)}
      </div>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    size: 40,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-6"
            size="icon"
          >
            <IconDotsVertical className="size-3" />
            <span className="sr-only">{t('openMenu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>{t('viewDetails')}</DropdownMenuItem>
          <DropdownMenuItem>{t('exportLog')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function AuditLogsDataTable({
  data: initialData,
}: {
  data: AuditLog[]
}) {
  const t = useTranslations('auditLogs.table')
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "createdAt",
      desc: true,
    }
  ])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  })

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const columns = React.useMemo(() => createColumns(t), [t])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: "includesString",
  })

  return (
    <div className="w-full space-y-4">
      {/* Header with search and buttons */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder={t('searchPlaceholder')}
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export current filtered view */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={table.getFilteredRowModel().rows.length === 0}
            >
              <IconDownload className="mr-2 h-4 w-4" />
              {t('export')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                exportAuditLogs(table.getSortedRowModel().rows.map((r) => r.original), 'csv')
              }
            >
              {t('exportCsv')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                exportAuditLogs(table.getSortedRowModel().rows.map((r) => r.original), 'xlsx')
              }
            >
              {t('exportExcel')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table with proper alignment */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="h-10 px-4 text-left align-middle font-medium text-muted-foreground"
                      style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-10"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-2 align-middle"
                      style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t('noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {t('rowsSelected', {
            selected: table.getFilteredSelectedRowModel().rows.length,
            total: table.getFilteredRowModel().rows.length,
          })}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              {t('rowsPerPage')}
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm font-medium">
            {t('pageOf', {
              current: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{t('goToFirstPage')}</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{t('goToPreviousPage')}</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{t('goToNextPage')}</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{t('goToLastPage')}</span>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TableCellViewer({ item }: { item: AuditLog }) {
  const t = useTranslations('auditLogs.drawer')

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left text-sm h-auto">
          {item.user?.name || 'System'}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{t('title')}</DrawerTitle>
          <DrawerDescription>
            {t('description')}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-2 leading-none font-medium">
              {t('user')}: {item.user?.name || 'System'}
            </div>
            {item.user?.email && (
              <div className="text-muted-foreground">
                {t('email')}: {item.user.email}
              </div>
            )}
            <div className="text-muted-foreground">
              {t('action')}: {item.action}
            </div>
            <div className="text-muted-foreground">
              {t('entityType')}: {item.entityType}
            </div>
            <div className="text-muted-foreground">
              {t('entityId')}: {item.entityId}
            </div>
            <div className="text-muted-foreground">
              {t('timestamp')}: {formatDate(item.createdAt)}
            </div>
            {item.details && (
              <div className="text-muted-foreground">
                <div className="font-medium mb-1">{t('details')}:</div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-60">
                  {typeof item.details === 'object'
                    ? JSON.stringify(item.details, null, 2)
                    : item.details
                  }
                </pre>
              </div>
            )}
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">{t('close')}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
