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
  IconClock,
  IconAlertCircle,
  IconArrowRight,
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

export const approvalRequestSchema = z.object({
  id: z.string(),
  requestType: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  resourceName: z.string(),
  requesterId: z.string(),
  requesterName: z.string(),
  requesterEmail: z.string(),
  requesterDepartment: z.string().nullable(),
  accessLevel: z.string(),
  businessJustification: z.string(),
  accessRequestTicketId: z.string().nullable(),
  requestedAt: z.string(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'IN_REVIEW']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  currentApproverId: z.string().nullable(),
  approvals: z.array(z.object({
    id: z.string(),
    approverId: z.string(),
    approverName: z.string(),
    approverEmail: z.string(),
    approverRole: z.string().nullable(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
    comments: z.string().nullable(),
    decidedAt: z.string().nullable(),
  })),
})

export type ApprovalRequest = z.infer<typeof approvalRequestSchema>

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconClock className="mr-1 w-3 h-3 text-yellow-500" />
          Pending
        </Badge>
      )
    case 'APPROVED':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
          Approved
        </Badge>
      )
    case 'REJECTED':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconX className="mr-1 w-3 h-3 text-red-500" />
          Rejected
        </Badge>
      )
    case 'IN_REVIEW':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconAlertCircle className="mr-1 w-3 h-3 text-blue-500" />
          In Review
        </Badge>
      )
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconArrowUp className="mr-1 w-3 h-3 text-red-500" />
          Urgent
        </Badge>
      )
    case 'HIGH':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconArrowUp className="mr-1 w-3 h-3 text-orange-500" />
          High
        </Badge>
      )
    case 'MEDIUM':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconArrowRight className="mr-1 w-3 h-3 text-blue-500" />
          Medium
        </Badge>
      )
    case 'LOW':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconArrowDown className="mr-1 w-3 h-3" />
          Low
        </Badge>
      )
    default:
      return <Badge variant="outline" className="text-xs">{priority}</Badge>
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const createColumns = (onReview: (request: ApprovalRequest) => void): ColumnDef<ApprovalRequest>[] => [
  {
    accessorKey: "requesterName",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Requester
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
      <TableCellViewer item={row.original} onReview={onReview} />
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "resourceName",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Resource
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
      <div className="text-sm font-medium">
        {row.original.resourceName}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "resourceType",
    header: "Type",
    size: 130,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-2 py-0.5 text-xs">
        {row.original.resourceType.replace(/_/g, ' ').toLowerCase()}
      </Badge>
    ),
  },
  {
    accessorKey: "accessLevel",
    header: "Access Level",
    size: 120,
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs">
        {row.original.accessLevel}
      </Badge>
    ),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
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
    cell: ({ row }) => getPriorityBadge(row.original.priority),
    enableSorting: true,
  },
  {
    accessorKey: "requestedAt",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Requested
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
      <div className="text-sm text-muted-foreground">
        {formatDate(row.original.requestedAt)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "status",
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
    cell: ({ row }) => getStatusBadge(row.original.status),
    enableSorting: true,
  },
  {
    id: "actions",
    size: 80,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.status === 'PENDING' ? (
          <Button
            size="sm"
            onClick={() => onReview(row.original)}
            className="h-7 text-xs"
          >
            Review
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReview(row.original)}
            className="h-7 text-xs"
          >
            View
          </Button>
        )}
      </div>
    ),
  },
]

export function ApprovalsDataTable({
  data: initialData,
  onReview,
}: {
  data: ApprovalRequest[]
  onReview: (request: ApprovalRequest) => void
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
      id: "requestedAt",
      desc: true, // Most recent first
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

  const columns = React.useMemo(() => createColumns(onReview), [onReview])

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
            placeholder="Search requests..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />
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
  onReview,
}: {
  item: ApprovalRequest
  onReview: (request: ApprovalRequest) => void
}) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left text-sm h-auto">
          {item.requesterName}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Access Request Details</DrawerTitle>
          <DrawerDescription>
            Review resource access request information
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-2 leading-none font-medium">
              Requester: {item.requesterName}
            </div>
            <div className="text-muted-foreground">
              Email: {item.requesterEmail}
            </div>
            {item.requesterDepartment && (
              <div className="text-muted-foreground">
                Department: {item.requesterDepartment}
              </div>
            )}
            <div className="text-muted-foreground">
              Resource: {item.resourceName}
            </div>
            <div className="text-muted-foreground">
              Resource Type: {item.resourceType}
            </div>
            <div className="text-muted-foreground">
              Access Level: {item.accessLevel}
            </div>
            <div className="text-muted-foreground">
              Priority: {item.priority}
            </div>
            <div className="text-muted-foreground">
              Status: {item.status}
            </div>
            <div className="text-muted-foreground">
              Requested At: {formatDate(item.requestedAt)}
            </div>
            {item.businessJustification && (
              <div className="text-muted-foreground">
                <div className="font-medium mb-1">Business Justification:</div>
                <p className="text-xs bg-muted p-2 rounded">
                  {item.businessJustification}
                </p>
              </div>
            )}
          </div>
        </div>
        <DrawerFooter>
          {item.status === 'PENDING' && (
            <Button onClick={() => onReview(item)}>
              Review Request
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
