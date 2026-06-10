"use client"

import * as React from "react"
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

const getEnvironmentBadge = (env: string) => {
  const envLower = env.toLowerCase()
  switch (envLower) {
    case 'production':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400 mr-1 w-3 h-3" />
          Production
        </Badge>
      )
    case 'staging':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-yellow-500 dark:fill-yellow-400 mr-1 w-3 h-3" />
          Staging
        </Badge>
      )
    case 'development':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-blue-500 dark:fill-blue-400 mr-1 w-3 h-3" />
          Development
        </Badge>
      )
    case 'testing':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
          Testing
        </Badge>
      )
    default:
      return <Badge variant="outline" className="text-xs">{env}</Badge>
  }
}

const getStatusBadge = (isActive: boolean) => {
  if (isActive) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
        Active
      </Badge>
    )
  } else {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconX className="mr-1 w-3 h-3 text-red-500" />
        Inactive
      </Badge>
    )
  }
}

const createColumns = (
  onView: (database: DatabaseResource) => void,
  onEdit: (database: DatabaseResource) => void,
  onDelete: (id: string, name: string) => void
): ColumnDef<DatabaseResource>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Database
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
      <TableCellViewer item={row.original} onView={onView} onEdit={onEdit} onDelete={onDelete} />
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "databaseType",
    header: "Type",
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
    header: "Host:Port",
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
          Environment
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
    cell: ({ row }) => getEnvironmentBadge(row.original.environment),
    enableSorting: true,
  },
  {
    accessorKey: "accessLevel",
    header: "Access Level",
    size: 110,
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs capitalize">
        {row.original.accessLevel}
      </Badge>
    ),
  },
  {
    id: "security",
    header: "Security",
    size: 120,
    cell: ({ row }) => (
      <div className="flex gap-1 flex-wrap">
        {row.original.isEncrypted && (
          <Badge variant="outline" className="text-xs px-1.5">
            <IconShield className="mr-1 h-3 w-3 text-green-500" /> Encrypted
          </Badge>
        )}
        {row.original.backupEnabled && (
          <Badge variant="outline" className="text-xs px-1.5">
            <IconDatabaseImport className="mr-1 h-3 w-3" /> Backup
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
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
          Status
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
    cell: ({ row }) => getStatusBadge(row.original.isActive),
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
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={() => onView(row.original)}>
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => onDelete(row.original.id, row.original.name)}
          >
            Delete
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
      desc: false, // A-Z
    }
  ])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  })

  // Sync internal data state with parent data changes
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const columns = React.useMemo(
    () => createColumns(onView, onEdit, onDelete),
    [onView, onEdit, onDelete]
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
      {/* Header with search and buttons */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search databases..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onAdd && (
            <Button variant="outline" size="sm" onClick={onAdd}>
              <IconDatabase className="mr-1 h-3 w-3" />
              <span className="hidden lg:inline">Add Database</span>
              <span className="lg:hidden">Add</span>
            </Button>
          )}
        </div>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
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
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
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
  onView,
  onEdit,
  onDelete,
}: {
  item: DatabaseResource
  onView: (database: DatabaseResource) => void
  onEdit: (database: DatabaseResource) => void
  onDelete: (id: string, name: string) => void
}) {
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
            Database resource details
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-2 leading-none font-medium">
              Database: {item.name}
            </div>
            <div className="text-muted-foreground">
              Type: {item.databaseType} {item.version && `(v${item.version})`}
            </div>
            <div className="text-muted-foreground">
              Host: {item.host}:{item.port}
            </div>
            {item.databaseName && (
              <div className="text-muted-foreground">
                Database Name: {item.databaseName}
              </div>
            )}
            {item.schema && (
              <div className="text-muted-foreground">
                Schema: {item.schema}
              </div>
            )}
            <div className="text-muted-foreground">
              Environment: {item.environment}
            </div>
            <div className="text-muted-foreground">
              Access Level: {item.accessLevel}
            </div>
            <div className="text-muted-foreground">
              Owner: {item.owner}
            </div>
            <div className="text-muted-foreground">
              Encrypted: {item.isEncrypted ? 'Yes' : 'No'}
            </div>
            <div className="text-muted-foreground">
              Backup Enabled: {item.backupEnabled ? 'Yes' : 'No'}
            </div>
            <div className="text-muted-foreground">
              Status: {item.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={() => onEdit(item)}>
            Edit Database
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDelete(item.id, item.name)}
          >
            Delete Database
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
