'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, Settings, LogOut, Plus, BookOpen, Users, ChevronDown, Key } from 'lucide-react'
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

  const userInitial = userEmail.charAt(0).toUpperCase() || 'U'

  return (
    <nav
      style={{
        background: 'rgba(12,12,18,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
      className="h-16 flex items-center px-6 sticky top-0 z-50"
    >
      {/* Logo + Brand */}
      <Link href="/dashboard" className="flex items-center gap-3 mr-8 flex-shrink-0">
        <img
          src="/vrijdag_ai_logo.svg"
          alt="Vrijdag.AI"
          height={32}
          style={{ height: '32px', width: 'auto' }}
        />
        <span
          className="hidden sm:block text-lg font-bold"
          style={{
            fontFamily: 'var(--font-oxanium), Oxanium, sans-serif',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 40%, #22d3ee 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Offerte
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: isActive ? '#818cf8' : '#a0a0b0',
                border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = '#ffffff'
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = '#a0a0b0'
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                }
              }}
            >
              <Icon size={15} />
              <span className="hidden md:block">{label}</span>
            </Link>
          )
        })}
      </div>

      {/* Right: new quote + user menu */}
      <div className="flex items-center gap-3 ml-4">
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          }}
        >
          <Plus size={16} />
          <span className="hidden sm:block">Nieuwe offerte</span>
        </Link>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all"
            style={{ color: '#a0a0b0' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                boxShadow: '0 0 12px rgba(99,102,241,0.4)',
              }}
            >
              {userInitial}
            </div>
            <ChevronDown size={14} />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-60 rounded-2xl py-1 z-50 overflow-hidden"
              style={{
                background: '#1a1a25',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div
                className="px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-xs" style={{ color: '#6b6b7a' }}>Ingelogd als</p>
                <p className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>{userEmail}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: '#a0a0b0' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#a0a0b0' }}
              >
                <Settings size={15} style={{ color: '#6b6b7a' }} />
                Instellingen
              </Link>
              <Link
                href="/settings?tab=api"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: '#a0a0b0' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#a0a0b0' }}
              >
                <Key size={15} style={{ color: '#6b6b7a' }} />
                API sleutels
              </Link>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '4px', paddingTop: '4px' }}>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors w-full text-left"
                  style={{ color: '#f87171' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
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
