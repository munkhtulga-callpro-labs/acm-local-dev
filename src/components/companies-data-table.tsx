"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLoader,
  IconX,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconBuilding,
  IconUsers,
  IconBuildingSkyscraper,
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
import { useTranslations } from "next-intl"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  employees: z.array(z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  })),
  departments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
  })),
})

export type Company = z.infer<typeof companySchema>

interface CompaniesDataTableProps {
  data: Company[]
  onEdit: (company: Company) => void
  onDelete: (id: string, name: string) => void
}

export function CompaniesDataTable({ data, onEdit, onDelete }: CompaniesDataTableProps) {
  const t = useTranslations('companies.table')
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedCompany, setSelectedCompany] = React.useState<{ id: string; name: string } | null>(null)

  const handleDelete = (id: string, name: string) => {
    setSelectedCompany({ id, name })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedCompany) {
      onDelete(selectedCompany.id, selectedCompany.name)
      setDeleteDialogOpen(false)
      setSelectedCompany(null)
    }
  }

  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-auto p-1 hover:bg-transparent data-[state=open]:bg-transparent"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('company')}
            </span>
            {column.getIsSorted() === "asc" ? (
              <IconArrowUp className="ml-2 size-3.5 text-muted-foreground/70" />
            ) : column.getIsSorted() === "desc" ? (
              <IconArrowDown className="ml-2 size-3.5 text-muted-foreground/70" />
            ) : (
              <IconArrowsSort className="ml-2 size-3.5 text-muted-foreground/70" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const company = row.original
        return (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
              <IconBuilding className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{company.name}</p>
              {company.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {company.description}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-auto p-1 hover:bg-transparent"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('contact')}
            </span>
            {column.getIsSorted() === "asc" ? (
              <IconArrowUp className="ml-2 size-3.5 text-muted-foreground/70" />
            ) : column.getIsSorted() === "desc" ? (
              <IconArrowDown className="ml-2 size-3.5 text-muted-foreground/70" />
            ) : (
              <IconArrowsSort className="ml-2 size-3.5 text-muted-foreground/70" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const company = row.original
        return (
          <div className="space-y-1">
            <p className="text-sm">{company.email || "—"}</p>
            {company.phone && (
              <p className="text-sm text-muted-foreground">{company.phone}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "employees",
      header: ({ column }) => {
        return (
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('employees')}
          </div>
        )
      },
      cell: ({ row }) => {
        const company = row.original
        return (
          <div className="flex items-center gap-2">
            <IconUsers className="size-4 text-muted-foreground" />
            <span className="text-sm">{company.employees.length}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "departments",
      header: ({ column }) => {
        return (
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('departments')}
          </div>
        )
      },
      cell: ({ row }) => {
        const company = row.original
        return (
          <div className="flex items-center gap-2">
            <IconBuildingSkyscraper className="size-4 text-muted-foreground" />
            <span className="text-sm">{company.departments.length}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-auto p-1 hover:bg-transparent"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('status')}
            </span>
            {column.getIsSorted() === "asc" ? (
              <IconArrowUp className="ml-2 size-3.5 text-muted-foreground/70" />
            ) : column.getIsSorted() === "desc" ? (
              <IconArrowDown className="ml-2 size-3.5 text-muted-foreground/70" />
            ) : (
              <IconArrowsSort className="ml-2 size-3.5 text-muted-foreground/70" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        return (
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={
              isActive
                ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                : "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20 dark:text-gray-400"
            }
          >
            <IconCircleCheckFilled
              className={`mr-1 size-3 ${isActive ? "text-emerald-500" : "text-gray-400"}`}
            />
            {isActive ? t('active') : t('inactive')}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const company = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <IconDotsVertical className="size-4" />
                <span className="sr-only">{t('openMenu')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(company)}>
                {t('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(company.id, company.name)}
                className="text-destructive focus:text-destructive"
              >
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t('searchPlaceholder')}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-9 w-full max-w-sm"
        />

        <div className="flex items-center gap-2">
          <Select
            value={(table.getColumn("isActive")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) =>
              table.getColumn("isActive")?.setFilterValue(value === "all" ? undefined : value === "true")
            }
          >
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="true">{t('active')}</SelectItem>
              <SelectItem value="false">{t('inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-12">
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
                  className="group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {t('rowsTotal', { count: table.getFilteredRowModel().rows.length })}
        </div>
        <div className="flex items-center gap-6 lg:gap-8">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{t('rowsPerPage')}</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
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
          <div className="flex items-center justify-center text-sm font-medium">
            {t('pageOf', {
              current: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden size-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{t('goToFirstPage')}</span>
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{t('goToPreviousPage')}</span>
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{t('goToNextPage')}</span>
              <IconChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{t('goToLastPage')}</span>
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich('deleteDialog.description', {
                name: selectedCompany?.name ?? '',
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
