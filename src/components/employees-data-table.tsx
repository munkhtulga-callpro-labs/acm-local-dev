"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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

const getStatusBadge = (isActive: boolean | undefined, status: string) => {
  // Use isActive if available, otherwise fall back to status string
  const active = isActive !== undefined ? isActive : status?.toLowerCase() === 'active'

  if (active) {
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
  router: ReturnType<typeof useRouter>,
  onDelete: (id: string, name: string) => void
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
          Employee
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
          Position
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
          Department
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
          Company
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
    cell: ({ row }) => getStatusBadge(row.original.isActive, row.original.status),
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
          Start Date
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
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={() => router.push(`/employees/${row.original.id}`)}>
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/employees/${row.original.id}/edit`)}>
            Edit Employee
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => onDelete(row.original.id, `${row.original.firstName} ${row.original.lastName}`)}
          >
            Delete Employee
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
      desc: false, // false = ascending (A-Z)
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

  // Sync internal data state with parent data changes
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
        toast.success(`${employeeToDelete.name} has been deleted successfully`)
        setData((prevData) => prevData.filter((emp) => emp.id !== employeeToDelete.id))
        setDeleteDialogOpen(false)
        setEmployeeToDelete(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete employee')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('An error occurred while deleting the employee')
    } finally {
      setIsDeleting(false)
    }
  }, [employeeToDelete])

  const columns = React.useMemo(
    () => createColumns(router, handleDeleteClick),
    [router, handleDeleteClick]
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
            placeholder="Search employees..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAddEmployee}>
            <IconPlus />
            <span className="hidden lg:inline">Add Employee</span>
          </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{employeeToDelete?.name}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
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
            Employee details and management
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-2 leading-none font-medium">
              Email: {item.email}
            </div>
            <div className="text-muted-foreground">
              Position: {item.position}
            </div>
            <div className="text-muted-foreground">
              Department: {item.department}
            </div>
            <div className="text-muted-foreground">
              Company: {item.company}
            </div>
            <div className="text-muted-foreground">
              Status: {item.status}
            </div>
            <div className="text-muted-foreground">
              Start Date: {new Date(item.startDate).toISOString().slice(0, 10)}
            </div>
            {item.endDate && (
              <div className="text-muted-foreground">
                End Date: {new Date(item.endDate).toISOString().slice(0, 10)}
              </div>
            )}
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={() => router.push(`/employees/${item.id}/edit`)}>
            Edit Employee
          </Button>
          <Button variant="outline" onClick={() => router.push(`/employees/${item.id}`)}>
            View Details
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onDelete(item.id, fullName)
            }}
          >
            Delete Employee
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
