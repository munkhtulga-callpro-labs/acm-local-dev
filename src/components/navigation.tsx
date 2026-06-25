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
  Sun,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { LocaleSwitcher } from './locale-switcher'

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
  const { theme, setTheme } = useTheme()

  return (
    <nav className="flex flex-col space-y-1 p-4">
      {/* Logo and ACM text as header */}
      <div className="flex items-center px-4 py-4 mb-2">
        <img 
          src="/callpro-cloud.png" 
          alt="CallPro" 
          className="h-8 w-8 mr-3 flex-shrink-0 object-contain"
        />
        <span className="text-xl font-bold text-foreground">ACM</span>
      </div>
      
      {/* Main Navigation */}
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

      {/* Directory Submenu */}
      <div className="pt-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => setIsDirectoryOpen(!isDirectoryOpen)}
        >
          <FolderOpen className="mr-3 h-4 w-4" />
          {t('directory')}
          {isDirectoryOpen ? (
            <ChevronDown className="ml-auto h-4 w-4" />
          ) : (
            <ChevronRight className="ml-auto h-4 w-4" />
          )}
        </Button>
        
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

      {/* Resources Submenu */}
      <div className="pt-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => setIsResourcesOpen(!isResourcesOpen)}
        >
          <Monitor className="mr-3 h-4 w-4" />
          {t('resources')}
          {isResourcesOpen ? (
            <ChevronDown className="ml-auto h-4 w-4" />
          ) : (
            <ChevronRight className="ml-auto h-4 w-4" />
          )}
        </Button>

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
      
      <div className="pt-4 mt-4 border-t border-border space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="mr-3 h-4 w-4" />
          ) : (
            <Moon className="mr-3 h-4 w-4" />
          )}
          {theme === 'dark' ? t('lightMode') : t('darkMode')}
        </Button>
        <LocaleSwitcher />
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="mr-3 h-4 w-4" />
          {t('signOut')}
        </Button>
      </div>
    </nav>
  )
}
