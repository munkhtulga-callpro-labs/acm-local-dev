"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLoader,
  IconPlus,
  IconX,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
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
import { toast } from "sonner"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

export const employeeSchema = z.object({
  id: z.string(),
  employeeId: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  position: z.string(),
  department: z.string(),
  company: z.string(),
  status: z.string(),
  isActive: z.boolean().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Employee = z.infer<typeof employeeSchema>

type TFunc = ReturnType<typeof useTranslations<'employees.table'>>

const getStatusBadge = (isActive: boolean | undefined, status: string, t: TFunc) => {
  const active = isActive !== undefined ? isActive : status?.toLowerCase() === 'active'

  if (active) {
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
  router: ReturnType<typeof useRouter>,
  onDelete: (id: string, name: string) => void,
  t: TFunc
): ColumnDef<Employee>[] => [
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    id: "name",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('employee')}
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
    cell: ({ row }) => {
      const fullName = `${row.original.firstName} ${row.original.lastName}`
      return (
        <div className="flex flex-col">
          <TableCellViewer item={row.original} fullName={fullName} router={router} onDelete={onDelete} />
          <span className="text-xs text-muted-foreground">{row.original.email}</span>
        </div>
      )
    },
    enableHiding: false,
    enableSorting: true,
  },
  {
    accessorKey: "position",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('position')}
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
      <div className="flex items-center">
        <Badge variant="outline" className="text-muted-foreground px-2 py-0.5 text-xs">
          {row.original.position?.toLowerCase() || 'N/A'}
        </Badge>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "department",
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
    size: 150,
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.department}
      </div>
    ),
    enableSorting: true,
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
    size: 150,
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.company}
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
    cell: ({ row }) => getStatusBadge(row.original.isActive, row.original.status, t),
    enableSorting: true,
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('startDate')}
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
      <div className="text-sm text-muted-foreground">
        {new Date(row.original.startDate).toISOString().slice(0, 10)}
      </div>
    ),
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
          <DropdownMenuItem onClick={() => router.push(`/employees/${row.original.id}`)}>
            {t('viewDetails')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/employees/${row.original.id}/edit`)}>
            {t('editEmployee')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => onDelete(row.original.id, `${row.original.firstName} ${row.original.lastName}`)}
          >
            {t('deleteEmployee')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function EmployeesDataTable({
  data: initialData,
  onAddEmployee,
}: {
  data: Employee[]
  onAddEmployee?: () => void
}) {
  const router = useRouter()
  const t = useTranslations('employees.table')
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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [employeeToDelete, setEmployeeToDelete] = React.useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const handleDeleteClick = React.useCallback((id: string, name: string) => {
    setEmployeeToDelete({ id, name })
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!employeeToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/employees/${employeeToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success(t('toast.deleted', { name: employeeToDelete.name }))
        setData((prevData) => prevData.filter((emp) => emp.id !== employeeToDelete.id))
        setDeleteDialogOpen(false)
        setEmployeeToDelete(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || t('toast.deleteFailed'))
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error(t('toast.deleteError'))
    } finally {
      setIsDeleting(false)
    }
  }, [employeeToDelete, t])

  const columns = React.useMemo(
    () => createColumns(router, handleDeleteClick, t),
    [router, handleDeleteClick, t]
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
          <Button variant="outline" size="sm" onClick={onAddEmployee}>
            <IconPlus />
            <span className="hidden lg:inline">{t('addEmployee')}</span>
          </Button>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich('deleteDialog.description', {
                name: employeeToDelete?.name ?? '',
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? t('deleteDialog.deleting') : t('deleteDialog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TableCellViewer({
  item,
  fullName,
  router,
  onDelete
}: {
  item: Employee
  fullName: string
  router: ReturnType<typeof useRouter>
  onDelete: (id: string, name: string) => void
}) {
  const t = useTranslations('employees.drawer')

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left text-sm h-auto">
          {fullName}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{fullName}</DrawerTitle>
          <DrawerDescription>
            {t('description')}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-2 leading-none font-medium">
              {t('email')}: {item.email}
            </div>
            <div className="text-muted-foreground">
              {t('position')}: {item.position}
            </div>
            <div className="text-muted-foreground">
              {t('department')}: {item.department}
            </div>
            <div className="text-muted-foreground">
              {t('company')}: {item.company}
            </div>
            <div className="text-muted-foreground">
              {t('status')}: {item.status}
            </div>
            <div className="text-muted-foreground">
              {t('startDate')}: {new Date(item.startDate).toISOString().slice(0, 10)}
            </div>
            {item.endDate && (
              <div className="text-muted-foreground">
                {t('endDate')}: {new Date(item.endDate).toISOString().slice(0, 10)}
              </div>
            )}
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={() => router.push(`/employees/${item.id}/edit`)}>
            {t('editEmployee')}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/employees/${item.id}`)}>
            {t('viewDetails')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onDelete(item.id, fullName)
            }}
          >
            {t('deleteEmployee')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">{t('close')}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
