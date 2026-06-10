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
  IconServer,
  IconNetwork,
  IconShieldLock,
  IconBrandWindows,
  IconBrandUbuntu,
  IconBrandDebian,
  IconBrandRedhat,
  IconDeviceDesktop,
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

export type ServerResource = {
  id: string
  name: string
  type: string
  os: string
  environment: string
  ipHostname: string
  accessMethod: string
  accessLevel: string
  locationRegion?: string | null
  ownerDepartment: string
  status: string
  isActive: boolean
  createdAt: string
}

interface ServersDataTableProps {
  data: ServerResource[]
  onEdit?: (server: ServerResource) => void
  onDelete?: (id: string, name: string) => void
  onView?: (server: ServerResource) => void
  onAdd?: () => void
}

const getStatusBadge = (isActive: boolean) => {
  if (isActive) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
        Active
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
      <IconCircleFilled className="fill-gray-400 dark:fill-gray-500 mr-1 w-3 h-3" />
      Inactive
    </Badge>
  )
}

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
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleFilled className="fill-gray-400 dark:fill-gray-500 mr-1 w-3 h-3" />
          {env}
        </Badge>
      )
  }
}

const getAccessLevelBadge = (level: string) => {
  const levelLower = level.toLowerCase()
  switch (levelLower) {
    case 'read':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-green-500" />
          Read
        </Badge>
      )
    case 'write':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-blue-500" />
          Write
        </Badge>
      )
    case 'admin':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-orange-500" />
          Admin
        </Badge>
      )
    case 'full':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-red-500" />
          Full
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-gray-500" />
          {level}
        </Badge>
      )
  }
}

const getOSIcon = (os: string) => {
  const osLower = os.toLowerCase()
  if (osLower.includes('windows')) {
    return <IconBrandWindows className="w-3 h-3 text-blue-500" />
  }
  if (osLower.includes('ubuntu')) {
    return <IconBrandUbuntu className="w-3 h-3 text-orange-500" />
  }
  if (osLower.includes('debian')) {
    return <IconBrandDebian className="w-3 h-3 text-red-500" />
  }
  if (osLower.includes('rhel') || osLower.includes('redhat') || osLower.includes('centos')) {
    return <IconBrandRedhat className="w-3 h-3 text-red-600" />
  }
  return <IconDeviceDesktop className="w-3 h-3 text-gray-500" />
}

export function ServersDataTable({
  data,
  onEdit,
  onDelete,
  onView,
  onAdd,
}: ServersDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedServer, setSelectedServer] = React.useState<ServerResource | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const columns: ColumnDef<ServerResource>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0 hover:bg-transparent"
          >
            Name
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const name = row.getValue('name') as string
        return (
          <div className="flex items-center gap-2">
            <IconServer className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
            {type}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'os',
      header: 'OS',
      cell: ({ row }) => {
        const os = row.getValue('os') as string
        return (
          <div className="flex items-center gap-1.5">
            {getOSIcon(os)}
            <span className="text-sm">{os}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'ipHostname',
      header: 'IP/Hostname',
      cell: ({ row }) => {
        const ip = row.getValue('ipHostname') as string
        return (
          <div className="flex items-center gap-1.5">
            <IconNetwork className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm font-mono text-muted-foreground">{ip}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'environment',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0 hover:bg-transparent"
          >
            Environment
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const env = row.getValue('environment') as string
        return getEnvironmentBadge(env)
      },
    },
    {
      accessorKey: 'accessLevel',
      header: 'Access Level',
      cell: ({ row }) => {
        const level = row.getValue('accessLevel') as string
        return getAccessLevelBadge(level)
      },
    },
    {
      accessorKey: 'accessMethod',
      header: 'Access Method',
      cell: ({ row }) => {
        const method = row.getValue('accessMethod') as string
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
            {method}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0 hover:bg-transparent"
          >
            Status
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean
        return getStatusBadge(isActive)
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const server = row.original

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
              <DropdownMenuItem
                onClick={() => {
                  setSelectedServer(server)
                  setDrawerOpen(true)
                }}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(server)}>
                  Edit server
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(server.id, server.name)}
                  className="text-destructive"
                >
                  Delete server
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder="Search servers..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            Add Server
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} server(s) total
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Server Details Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <IconServer className="w-5 h-5" />
                {selectedServer?.name}
              </DrawerTitle>
              <DrawerDescription>Server resource details</DrawerDescription>
            </DrawerHeader>
            {selectedServer && (
              <div className="p-4 pb-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-sm mt-1">{selectedServer.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Operating System</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {getOSIcon(selectedServer.os)}
                      <p className="text-sm">{selectedServer.os}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Environment</p>
                    <div className="mt-1">{getEnvironmentBadge(selectedServer.environment)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedServer.isActive)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP/Hostname</p>
                    <p className="text-sm font-mono mt-1">{selectedServer.ipHostname}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Access Method</p>
                    <p className="text-sm mt-1">{selectedServer.accessMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Access Level</p>
                    <div className="mt-1">{getAccessLevelBadge(selectedServer.accessLevel)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Owner Department</p>
                    <p className="text-sm mt-1">{selectedServer.ownerDepartment}</p>
                  </div>
                  {selectedServer.locationRegion && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location/Region</p>
                      <p className="text-sm mt-1">{selectedServer.locationRegion}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm mt-1">
                      {new Date(selectedServer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DrawerFooter>
              <div className="flex gap-2 w-full">
                {onEdit && selectedServer && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDrawerOpen(false)
                      onEdit(selectedServer)
                    }}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                )}
                {onDelete && selectedServer && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDrawerOpen(false)
                      onDelete(selectedServer.id, selectedServer.name)
                    }}
                    className="flex-1"
                  >
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
