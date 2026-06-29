import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { connection } from 'next/server'

export const locales = ['en', 'mn'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const namespaces = [
  'accessControl',
  'apiKeys',
  'approvals',
  'auditLogs',
  'cloudAccounts',
  'codeRepositories',
  'companies',
  'dashboard',
  'databases',
  'departments',
  'devices',
  'employees',
  'fileStorage',
  'internalTools',
  'navigation',
  'physicalAccess',
  'requestAccess',
  'saasSubscriptions',
  'servers',
  'settings',
  'softwareLicenses',
  'vpnNetwork',
] as const

export default getRequestConfig(async () => {
  await connection()
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value ?? defaultLocale) as Locale
  const resolvedLocale = locales.includes(locale) ? locale : defaultLocale

  const entries = await Promise.all(
    namespaces.map(
      async (ns) =>
        [ns, (await import(`../../messages/${resolvedLocale}/${ns}.json`)).default] as const
    )
  )

  return {
    locale: resolvedLocale,
    messages: Object.fromEntries(entries),
  }
})
