'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        const session = await getSession()
        if (session) {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false 
      })
      
      if (result?.error) {
        setError('Google sign-in failed. Please try again.')
        setIsLoading(false)
      } else if (result?.url) {
        // Redirect manually to avoid issues
        window.location.href = result.url
      }
    } catch (error) {
      setError('An error occurred with Google sign-in')
      setIsLoading(false)
    }
  }

  const handleAppleSignIn = async () => {
    setIsLoading(true)
    setError('')
    // Apple sign-in would be implemented here
    setError('Apple sign-in not yet implemented')
    setIsLoading(false)
  }

  return (
    <div className="bg-black flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Shield className="size-4" />
          </div>
          ACM
        </a>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
                  <form onSubmit={handleSubmit}>
                    <LoginForm onGoogleSignIn={handleGoogleSignIn} />
                  </form>
        </div>
      </div>
    </div>
  )
}
