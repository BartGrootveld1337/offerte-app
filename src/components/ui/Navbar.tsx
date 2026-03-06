'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FileText, LayoutDashboard, Settings, LogOut, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/settings', label: 'Instellingen', icon: Settings },
  ]

  return (
    <nav className="bg-slate-900 text-white h-16 flex items-center px-6 sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-2 mr-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <FileText size={16} />
        </div>
        <span className="font-bold text-lg">Offerte App</span>
      </Link>

      <div className="flex items-center gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors"
        >
          <Plus size={16} />
          Nieuwe offerte
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  )
}
