'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          className="min-h-screen flex items-center justify-center p-8"
          style={{ background: '#0a0a0f' }}
        >
          <div
            className="max-w-md w-full rounded-2xl p-8 text-center"
            style={{
              background: '#1e1e2a',
              border: '1px solid rgba(239,68,68,0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <span style={{ fontSize: '32px' }}>⚠️</span>
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}
            >
              Er is iets misgegaan
            </h2>
            <p className="text-sm mb-6" style={{ color: '#a0a0b0' }}>
              {this.state.error?.message || 'Onbekende fout'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-xl font-semibold text-sm"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Pagina opnieuw laden
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
