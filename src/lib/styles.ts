import type React from 'react'

export const card: React.CSSProperties = {
  background: '#1e1e2a',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
}

export const input: React.CSSProperties = {
  background: '#12121a',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
  borderRadius: '10px',
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
  fontSize: '14px',
}

export const btnGradient: React.CSSProperties = {
  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
  color: 'white',
  borderRadius: '12px',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
}

export const btnOutline: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#a0a0b0',
  borderRadius: '12px',
  padding: '10px 16px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

export const label: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#a0a0b0',
  marginBottom: '6px',
}
