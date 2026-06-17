import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SettingsClient } from './client'
import { updateSettings } from '@/lib/actions/settings'

const SETTINGS_ID = 'settings'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let settings = await prisma.systemSettings.findUnique({ where: { id: SETTINGS_ID } })
  if (!settings) {
    settings = await prisma.systemSettings.create({ data: { id: SETTINGS_ID } })
  }

  return <SettingsClient initialSettings={settings} onSave={updateSettings} />
}
