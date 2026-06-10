"use client"

import * as React from "react"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterOption {
  value: string
  label: string
}

interface PrimaryAction {
  label: string
  onClick: () => void
}

interface DataTableToolbarProps {
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filter1Options: FilterOption[]
  filter1Value: string
  onFilter1Change: (value: string) => void
  filter1Placeholder: string
  filter2Options?: FilterOption[]
  filter2Value?: string
  onFilter2Change?: (value: string) => void
  filter2Placeholder?: string
  primaryAction: PrimaryAction
}

export function DataTableToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filter1Options,
  filter1Value,
  onFilter1Change,
  filter1Placeholder,
  filter2Options,
  filter2Value,
  onFilter2Change,
  filter2Placeholder,
  primaryAction,
}: DataTableToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-9"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter 1 */}
      <Select value={filter1Value} onValueChange={onFilter1Change}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder={filter1Placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filter1Options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filter 2 (if provided) */}
      {filter2Options && filter2Value !== undefined && onFilter2Change && (
        <Select value={filter2Value} onValueChange={onFilter2Change}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={filter2Placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filter2Options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Primary Action Button */}
      <Button size="sm" onClick={primaryAction.onClick}>
        <Plus className="mr-2 h-4 w-4" />
        {primaryAction.label}
      </Button>
    </div>
  )
}
