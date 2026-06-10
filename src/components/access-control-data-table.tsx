"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLoader,
  IconPlus,
  IconArrowUp,
  IconArrowDown,
  IconArrowRight,
  IconX,
  IconClock,
  IconLock,
  IconLockOpen,
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
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  DropdownMenuCheckboxItem,
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
import { DataTableToolbar } from "@/components/DataTableToolbar"

export const accessAssignmentSchema = z.object({
  id: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  resourceName: z.string(),
  assigneeId: z.string(),
  assigneeName: z.string(),
  assigneeEmail: z.string(),
  assigneeDepartment: z.string().nullable(),
  accessLevel: z.string(),
  grantedBy: z.string(),
  grantedAt: z.string(),
  validFrom: z.string(),
  validTo: z.string().nullable(),
  status: z.string(),
  isActive: z.boolean(),
})

export type AccessAssignment = z.infer<typeof accessAssignmentSchema>

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-6 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const getStatusBadge = (status: string, validTo: string | null) => {
  // Check if expired
  if (validTo && new Date(validTo) < new Date()) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconClock className="mr-1 w-3 h-3 text-orange-500" />
        Expired
      </Badge>
    )
  }

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
          <IconX className="mr-1 w-3 h-3 text-red-500" />
          Revoked
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          {status}
        </Badge>
      )
  }
}

const getResourceTypeBadge = (resourceType: string) => {
  const formatted = resourceType.replace(/_/g, ' ').toLowerCase()
  return (
    <Badge variant="outline" className="text-muted-foreground px-2 py-0.5 text-xs">
      {formatted}
    </Badge>
  )
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'No expiry'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const columns: ColumnDef<AccessAssignment>[] = [
  {
    id: "drag",
    header: () => null,
    size: 40,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "assigneeName",
    header: "User",
    size: 200,
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "resourceName",
    header: "Resource",
    size: 150,
    cell: ({ row }) => (
      <div className="text-sm font-medium">
        {row.original.resourceName}
      </div>
    ),
  },
  {
    accessorKey: "resourceType",
    header: "Type",
    size: 120,
    cell: ({ row }) => getResourceTypeBadge(row.original.resourceType),
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
    accessorKey: "status",
    header: "Status",
    size: 100,
    cell: ({ row }) => getStatusBadge(row.original.status, row.original.validTo),
  },
  {
    accessorKey: "grantedBy",
    header: "Granted By",
    size: 120,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.grantedBy}
      </div>
    ),
  },
  {
    accessorKey: "validTo",
    header: "Expires",
    size: 120,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.original.validTo)}
      </div>
    ),
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
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Edit Permission</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Revoke Access</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<AccessAssignment> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 h-10"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
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
  )
}

export function AccessControlDataTable({
  data: initialData,
}: {
  data: AccessAssignment[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [searchValue, setSearchValue] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("ALL")
  const [systemFilter, setSystemFilter] = React.useState("ALL")
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Standardized Toolbar */}
      <DataTableToolbar
        searchPlaceholder="Search permissions..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filter1Options={[
          { value: "ALL", label: "All Status" },
          { value: "ACTIVE", label: "Active" },
          { value: "EXPIRED", label: "Expired" },
          { value: "REVOKED", label: "Revoked" },
          { value: "PENDING", label: "Pending" },
        ]}
        filter1Value={statusFilter}
        onFilter1Change={setStatusFilter}
        filter1Placeholder="All Status"
        filter2Options={[
          { value: "ALL", label: "All Systems" },
          { value: "Google Workspace", label: "Google Workspace" },
          { value: "Monday.com", label: "Monday.com" },
          { value: "GitHub", label: "GitHub" },
          { value: "Slack", label: "Slack" },
          { value: "Jira", label: "Jira" },
        ]}
        filter2Value={systemFilter}
        onFilter2Change={setSystemFilter}
        filter2Placeholder="All Systems"
        primaryAction={{
          label: "Grant Access",
          onClick: () => console.log("Grant access clicked")
        }}
      />

      {/* Table with proper alignment */}
      <div className="rounded-md border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
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
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
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
        </DndContext>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
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
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TableCellViewer({ item }: { item: AccessAssignment }) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left text-sm h-auto">
          {item.assigneeName}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.assigneeName}</DrawerTitle>
          <DrawerDescription>
            Resource access assignment details
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-2 leading-none font-medium">
              Email: {item.assigneeEmail}
            </div>
            <div className="text-muted-foreground">
              Resource: {item.resourceName}
            </div>
            <div className="text-muted-foreground">
              Resource Type: {item.resourceType}
            </div>
            <div className="text-muted-foreground">
              Access Level: {item.accessLevel}
            </div>
            {item.assigneeDepartment && (
              <div className="text-muted-foreground">
                Department: {item.assigneeDepartment}
              </div>
            )}
            <div className="text-muted-foreground">
              Status: {item.status}
            </div>
            <div className="text-muted-foreground">
              Granted By: {item.grantedBy}
            </div>
            <div className="text-muted-foreground">
              Granted At: {new Date(item.grantedAt).toISOString().slice(0, 19).replace('T', ' ')}
            </div>
            {item.validTo && (
              <div className="text-muted-foreground">
                Expires At: {new Date(item.validTo).toISOString().slice(0, 19).replace('T', ' ')}
              </div>
            )}
          </div>
        </div>
        <DrawerFooter>
          <Button variant="outline">Revoke Access</Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
