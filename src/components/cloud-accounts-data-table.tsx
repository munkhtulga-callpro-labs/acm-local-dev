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
  IconCloud,
  IconShieldLock,
  IconCurrencyDollar,
  IconBrandAws,
  IconBrandAzure,
  IconBrandGoogle,
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

export type CloudAccountResource = {
  id: string
  cloudProvider: string
  accountName: string
  accountId?: string | null
  environment: string
  accessType: string
  permissionLevel: string
  regionAccess?: string | null
  mfaRequired: boolean
  ownerDepartment?: string | null
  status: string
  costCenter?: string | null
  servicesAccessible?: string | null
  createdAt: string
}

interface CloudAccountsDataTableProps {
  data: CloudAccountResource[]
  onEdit?: (account: CloudAccountResource) => void
  onDelete?: (id: string, name: string) => void
  onView?: (account: CloudAccountResource) => void
  onAdd?: () => void
}

const getProviderIcon = (provider: string) => {
  const providerLower = provider.toLowerCase()
  if (providerLower.includes('aws') || providerLower.includes('amazon')) {
    return <IconBrandAws className="w-3 h-3 text-orange-500" />
  }
  if (providerLower.includes('azure') || providerLower.includes('microsoft')) {
    return <IconBrandAzure className="w-3 h-3 text-blue-500" />
  }
  if (providerLower.includes('gcp') || providerLower.includes('google')) {
    return <IconBrandGoogle className="w-3 h-3 text-blue-600" />
  }
  return <IconCloud className="w-3 h-3 text-gray-500" />
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

const getPermissionBadge = (level: string) => {
  const levelLower = level.toLowerCase()
  switch (levelLower) {
    case 'read':
    case 'readonly':
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

export function CloudAccountsDataTable({
  data,
  onEdit,
  onDelete,
  onView,
  onAdd,
}: CloudAccountsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedAccount, setSelectedAccount] = React.useState<CloudAccountResource | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const columns: ColumnDef<CloudAccountResource>[] = [
    {
      accessorKey: 'accountName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0 hover:bg-transparent"
          >
            Account Name
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const name = row.getValue('accountName') as string
        const provider = row.original.cloudProvider
        return (
          <div className="flex items-center gap-2">
            {getProviderIcon(provider)}
            <span className="font-medium">{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'cloudProvider',
      header: 'Provider',
      cell: ({ row }) => {
        const provider = row.getValue('cloudProvider') as string
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
            {provider}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'accountId',
      header: 'Account ID',
      cell: ({ row }) => {
        const accountId = row.getValue('accountId') as string
        return accountId ? (
          <span className="text-sm font-mono text-muted-foreground">{accountId}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
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
      accessorKey: 'permissionLevel',
      header: 'Permission',
      cell: ({ row }) => {
        const level = row.getValue('permissionLevel') as string
        return getPermissionBadge(level)
      },
    },
    {
      accessorKey: 'mfaRequired',
      header: 'MFA',
      cell: ({ row }) => {
        const mfa = row.getValue('mfaRequired') as boolean
        return mfa ? (
          <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
            <IconShieldLock className="mr-1 w-3 h-3 text-green-500" />
            Required
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
            <IconCircleFilled className="fill-gray-400 mr-1 w-3 h-3" />
            Optional
          </Badge>
        )
      },
    },
    {
      accessorKey: 'costCenter',
      header: 'Cost Center',
      cell: ({ row }) => {
        const costCenter = row.getValue('costCenter') as string
        return costCenter ? (
          <div className="flex items-center gap-1.5">
            <IconCurrencyDollar className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm">{costCenter}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const account = row.original

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
                  setSelectedAccount(account)
                  setDrawerOpen(true)
                }}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(account)}>
                  Edit account
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(account.id, account.accountName)}
                  className="text-destructive"
                >
                  Delete account
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
          placeholder="Search accounts..."
          value={(table.getColumn('accountName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('accountName')?.setFilterValue(event.target.value)
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
            Add Account
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
          {table.getFilteredRowModel().rows.length} account(s) total
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

      {/* Account Details Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                {selectedAccount && getProviderIcon(selectedAccount.cloudProvider)}
                {selectedAccount?.accountName}
              </DrawerTitle>
              <DrawerDescription>Cloud account details</DrawerDescription>
            </DrawerHeader>
            {selectedAccount && (
              <div className="p-4 pb-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Provider</p>
                    <p className="text-sm mt-1">{selectedAccount.cloudProvider}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account ID</p>
                    <p className="text-sm font-mono mt-1">{selectedAccount.accountId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Environment</p>
                    <div className="mt-1">{getEnvironmentBadge(selectedAccount.environment)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Access Type</p>
                    <p className="text-sm mt-1">{selectedAccount.accessType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Permission Level</p>
                    <div className="mt-1">{getPermissionBadge(selectedAccount.permissionLevel)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">MFA Required</p>
                    <p className="text-sm mt-1">{selectedAccount.mfaRequired ? 'Yes' : 'No'}</p>
                  </div>
                  {selectedAccount.regionAccess && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Region Access</p>
                      <p className="text-sm mt-1">{selectedAccount.regionAccess}</p>
                    </div>
                  )}
                  {selectedAccount.costCenter && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cost Center</p>
                      <p className="text-sm mt-1">{selectedAccount.costCenter}</p>
                    </div>
                  )}
                  {selectedAccount.ownerDepartment && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Owner Department</p>
                      <p className="text-sm mt-1">{selectedAccount.ownerDepartment}</p>
                    </div>
                  )}
                  {selectedAccount.servicesAccessible && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Services Accessible</p>
                      <p className="text-sm mt-1">{selectedAccount.servicesAccessible}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm mt-1">
                      {new Date(selectedAccount.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DrawerFooter>
              <div className="flex gap-2 w-full">
                {onEdit && selectedAccount && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDrawerOpen(false)
                      onEdit(selectedAccount)
                    }}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                )}
                {onDelete && selectedAccount && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDrawerOpen(false)
                      onDelete(selectedAccount.id, selectedAccount.accountName)
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
