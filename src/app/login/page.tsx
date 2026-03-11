'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(99,102,241,0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Gradient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-200px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.08) 40%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <img
              src="/vrijdag_ai_logo.svg"
              alt="Vrijdag.AI"
              style={{ height: '48px', width: 'auto' }}
            />
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: 'var(--font-oxanium), Oxanium, sans-serif',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 40%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Offerte Platform
          </h1>
          <p style={{ color: '#6b6b7a', fontSize: '14px' }}>Inloggen op je account</p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(30,30,42,0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}
        >
          <h2
            className="text-xl font-bold mb-6"
            style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}
          >
            Inloggen
          </h2>

          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm mb-4"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#a0a0b0' }}>
                E-mailadres
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: '#6b6b7a' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    background: '#12121a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.4)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                  placeholder="bart@vrijdag.ai"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#a0a0b0' }}>
                Wachtwoord
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: '#6b6b7a' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    background: '#12121a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.4)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all mt-2"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Bezig...' : 'Inloggen →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#6b6b7a' }}>
          Vrijdag.AI — Offerte Platform
        </p>
      </div>
    </div>
  )
}
