'use client'

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', Icon: Sun, key: 'lightMode' },
  { value: 'dark',  Icon: Moon, key: 'darkMode'  },
] as const

export function ThemeSwitcher() {
  const t = useTranslations('navigation')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [pillIndex, setPillIndex] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const idx = OPTIONS.findIndex((o) => o.value === theme)
    if (idx >= 0) setPillIndex(idx)
  }, [mounted, theme])

  const change = (value: string) => {
    if (value === theme) return
    const newIndex = OPTIONS.findIndex((o) => o.value === value)

    flushSync(() => setPillIndex(newIndex))

    setTimeout(() => {
      const doc = document as Document & { startViewTransition?: (cb: () => void) => void }
      if (!doc.startViewTransition) {
        setTheme(value)
        return
      }
      doc.startViewTransition(() => {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(value)
        setTheme(value)
      })
    }, 280)
  }

  const ActiveIcon = OPTIONS[pillIndex].Icon

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40">
      {/* Animated icon — remounts on each toggle to replay the spin-in */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
        <ActiveIcon
          key={pillIndex}
          className={cn(
            'h-[18px] w-[18px] text-foreground',
            mounted && (pillIndex === 0 ? 'animate-icon-cw' : 'animate-icon-ccw')
          )}
        />
      </div>

      {/* Title + current value */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{t('appearance')}</p>
        <p className="text-xs text-muted-foreground">
          {mounted ? t(OPTIONS[pillIndex].key === 'lightMode' ? 'lightMode' : 'darkMode') : ''}
        </p>
      </div>

      {/* Pill toggle */}
      <div
        role="group"
        aria-label={t('theme')}
        className="relative inline-flex items-center rounded-full bg-muted p-1"
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-1 left-1 h-7 w-7 rounded-full bg-primary shadow-sm',
            'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
            !mounted && 'opacity-0'
          )}
          style={{ transform: `translateX(${pillIndex * 1.75}rem)` }}
        />
        {OPTIONS.map(({ value, Icon, key }, idx) => (
          <button
            key={value}
            type="button"
            onClick={() => change(value)}
            aria-pressed={pillIndex === idx}
            title={t(key)}
            className={cn(
              'relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors',
              pillIndex === idx
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  )
}
