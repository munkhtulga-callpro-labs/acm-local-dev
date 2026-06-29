'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Globe, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isPending}
          aria-label={t('language')}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors disabled:opacity-50"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
            <Globe className="h-[18px] w-[18px] text-foreground" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground">{t('language')}</p>
            <p className="text-xs text-muted-foreground">{currentLabel}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
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
