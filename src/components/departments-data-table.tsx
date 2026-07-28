"use client"

import * as React from "react"
import {
  IconChevronDown,
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
  IconUsers,
  IconBuilding,
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
import { useTranslations } from "next-intl"
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

export const departmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  manager: z.string().nullable(),
  company: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  employeeCount: z.number(),
})

export type Department = z.infer<typeof departmentSchema>

type TFunc = ReturnType<typeof useTranslations<'departments.table'>>

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
  onEdit: (department: Department) => void,
  onDelete: (id: string, name: string) => void,
  onManageAccess: (department: Department) => void,
  t: TFunc
): ColumnDef<Department>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('department')}
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
    size: 250,
    cell: ({ row }) => (
      <TableCellViewer item={row.original} onEdit={onEdit} onDelete={onDelete} />
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "company",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('company')}
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
      <div className="flex items-center text-sm">
        <IconBuilding className="mr-2 h-3 w-3 text-muted-foreground" />
        {row.original.company}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "manager",
    header: t('manager'),
    size: 150,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.manager || t('notAssigned')}
      </div>
    ),
  },
  {
    accessorKey: "employeeCount",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('employees')}
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
    size: 120,
    cell: ({ row }) => (
      <div className="flex items-center text-sm">
        <IconUsers className="mr-2 h-3 w-3 text-muted-foreground" />
        {row.original.employeeCount}
      </div>
    ),
    enableSorting: true,
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
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            {t('edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onManageAccess(row.original)}>
            {t('accessTemplates')}
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

export function DepartmentsDataTable({
  data: initialData,
  onEdit,
  onDelete,
  onManageAccess,
  onAdd,
}: {
  data: Department[]
  onEdit: (department: Department) => void
  onDelete: (id: string, name: string) => void
  onManageAccess: (department: Department) => void
  onAdd?: () => void
}) {
  const t = useTranslations('departments.table')
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
    () => createColumns(onEdit, onDelete, onManageAccess, t),
    [onEdit, onDelete, onManageAccess, t]
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
            placeholder={t('searchPlaceholder')}
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
              <IconBuilding className="mr-1 h-3 w-3" />
              <span className="hidden lg:inline">{t('addDepartment')}</span>
              <span className="lg:hidden">{t('add')}</span>
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

function TableCellViewer({
  item,
  onEdit,
  onDelete,
}: {
  item: Department
  onEdit: (department: Department) => void
  onDelete: (id: string, name: string) => void
}) {
  const t = useTranslations('departments.drawer')

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left text-sm h-auto">
          <div className="flex flex-col items-start">
            <span>{item.name}</span>
            {item.description && (
              <span className="text-xs text-muted-foreground font-normal">
                {item.description}
              </span>
            )}
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
              {t('department')}: {item.name}
            </div>
            {item.description && (
              <div className="text-muted-foreground">
                {t('descriptionLabel')}: {item.description}
              </div>
            )}
            <div className="text-muted-foreground">
              {t('company')}: {item.company}
            </div>
            <div className="text-muted-foreground">
              {t('manager')}: {item.manager || t('notAssigned')}
            </div>
            <div className="text-muted-foreground">
              {t('employees')}: {item.employeeCount}
            </div>
            <div className="text-muted-foreground">
              {t('status')}: {item.isActive ? t('active') : t('inactive')}
            </div>
            <div className="text-muted-foreground">
              {t('created')}: {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={() => onEdit(item)}>
            {t('editDepartment')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDelete(item.id, item.name)}
          >
            {t('deleteDepartment')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">{t('close')}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
