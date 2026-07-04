'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginFormData = z.infer<typeof loginSchema>

function isRefreshTokenError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /refresh token/i.test(error.message)
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let mounted = true

    const prepareLogin = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error && isRefreshTokenError(error)) {
          await supabase.auth.signOut({ scope: 'local' })
          return
        }

        if (data.session && mounted) {
          router.replace('/cms/dashboard')
        }
      } catch (error) {
        if (isRefreshTokenError(error)) {
          await supabase.auth.signOut({ scope: 'local' })
        }
      }
    }

    prepareLogin()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      router.push('/cms/dashboard')
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-arkara-green p-4">
      <Card className="w-full max-w-md border-arkara-amber/20 bg-arkara-cream shadow-2xl">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-arkara-green">
              Arkara
            </h1>
            <p className="text-sm font-semibold text-arkara-amber">
              Survival Knowledge Platform
            </p>
          </div>

          <h2 className="mb-6 text-center text-2xl font-semibold text-arkara-green">
            Masuk ke CMS
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-arkara-green">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                hasError={Boolean(errors.email)}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-arkara-green">
                Password
              </label>
              <Input
                {...register('password')}
                type="password"
                placeholder="••••••"
                hasError={Boolean(errors.password)}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              variant="accent"
              className="w-full"
            >
              {isLoading ? 'Sedang masuk...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
