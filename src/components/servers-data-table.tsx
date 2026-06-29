'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
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

type TFunc = ReturnType<typeof useTranslations<'servers.table'>>

const getStatusBadge = (isActive: boolean, t: TFunc) => {
  if (isActive) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
        {t('active')}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
      <IconCircleFilled className="fill-gray-400 dark:fill-gray-500 mr-1 w-3 h-3" />
      {t('inactive')}
    </Badge>
  )
}

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
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleFilled className="fill-gray-400 dark:fill-gray-500 mr-1 w-3 h-3" />
          {env}
        </Badge>
      )
  }
}

const getAccessLevelBadge = (level: string, t: TFunc) => {
  const levelLower = level.toLowerCase()
  switch (levelLower) {
    case 'read':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-green-500" />
          {t('accessRead')}
        </Badge>
      )
    case 'write':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-blue-500" />
          {t('accessWrite')}
        </Badge>
      )
    case 'admin':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-orange-500" />
          {t('accessAdmin')}
        </Badge>
      )
    case 'full':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-red-500" />
          {t('accessFull')}
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
  const t = useTranslations('servers.table')
  const tDrawer = useTranslations('servers.drawer')
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
            {t('name')}
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
      header: () => t('type'),
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
      header: () => t('os'),
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
      header: () => t('ipHostname'),
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
            {t('environment')}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const env = row.getValue('environment') as string
        return getEnvironmentBadge(env, t)
      },
    },
    {
      accessorKey: 'accessLevel',
      header: () => t('accessLevel'),
      cell: ({ row }) => {
        const level = row.getValue('accessLevel') as string
        return getAccessLevelBadge(level, t)
      },
    },
    {
      accessorKey: 'accessMethod',
      header: () => t('accessMethod'),
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
            {t('status')}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean
        return getStatusBadge(isActive, t)
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
                <span className="sr-only">{t('openMenu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('openMenu')}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedServer(server)
                  setDrawerOpen(true)
                }}
              >
                {t('viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(server)}>
                  {t('editServer')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(server.id, server.name)}
                  className="text-destructive"
                >
                  {t('deleteServer')}
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
          placeholder={t('searchPlaceholder')}
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {t('columns')} <ChevronDown className="ml-2 h-4 w-4" />
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
            {t('addServer')}
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
                  {t('noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {t('serverTotal', { count: table.getFilteredRowModel().rows.length })}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t('previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t('next')}
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
              <DrawerDescription>{tDrawer('description')}</DrawerDescription>
            </DrawerHeader>
            {selectedServer && (
              <div className="p-4 pb-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('type')}</p>
                    <p className="text-sm mt-1">{selectedServer.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('operatingSystem')}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {getOSIcon(selectedServer.os)}
                      <p className="text-sm">{selectedServer.os}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('environment')}</p>
                    <div className="mt-1">{getEnvironmentBadge(selectedServer.environment, t)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('status')}</p>
                    <div className="mt-1">{getStatusBadge(selectedServer.isActive, t)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('ipHostname')}</p>
                    <p className="text-sm font-mono mt-1">{selectedServer.ipHostname}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('accessMethod')}</p>
                    <p className="text-sm mt-1">{selectedServer.accessMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('accessLevel')}</p>
                    <div className="mt-1">{getAccessLevelBadge(selectedServer.accessLevel, t)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('ownerDepartment')}</p>
                    <p className="text-sm mt-1">{selectedServer.ownerDepartment}</p>
                  </div>
                  {selectedServer.locationRegion && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{tDrawer('locationRegion')}</p>
                      <p className="text-sm mt-1">{selectedServer.locationRegion}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('created')}</p>
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
                    {tDrawer('edit')}
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
                    {tDrawer('delete')}
                  </Button>
                )}
              </div>
              <DrawerClose asChild>
                <Button variant="outline">{tDrawer('close')}</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
