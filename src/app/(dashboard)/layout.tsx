'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Navigation } from '@/components/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow bg-card">
            <Navigation />
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      {/* Page Footer - Fixed to bottom */}
      <footer className="bg-card border-t border-border p-4">
        <p className="text-xs text-muted-foreground text-center">
          Onlime Network LLC | DevOps Team
        </p>
      </footer>
    </div>
  )
}
