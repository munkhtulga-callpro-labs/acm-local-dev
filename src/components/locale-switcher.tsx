'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Languages, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Add more languages here as they become available.
const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'mn', label: 'Монгол' },
] as const

export function LocaleSwitcher() {
  const t = useTranslations('navigation')
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const currentLabel = LOCALES.find((l) => l.value === locale)?.label ?? locale

  const select = (next: string) => {
    if (next === locale) return
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => {
      // Soft refresh: re-renders server components with the new locale
      // and updates the client provider without a full page reload.
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          disabled={isPending}
          aria-label={t('language')}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Languages className="mr-3 h-4 w-4" />
          {currentLabel}
          <ChevronDown className="ml-auto h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuRadioGroup value={locale} onValueChange={select}>
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l.value} value={l.value}>
              {l.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
