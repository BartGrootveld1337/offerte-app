import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="text-center relative z-10 max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/vrijdag_ai_logo.svg" alt="Vrijdag.AI" style={{ height: '40px', opacity: 0.6 }} />
        </div>
        <h1
          className="text-8xl font-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'var(--font-oxanium), Oxanium, sans-serif',
          }}
        >
          404
        </h1>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ color: '#ffffff', fontFamily: 'var(--font-oxanium), Oxanium, sans-serif' }}
        >
          Pagina niet gevonden
        </h2>
        <p className="mb-8" style={{ color: '#6b6b7a' }}>
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: 'white',
            textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          }}
        >
          ← Terug naar dashboard
        </Link>
      </div>
    </div>
  )
}
