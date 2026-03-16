'use client'

import { useState } from 'react'
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
  { icon: Sparkles, label: 'AI Generator', href: '/cms/ai' },
]

interface CMSLayoutClientProps {
  user: User
  children: React.ReactNode
}

export function CMSLayoutClient({ user, children }: CMSLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Header */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b flex items-center px-4 z-50"
        style={{ backgroundColor: '#f5f0e8', borderColor: '#d4a017' }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2"
          style={{ color: '#1a2e1a' }}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="ml-4 text-xl font-bold" style={{ color: '#1a2e1a' }}>
          Arkara CMS
        </h1>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed lg:relative top-0 left-0 w-60 h-screen flex flex-col border-r transition-transform duration-200 lg:translate-x-0 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:mt-0 mt-16`}
        style={{ backgroundColor: '#1a2e1a', borderColor: '#d4a017' }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: '#d4a017' }}>
          <h1 className="text-2xl font-bold" style={{ color: '#d4a017' }}>
            Arkara
          </h1>
          <p className="text-xs mt-1" style={{ color: '#a0a0a0' }}>
            CMS
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-opacity-100' : 'hover:bg-opacity-50'
                }`}
                style={{
                  backgroundColor: isActive ? '#d4a017' : 'transparent',
                  color: isActive ? '#1a2e1a' : '#d4a017',
                }}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t" style={{ borderColor: '#d4a017' }}>
          <div className="mb-4">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="text-sm font-medium truncate" style={{ color: '#d4a017' }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: '#d4a017',
              color: '#1a2e1a',
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
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
      <div className="flex-1 flex flex-col lg:mt-0 mt-16 overflow-hidden">
        {/* Top Header */}
        <div
          className="hidden lg:flex items-center justify-between h-16 px-6 border-b"
          style={{ backgroundColor: '#f5f0e8', borderColor: '#d4a017' }}
        >
          <h1 className="text-xl font-bold" style={{ color: '#1a2e1a' }}>
            Arkara CMS
          </h1>
          <div className="flex items-center space-x-4">
            <p className="text-sm" style={{ color: '#1a2e1a' }}>
              {user.email}
            </p>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: '#d4a017',
                color: '#1a2e1a',
              }}
            >
              <LogOut size={18} />
            </button>
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
