'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3,
  FileText,
  BookOpen,
  Image,
  Settings,
  Sparkles,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

const navItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/cms/dashboard' },
  { icon: FileText, label: 'Blog Posts', href: '/cms/posts' },
  { icon: BookOpen, label: 'Panduan', href: '/cms/panduan' },
  { icon: Image, label: 'Media', href: '/cms/media' },
  { icon: Settings, label: 'Settings', href: '/cms/settings' },
  { icon: Sparkles, label: 'AI Workspace', href: '/cms/ai' },
]

interface CMSLayoutClientProps {
  user: User
  children: React.ReactNode
}

function isRefreshTokenError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /refresh token/i.test(error.message)
  )
}

export function CMSLayoutClient({ user, children }: CMSLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    const recoverSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error && isRefreshTokenError(error)) {
          await supabase.auth.signOut({ scope: 'local' })
          if (mounted) router.replace('/login')
          return
        }

        if (!data.session && mounted) {
          router.replace('/login')
        }
      } catch (error) {
        if (isRefreshTokenError(error)) {
          await supabase.auth.signOut({ scope: 'local' })
        }

        if (mounted) {
          router.replace('/login')
        }
      }
    }

    recoverSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && mounted) {
        router.replace('/login')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-arkara-amber/30 bg-arkara-cream/80 backdrop-blur-md flex items-center px-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-arkara-green"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="ml-4 text-xl font-bold text-arkara-green tracking-tight">
          Arkara <span className="text-arkara-amber text-sm uppercase">CMS</span>
        </h1>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed lg:relative top-0 left-0 w-64 h-screen flex flex-col border-r border-arkara-amber/20 bg-arkara-green transition-transform duration-300 ease-in-out lg:translate-x-0 z-40 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } lg:mt-0 mt-16`}
      >
        {/* Logo */}
        <div className="p-8 border-b border-arkara-amber/10">
          <h1 className="text-3xl font-black text-arkara-amber tracking-tighter">
            ARKARA
          </h1>
          <div className="h-1 w-12 bg-arkara-amber mt-2 rounded-full"></div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 mt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all group ${
                  isActive 
                    ? 'bg-arkara-amber text-arkara-green shadow-lg shadow-arkara-amber/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-arkara-amber'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-arkara-green' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-bold tracking-wide">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-arkara-amber/10 bg-black/10">
          <div className="mb-4 px-2">
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Administrator</p>
            <p className="text-sm font-medium truncate text-arkara-amber">
              {user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold bg-arkara-amber text-arkara-green hover:bg-white hover:text-arkara-green transition-all shadow-md group"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:mt-0 mt-16 overflow-hidden bg-arkara-cream">
        {/* Top Header */}
        <div className="hidden lg:flex items-center justify-between h-20 px-10 bg-white border-b border-gray-100 shadow-sm z-10">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Portal CMS</p>
            <h1 className="text-xl font-black text-arkara-green">
              ARKARA <span className="text-arkara-amber">SISTEM</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
                <p className="text-sm font-bold text-arkara-green uppercase leading-none">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-gray-400 mt-1">Status: Online</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-arkara-amber flex items-center justify-center text-arkara-green font-bold shadow-inner">
               {user.email?.[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </>
  )
}
