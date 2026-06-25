import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { connection } from 'next/server'

export const locales = ['en', 'mn'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export default getRequestConfig(async () => {
  await connection()
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value ?? defaultLocale) as Locale
  const resolvedLocale = locales.includes(locale) ? locale : defaultLocale

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  }
})
