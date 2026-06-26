'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const LOCALES = [
  { value: 'en', label: 'EN' },
  { value: 'mn', label: 'МН' },
] as const

export function LocaleSwitcher() {
  const t = useTranslations('navigation')
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const activeIndex = Math.max(0, LOCALES.findIndex((l) => l.value === locale))

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
    <div
      role="group"
      aria-label={t('language')}
      className="relative inline-flex flex-1 items-center rounded-md bg-muted p-0.5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%_-_0.125rem)] rounded-[5px] bg-background shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => select(value)}
          disabled={isPending}
          aria-pressed={locale === value}
          className={cn(
            'relative z-10 inline-flex flex-1 items-center justify-center rounded-[5px] py-1.5 text-xs font-semibold transition-colors disabled:opacity-70',
            locale === value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
