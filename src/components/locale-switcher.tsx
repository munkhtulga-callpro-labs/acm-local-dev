'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggleLocale = () => {
    const next = locale === 'en' ? 'mn' : 'en'
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => {
      // Soft refresh: re-renders server components with the new locale
      // and updates the client provider without a full page reload.
      router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-muted-foreground hover:text-foreground"
      onClick={toggleLocale}
      disabled={isPending}
    >
      <Languages className="mr-3 h-4 w-4" />
      {locale === 'en' ? 'Монгол' : 'English'}
    </Button>
  )
}
