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

type TFunc = ReturnType<typeof useTranslations<'cloudAccounts.table'>>

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

const getPermissionBadge = (level: string, t: TFunc) => {
  const levelLower = level.toLowerCase()
  switch (levelLower) {
    case 'read':
    case 'readonly':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-green-500" />
          {t('permRead')}
        </Badge>
      )
    case 'write':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-blue-500" />
          {t('permWrite')}
        </Badge>
      )
    case 'admin':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-orange-500" />
          {t('permAdmin')}
        </Badge>
      )
    case 'full':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconShieldLock className="mr-1 w-3 h-3 text-red-500" />
          {t('permFull')}
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
  const t = useTranslations('cloudAccounts.table')
  const tDrawer = useTranslations('cloudAccounts.drawer')
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
            {t('accountName')}
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
      header: t('provider'),
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
      header: t('accountId'),
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
      accessorKey: 'permissionLevel',
      header: t('permission'),
      cell: ({ row }) => {
        const level = row.getValue('permissionLevel') as string
        return getPermissionBadge(level, t)
      },
    },
    {
      accessorKey: 'mfaRequired',
      header: t('mfa'),
      cell: ({ row }) => {
        const mfa = row.getValue('mfaRequired') as boolean
        return mfa ? (
          <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
            <IconShieldLock className="mr-1 w-3 h-3 text-green-500" />
            {t('mfaRequired')}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
            <IconCircleFilled className="fill-gray-400 mr-1 w-3 h-3" />
            {t('mfaOptional')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'costCenter',
      header: t('costCenter'),
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
                <span className="sr-only">{t('openMenu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('actionsLabel')}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedAccount(account)
                  setDrawerOpen(true)
                }}
              >
                {t('viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(account)}>
                  {t('editAccount')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(account.id, account.accountName)}
                  className="text-destructive"
                >
                  {t('deleteAccount')}
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
          value={(table.getColumn('accountName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('accountName')?.setFilterValue(event.target.value)
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
            {t('addAccount')}
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
          {t('accountTotal', { count: table.getFilteredRowModel().rows.length })}
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

      {/* Account Details Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                {selectedAccount && getProviderIcon(selectedAccount.cloudProvider)}
                {selectedAccount?.accountName}
              </DrawerTitle>
              <DrawerDescription>{tDrawer('description')}</DrawerDescription>
            </DrawerHeader>
            {selectedAccount && (
              <div className="p-4 pb-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('provider')}</p>
                    <p className="text-sm mt-1">{selectedAccount.cloudProvider}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('accountId')}</p>
                    <p className="text-sm font-mono mt-1">{selectedAccount.accountId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('environment')}</p>
                    <div className="mt-1">{getEnvironmentBadge(selectedAccount.environment, t)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('accessType')}</p>
                    <p className="text-sm mt-1">{selectedAccount.accessType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('permissionLevel')}</p>
                    <div className="mt-1">{getPermissionBadge(selectedAccount.permissionLevel, t)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('mfaRequired')}</p>
                    <p className="text-sm mt-1">{selectedAccount.mfaRequired ? tDrawer('yes') : tDrawer('no')}</p>
                  </div>
                  {selectedAccount.regionAccess && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{tDrawer('regionAccess')}</p>
                      <p className="text-sm mt-1">{selectedAccount.regionAccess}</p>
                    </div>
                  )}
                  {selectedAccount.costCenter && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{tDrawer('costCenter')}</p>
                      <p className="text-sm mt-1">{selectedAccount.costCenter}</p>
                    </div>
                  )}
                  {selectedAccount.ownerDepartment && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{tDrawer('ownerDepartment')}</p>
                      <p className="text-sm mt-1">{selectedAccount.ownerDepartment}</p>
                    </div>
                  )}
                  {selectedAccount.servicesAccessible && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">{tDrawer('servicesAccessible')}</p>
                      <p className="text-sm mt-1">{selectedAccount.servicesAccessible}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('created')}</p>
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
                    {tDrawer('edit')}
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
