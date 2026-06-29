'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Building,
  Shield,
  Clock,
  Settings,
  LogOut,
  Activity,
  Server,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Database,
  Monitor,
  Key,
  Cloud,
  Laptop,
  Globe,
  Boxes,
  Lock,
  Code,
  FolderKey,
  HardDrive,
  DoorOpen,
  PlusCircle,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { LocaleSwitcher } from './locale-switcher'
import { ThemeSwitcher } from './theme-switcher'

const mainNavigation = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'requestAccess', href: '/access/request', icon: PlusCircle },
  { key: 'accessControl', href: '/access', icon: Shield },
  { key: 'approvals', href: '/approvals', icon: Clock },
  { key: 'auditLogs', href: '/audit-logs', icon: Activity },
]

const directoryNavigation = [
  { key: 'companies', href: '/companies', icon: Building },
  { key: 'departments', href: '/departments', icon: Building2 },
  { key: 'employees', href: '/employees', icon: Users },
]

const resourcesNavigation = [
  { key: 'databases', href: '/resources/databases', icon: Database },
  { key: 'servers', href: '/resources/servers', icon: Server },
  { key: 'softwareLicenses', href: '/resources/software-licenses', icon: Key },
  { key: 'saasSubscriptions', href: '/resources/saas-subscriptions', icon: Cloud },
  { key: 'devices', href: '/resources/devices', icon: Laptop },
  { key: 'cloudAccounts', href: '/resources/cloud-accounts', icon: Globe },
  { key: 'internalTools', href: '/resources/internal-tools', icon: Boxes },
  { key: 'vpnNetwork', href: '/resources/vpn-network', icon: Lock },
  { key: 'codeRepositories', href: '/resources/code-repositories', icon: Code },
  { key: 'apiKeys', href: '/resources/api-keys', icon: FolderKey },
  { key: 'fileStorage', href: '/resources/file-storage', icon: HardDrive },
  { key: 'physicalAccess', href: '/resources/physical-access', icon: DoorOpen },
]

export function Navigation() {
  const t = useTranslations('navigation')
  const pathname = usePathname()
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)

  return (
    <nav className="flex flex-col h-full">
      {/* Logo — pinned at top */}
      <div className="flex-none flex items-center px-6 py-5 border-b border-border">
        <img
          src="/callpro-cloud.png"
          alt="CallPro"
          className="h-8 w-8 mr-3 flex-shrink-0 object-contain"
        />
        <span className="text-xl font-bold text-foreground">ACM</span>
      </div>

      {/* Scrollable navigation links */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {mainNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {t(item.key)}
            </Link>
          )
        })}

        {/* Directory submenu */}
        <div className="pt-1">
          <button
            className="flex w-full items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setIsDirectoryOpen(!isDirectoryOpen)}
          >
            <FolderOpen className="mr-3 h-4 w-4" />
            {t('directory')}
            {isDirectoryOpen ? (
              <ChevronDown className="ml-auto h-4 w-4" />
            ) : (
              <ChevronRight className="ml-auto h-4 w-4" />
            )}
          </button>
          {isDirectoryOpen && (
            <div className="ml-6 mt-1 space-y-1">
              {directoryNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {t(item.key)}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Resources submenu */}
        <div className="pt-1">
          <button
            className="flex w-full items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setIsResourcesOpen(!isResourcesOpen)}
          >
            <Monitor className="mr-3 h-4 w-4" />
            {t('resources')}
            {isResourcesOpen ? (
              <ChevronDown className="ml-auto h-4 w-4" />
            ) : (
              <ChevronRight className="ml-auto h-4 w-4" />
            )}
          </button>
          {isResourcesOpen && (
            <div className="ml-6 mt-1 space-y-1">
              {resourcesNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {t(item.key)}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <Settings className="mr-3 h-4 w-4" />
          {t('settings')}
        </Link>
      </div>

      {/* Preferences — pinned at bottom */}
      <div className="flex-none border-t border-border px-4 py-4 space-y-2">
        <p className="px-1 mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t('preferences')}
        </p>
        <ThemeSwitcher />
        <LocaleSwitcher />
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 transition-colors group"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <LogOut className="h-[18px] w-[18px] text-destructive" />
          </div>
          <span className="text-sm font-semibold text-foreground">{t('signOut')}</span>
        </button>
      </div>
    </nav>
  )
}
