"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface EmployeeComboboxProps {
  employees: Employee[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function EmployeeCombobox({
  employees,
  value,
  onValueChange,
  placeholder = "Select employee...",
  disabled = false,
  className
}: EmployeeComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedEmployee = employees.find((emp) => emp.email === value)

  // Filter employees based on search query
  const filteredEmployees = React.useMemo(() => {
    if (!searchQuery.trim()) return employees

    const query = searchQuery.toLowerCase()
    return employees.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase()
      const email = emp.email.toLowerCase()
      return fullName.includes(query) || email.includes(query)
    })
  }, [employees, searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-[40px]", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            {selectedEmployee ? (
              <>
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col items-start overflow-hidden w-full">
                  <span className="text-sm font-medium truncate w-full text-left">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full text-left">
                    {selectedEmployee.email}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[400px] max-w-[600px] p-0" align="start" side="bottom">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or email..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-10"
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No employee found.</CommandEmpty>
            <CommandGroup>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <CommandItem
                    key={employee.id}
                    value={employee.email}
                    onSelect={() => {
                      onValueChange(employee.email)
                      setSearchQuery("")
                      setOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === employee.email ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <User className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="font-medium text-sm truncate">
                        {employee.firstName} {employee.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {employee.email}
                      </span>
                    </div>
                  </CommandItem>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No employees found matching "{searchQuery}"
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
