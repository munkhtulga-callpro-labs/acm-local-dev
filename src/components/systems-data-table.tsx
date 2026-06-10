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
  IconTool,
  IconBolt,
  IconSettings,
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

export const systemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  hasApi: z.boolean(),
  apiEndpoint: z.string().optional(),
  requiresManual: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type System = z.infer<typeof systemSchema>

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

const getStatusBadge = (isActive: boolean) => {
  if (isActive) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
        active
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
      <IconX className="mr-1 w-3 h-3 text-red-500" />
      inactive
    </Badge>
  )
}

const getAutomationBadge = (hasApi: boolean, requiresManual: boolean) => {
  if (hasApi) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconBolt className="mr-1 w-3 h-3" />
        automated
      </Badge>
    )
  } else if (requiresManual) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconTool className="mr-1 w-3 h-3" />
        manual
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
      <IconSettings className="mr-1 w-3 h-3" />
      unknown
    </Badge>
  )
}

const columns: ColumnDef<System>[] = [
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
    accessorKey: "name",
    header: "System",
    size: 200,
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "category",
    header: "Category",
    size: 120,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        {row.original.category.toLowerCase()}
      </Badge>
    ),
  },
  {
    accessorKey: "automation",
    header: "Automation",
    size: 120,
    cell: ({ row }) => getAutomationBadge(row.original.hasApi, row.original.requiresManual),
  },
  {
    accessorKey: "apiEndpoint",
    header: "API Endpoint",
    size: 150,
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.apiEndpoint ? (
          <code className="text-xs bg-muted px-2 py-1 rounded">{row.original.apiEndpoint}</code>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 100,
    cell: ({ row }) => getStatusBadge(row.original.isActive),
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
          <DropdownMenuItem>Edit System</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Delete System</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<System> }) {
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

export function SystemsDataTable({
  data: initialData,
}: {
  data: System[]
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
  const [categoryFilter, setCategoryFilter] = React.useState("ALL")
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
        searchPlaceholder="Search systems..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filter1Options={[
          { value: "ALL", label: "All Status" },
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
          { value: "MAINTENANCE", label: "Maintenance" },
        ]}
        filter1Value={statusFilter}
        onFilter1Change={setStatusFilter}
        filter1Placeholder="All Status"
        filter2Options={[
          { value: "ALL", label: "All Categories" },
          { value: "PRODUCTIVITY", label: "Productivity" },
          { value: "COMMUNICATION", label: "Communication" },
          { value: "CRM", label: "CRM" },
          { value: "BUSINESS", label: "Business" },
        ]}
        filter2Value={categoryFilter}
        onFilter2Change={setCategoryFilter}
        filter2Placeholder="All Categories"
        primaryAction={{
          label: "Add System",
          onClick: () => console.log("Add system clicked")
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

function TableCellViewer({ item }: { item: System }) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left text-sm h-auto">
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>
            System details and management
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-2 leading-none font-medium">
              Description: {item.description}
            </div>
            <div className="text-muted-foreground">
              Category: {item.category}
            </div>
            <div className="text-muted-foreground">
              Status: {item.isActive ? 'Active' : 'Inactive'}
            </div>
            <div className="text-muted-foreground">
              Automation: {item.hasApi ? 'Automated' : item.requiresManual ? 'Manual' : 'Unknown'}
            </div>
            {item.apiEndpoint && (
              <div className="text-muted-foreground">
                API Endpoint: {item.apiEndpoint}
              </div>
            )}
            <div className="text-muted-foreground">
              Created: {new Date(item.createdAt).toISOString().slice(0, 19).replace('T', ' ')}
            </div>
            <div className="text-muted-foreground">
              Updated: {new Date(item.updatedAt).toISOString().slice(0, 19).replace('T', ' ')}
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button>Edit System</Button>
          <Button variant="outline">View Details</Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
