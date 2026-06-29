"use client"

import * as React from "react"
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
  IconDatabase,
  IconServer,
  IconShield,
  IconDatabaseImport,
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
  DropdownMenuSeparator,
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

export const databaseResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  databaseType: z.string(),
  version: z.string().nullable().optional(),
  host: z.string(),
  port: z.number(),
  databaseName: z.string().nullable().optional(),
  schema: z.string().nullable().optional(),
  owner: z.string(),
  environment: z.string(),
  accessLevel: z.string(),
  isEncrypted: z.boolean(),
  backupEnabled: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
})

export type DatabaseResource = z.infer<typeof databaseResourceSchema>

type TFunc = ReturnType<typeof useTranslations<'databases.table'>>

const getEnvironmentBadge = (env: string, t: TFunc) => {
  const envLower = env.toLowerCase()
  switch (envLower) {
    case 'production':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400 mr-1 w-3 h-3" />
          {t('envProduction')}
        </Badge>
      )
    case 'staging':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-yellow-500 dark:fill-yellow-400 mr-1 w-3 h-3" />
          {t('envStaging')}
        </Badge>
      )
    case 'development':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-blue-500 dark:fill-blue-400 mr-1 w-3 h-3" />
          {t('envDevelopment')}
        </Badge>
      )
    case 'testing':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
          {t('envTesting')}
        </Badge>
      )
    default:
      return <Badge variant="outline" className="text-xs">{env}</Badge>
  }
}

const getStatusBadge = (isActive: boolean, t: TFunc) => {
  if (isActive) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
        {t('active')}
      </Badge>
    )
  } else {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconX className="mr-1 w-3 h-3 text-red-500" />
        {t('inactive')}
      </Badge>
    )
  }
}

const createColumns = (
  onView: (database: DatabaseResource) => void,
  onEdit: (database: DatabaseResource) => void,
  onDelete: (id: string, name: string) => void,
  t: TFunc
): ColumnDef<DatabaseResource>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('database')}
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
      <TableCellViewer item={row.original} onEdit={onEdit} onDelete={onDelete} />
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "databaseType",
    header: t('type'),
    size: 120,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <Badge variant="outline" className="text-muted-foreground px-2 py-0.5 text-xs w-fit">
          {row.original.databaseType}
        </Badge>
        {row.original.version && (
          <span className="text-xs text-muted-foreground mt-0.5">v{row.original.version}</span>
        )}
      </div>
    ),
  },
  {
    accessorFn: (row) => `${row.host}:${row.port}`,
    id: "hostPort",
    header: t('hostPort'),
    size: 200,
    cell: ({ row }) => (
      <div className="flex items-center text-sm text-muted-foreground">
        <IconServer className="mr-2 h-3 w-3" />
        {row.original.host}:{row.original.port}
      </div>
    ),
  },
  {
    accessorKey: "environment",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('environment')}
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
    size: 130,
    cell: ({ row }) => getEnvironmentBadge(row.original.environment, t),
    enableSorting: true,
  },
  {
    accessorKey: "accessLevel",
    header: t('accessLevel'),
    size: 110,
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs capitalize">
        {row.original.accessLevel}
      </Badge>
    ),
  },
  {
    id: "security",
    header: t('security'),
    size: 120,
    cell: ({ row }) => (
      <div className="flex gap-1 flex-wrap">
        {row.original.isEncrypted && (
          <Badge variant="outline" className="text-xs px-1.5">
            <IconShield className="mr-1 h-3 w-3 text-green-500" /> {t('encrypted')}
          </Badge>
        )}
        {row.original.backupEnabled && (
          <Badge variant="outline" className="text-xs px-1.5">
            <IconDatabaseImport className="mr-1 h-3 w-3" /> {t('backup')}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "owner",
    header: t('owner'),
    size: 150,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.owner}
      </div>
    ),
  },
  {
    accessorKey: "isActive",
    id: "status",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('status')}
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
    size: 100,
    cell: ({ row }) => getStatusBadge(row.original.isActive, t),
    enableSorting: true,
  },
  {
    id: "actions",
    size: 40,
    cell: ({ row }) => (
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
          <DropdownMenuItem onClick={() => onView(row.original)}>
            {t('viewDetails')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            {t('edit')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => onDelete(row.original.id, row.original.name)}
          >
            {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function DatabasesDataTable({
  data: initialData,
  onView,
  onEdit,
  onDelete,
  onAdd,
}: {
  data: DatabaseResource[]
  onView: (database: DatabaseResource) => void
  onEdit: (database: DatabaseResource) => void
  onDelete: (id: string, name: string) => void
  onAdd?: () => void
}) {
  const t = useTranslations('databases.table')
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "name",
      desc: false,
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

  const columns = React.useMemo(
    () => createColumns(onView, onEdit, onDelete, t),
    [onView, onEdit, onDelete, t]
  )

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
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder={t('searchPlaceholder')}
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {onAdd && (
            <Button variant="outline" size="sm" onClick={onAdd}>
              <IconDatabase className="mr-1 h-3 w-3" />
              <span className="hidden lg:inline">{t('addDatabase')}</span>
              <span className="lg:hidden">{t('add')}</span>
            </Button>
          )}
        </div>
      </div>

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

function TableCellViewer({
  item,
  onEdit,
  onDelete,
}: {
  item: DatabaseResource
  onEdit: (database: DatabaseResource) => void
  onDelete: (id: string, name: string) => void
}) {
  const t = useTranslations('databases.drawer')

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left text-sm h-auto">
          <div className="flex items-center gap-2">
            <IconDatabase className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col items-start">
              <span>{item.name}</span>
              {item.databaseName && (
                <span className="text-xs text-muted-foreground font-normal">
                  {item.databaseName}
                </span>
              )}
            </div>
          </div>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>
            {t('description')}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-2 leading-none font-medium">
              {t('database')}: {item.name}
            </div>
            <div className="text-muted-foreground">
              {t('type')}: {item.databaseType} {item.version && `(v${item.version})`}
            </div>
            <div className="text-muted-foreground">
              {t('host')}: {item.host}:{item.port}
            </div>
            {item.databaseName && (
              <div className="text-muted-foreground">
                {t('databaseName')}: {item.databaseName}
              </div>
            )}
            {item.schema && (
              <div className="text-muted-foreground">
                {t('schema')}: {item.schema}
              </div>
            )}
            <div className="text-muted-foreground">
              {t('environment')}: {item.environment}
            </div>
            <div className="text-muted-foreground">
              {t('accessLevel')}: {item.accessLevel}
            </div>
            <div className="text-muted-foreground">
              {t('owner')}: {item.owner}
            </div>
            <div className="text-muted-foreground">
              {t('encrypted')}: {item.isEncrypted ? t('yes') : t('no')}
            </div>
            <div className="text-muted-foreground">
              {t('backupEnabled')}: {item.backupEnabled ? t('yes') : t('no')}
            </div>
            <div className="text-muted-foreground">
              {t('status')}: {item.isActive ? t('active') : t('inactive')}
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={() => onEdit(item)}>
            {t('editDatabase')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDelete(item.id, item.name)}
          >
            {t('deleteDatabase')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">{t('close')}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
