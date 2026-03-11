'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { FileText, LayoutDashboard, Settings, LogOut, Plus, BookOpen, Users, ChevronDown, Key } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string>('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email || '')
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clients', label: 'Klanten', icon: Users },
    { href: '/catalog', label: 'Catalogus', icon: BookOpen },
    { href: '/settings', label: 'Instellingen', icon: Settings },
  ]

  return (
    <nav className="bg-slate-900 text-white h-16 flex items-center px-6 sticky top-0 z-50 shadow-lg">
      <Link href="/dashboard" className="flex items-center gap-2 mr-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <FileText size={16} />
        </div>
        <span className="font-bold text-lg hidden sm:block">Vrijdag.AI</span>
        <span className="text-slate-500 text-xs hidden md:block ml-1">Offerte App</span>
      </Link>

      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              pathname.startsWith(href)
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={15} />
            <span className="hidden md:block">{label}</span>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
        >
          <Plus size={16} />
          <span className="hidden sm:block">Nieuwe offerte</span>
        </Link>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <div className="w-7 h-7 bg-blue-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {userEmail.charAt(0).toUpperCase() || 'U'}
            </div>
            <ChevronDown size={14} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs text-slate-500">Ingelogd als</p>
                <p className="text-sm font-medium text-slate-900 truncate">{userEmail}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings size={15} className="text-slate-400" />
                Instellingen
              </Link>
              <Link
                href="/settings?tab=api"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Key size={15} className="text-slate-400" />
                API sleutels
              </Link>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut size={15} />
                  Uitloggen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
