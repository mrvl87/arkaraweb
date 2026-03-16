'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#1a2e1a' }}>
      <div
        className="w-full max-w-md p-8 rounded-lg shadow-2xl"
        style={{ backgroundColor: '#f5f0e8' }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a2e1a' }}>
            Arkara
          </h1>
          <p className="text-sm" style={{ color: '#d4a017' }}>
            Survival Knowledge Platform
          </p>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center" style={{ color: '#1a2e1a' }}>
          Masuk ke CMS
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1a2e1a' }}>
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                borderColor: '#d4a017',
                outlineColor: '#d4a017',
              }}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1a2e1a' }}>
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                borderColor: '#d4a017',
              }}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: '#d4a017',
              color: '#1a2e1a',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Sedang masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
