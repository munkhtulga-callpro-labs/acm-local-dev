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
  IconCloudComputing,
  IconUsers,
  IconAlertTriangle,
  IconTrendingUp,
  IconCurrencyDollar,
  IconShieldCheck,
  IconApi,
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

export type SaaSSubscription = {
  id: string
  serviceName: string
  category: string
  subscriptionPlan: string
  totalSeats: number
  usedSeats: number
  billingCycle: string
  cost?: number | null
  renewalDate?: string | null
  ownerDepartment?: string | null
  status: string
  ssoEnabled: boolean
  apiAccess: boolean
  createdAt: string
}

interface SaaSSubscriptionsDataTableProps {
  data: SaaSSubscription[]
  onEdit?: (subscription: SaaSSubscription) => void
  onDelete?: (id: string, name: string) => void
  onView?: (subscription: SaaSSubscription) => void
  onAdd?: () => void
}

const getUtilizationBadge = (used: number, total: number) => {
  const percentage = total > 0 ? (used / total) * 100 : 0

  if (percentage >= 95) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconAlertTriangle className="mr-1 w-3 h-3 text-red-500" />
        {percentage.toFixed(0)}%
      </Badge>
    )
  } else if (percentage >= 80) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconTrendingUp className="mr-1 w-3 h-3 text-yellow-500" />
        {percentage.toFixed(0)}%
      </Badge>
    )
  } else {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
        {percentage.toFixed(0)}%
      </Badge>
    )
  }
}

type TFunc = ReturnType<typeof useTranslations<'saasSubscriptions.table'>>

const getStatusBadge = (status: string, t: TFunc) => {
  const statusUpper = status.toUpperCase()
  switch (statusUpper) {
    case 'ACTIVE':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1 w-3 h-3" />
          {t('statusActive')}
        </Badge>
      )
    case 'EXPIRED':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleFilled className="fill-red-500 dark:fill-red-400 mr-1 w-3 h-3" />
          {t('statusExpired')}
        </Badge>
      )
    case 'CANCELLED':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleFilled className="fill-gray-400 dark:fill-gray-500 mr-1 w-3 h-3" />
          {t('statusCancelled')}
        </Badge>
      )
    case 'INACTIVE':
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          <IconCircleFilled className="fill-gray-400 dark:fill-gray-500 mr-1 w-3 h-3" />
          {t('statusInactive')}
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

export function SaaSSubscriptionsDataTable({
  data,
  onEdit,
  onDelete,
  onView,
  onAdd,
}: SaaSSubscriptionsDataTableProps) {
  const t = useTranslations('saasSubscriptions.table')
  const tDrawer = useTranslations('saasSubscriptions.drawer')
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedSubscription, setSelectedSubscription] = React.useState<SaaSSubscription | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const columns: ColumnDef<SaaSSubscription>[] = [
    {
      accessorKey: 'serviceName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0 hover:bg-transparent"
          >
            {t('serviceName')}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const name = row.getValue('serviceName') as string
        return (
          <div className="flex items-center gap-2">
            <IconCloudComputing className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'category',
      header: () => t('category'),
      cell: ({ row }) => {
        const category = row.getValue('category') as string
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
            {category}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'subscriptionPlan',
      header: () => t('plan'),
      cell: ({ row }) => {
        const plan = row.getValue('subscriptionPlan') as string
        return <span className="text-sm">{plan}</span>
      },
    },
    {
      accessorKey: 'usedSeats',
      header: () => t('seats'),
      cell: ({ row }) => {
        const used = row.getValue('usedSeats') as number
        const total = row.original.totalSeats
        return (
          <div className="flex items-center gap-1.5">
            <IconUsers className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm">{used} / {total}</span>
          </div>
        )
      },
    },
    {
      id: 'utilization',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0 hover:bg-transparent"
          >
            {t('utilization')}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const used = row.original.usedSeats
        const total = row.original.totalSeats
        return getUtilizationBadge(used, total)
      },
      sortingFn: (rowA, rowB) => {
        const percentA = (rowA.original.usedSeats / rowA.original.totalSeats) * 100
        const percentB = (rowB.original.usedSeats / rowB.original.totalSeats) * 100
        return percentA - percentB
      },
    },
    {
      accessorKey: 'cost',
      header: () => t('cost'),
      cell: ({ row }) => {
        const cost = row.getValue('cost') as number | null
        return cost ? (
          <div className="flex items-center gap-1.5">
            <IconCurrencyDollar className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm">${cost.toLocaleString()}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: 'billingCycle',
      header: () => t('billing'),
      cell: ({ row }) => {
        const cycle = row.getValue('billingCycle') as string
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
            {cycle}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'status',
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
        const status = row.getValue('status') as string
        return getStatusBadge(status, t)
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const subscription = row.original

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
                  setSelectedSubscription(subscription)
                  setDrawerOpen(true)
                }}
              >
                {t('viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(subscription)}>
                  {t('editSubscription')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(subscription.id, subscription.serviceName)}
                  className="text-destructive"
                >
                  {t('deleteSubscription')}
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
          value={(table.getColumn('serviceName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('serviceName')?.setFilterValue(event.target.value)
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
            {t('addSubscription')}
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
          {t('subscriptionTotal', { count: table.getFilteredRowModel().rows.length })}
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

      {/* Subscription Details Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <IconCloudComputing className="w-5 h-5" />
                {selectedSubscription?.serviceName}
              </DrawerTitle>
              <DrawerDescription>{tDrawer('description')}</DrawerDescription>
            </DrawerHeader>
            {selectedSubscription && (
              <div className="p-4 pb-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('category')}</p>
                    <p className="text-sm mt-1">{selectedSubscription.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('plan')}</p>
                    <p className="text-sm mt-1">{selectedSubscription.subscriptionPlan}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('seats')}</p>
                    <p className="text-sm mt-1">{selectedSubscription.usedSeats} / {selectedSubscription.totalSeats}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('utilization')}</p>
                    <div className="mt-1">{getUtilizationBadge(selectedSubscription.usedSeats, selectedSubscription.totalSeats)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('billingCycle')}</p>
                    <p className="text-sm mt-1">{selectedSubscription.billingCycle}</p>
                  </div>
                  {selectedSubscription.cost && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{tDrawer('cost')}</p>
                      <p className="text-sm mt-1">${selectedSubscription.cost.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedSubscription.renewalDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{tDrawer('renewalDate')}</p>
                      <p className="text-sm mt-1">
                        {new Date(selectedSubscription.renewalDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedSubscription.ownerDepartment && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{tDrawer('ownerDepartment')}</p>
                      <p className="text-sm mt-1">{selectedSubscription.ownerDepartment}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('status')}</p>
                    <div className="mt-1">{getStatusBadge(selectedSubscription.status, t)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('features')}</p>
                    <div className="flex gap-1.5 mt-1">
                      {selectedSubscription.ssoEnabled && (
                        <Badge variant="outline" className="text-xs">
                          <IconShieldCheck className="mr-1 w-3 h-3 text-green-500" />
                          SSO
                        </Badge>
                      )}
                      {selectedSubscription.apiAccess && (
                        <Badge variant="outline" className="text-xs">
                          <IconApi className="mr-1 w-3 h-3 text-blue-500" />
                          API
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tDrawer('created')}</p>
                    <p className="text-sm mt-1">
                      {new Date(selectedSubscription.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DrawerFooter>
              <div className="flex gap-2 w-full">
                {onEdit && selectedSubscription && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDrawerOpen(false)
                      onEdit(selectedSubscription)
                    }}
                    className="flex-1"
                  >
                    {tDrawer('edit')}
                  </Button>
                )}
                {onDelete && selectedSubscription && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDrawerOpen(false)
                      onDelete(selectedSubscription.id, selectedSubscription.serviceName)
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
