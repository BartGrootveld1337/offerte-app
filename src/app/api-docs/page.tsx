export const dynamic = 'force-dynamic'

import Navbar from '@/components/ui/Navbar'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function ApiDocsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://offerte.vrijdag.ai'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">REST API Documentatie</h1>
          <p className="text-slate-500 mt-1">Integreer met je CRM of andere tools via de REST API</p>
        </div>

        <div className="space-y-6">
          {/* Auth */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Authenticatie</h2>
            <p className="text-slate-600 text-sm mb-3">
              Alle API-aanroepen vereisen een API-sleutel in de <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">Authorization</code> header.
            </p>
            <pre className="bg-slate-900 text-green-400 rounded-xl p-4 text-sm overflow-x-auto font-mono">
              {`Authorization: Bearer offt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
            </pre>
            <p className="text-slate-500 text-sm mt-3">
              Genereer een API-sleutel via <a href="/settings?tab=api" className="text-blue-600 hover:underline">Instellingen → API Sleutels</a>.
            </p>
          </section>

          {/* Quotes */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Offertes</h2>

            <div className="space-y-4">
              <ApiEndpoint
                method="GET"
                path="/api/v1/quotes"
                desc="Haal alle offertes op"
                example={`curl -H "Authorization: Bearer {key}" ${baseUrl}/api/v1/quotes`}
                response={`{\n  "data": [\n    {\n      "id": "uuid",\n      "quote_number": "OFT-2025-001",\n      "status": "sent",\n      "total": 1250.00,\n      ...\n    }\n  ]\n}`}
              />
              <ApiEndpoint
                method="GET"
                path="/api/v1/quotes/:id"
                desc="Haal een specifieke offerte op"
                example={`curl -H "Authorization: Bearer {key}" ${baseUrl}/api/v1/quotes/{id}`}
              />
              <ApiEndpoint
                method="POST"
                path="/api/v1/quotes"
                desc="Maak een nieuwe offerte aan"
                example={`curl -X POST ${baseUrl}/api/v1/quotes \\\n  -H "Authorization: Bearer {key}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"title":"Offerte","quote_number":"OFT-2025-099","status":"draft"}'`}
              />
              <ApiEndpoint
                method="PATCH"
                path="/api/v1/quotes/:id"
                desc="Werk een offerte bij"
                example={`curl -X PATCH ${baseUrl}/api/v1/quotes/{id} \\\n  -H "Authorization: Bearer {key}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"status":"expired"}'`}
              />
              <ApiEndpoint
                method="DELETE"
                path="/api/v1/quotes/:id"
                desc="Verwijder een offerte"
                example={`curl -X DELETE -H "Authorization: Bearer {key}" ${baseUrl}/api/v1/quotes/{id}`}
              />
            </div>
          </section>

          {/* Clients */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Klanten</h2>

            <div className="space-y-4">
              <ApiEndpoint
                method="GET"
                path="/api/v1/clients"
                desc="Haal alle klanten op"
                example={`curl -H "Authorization: Bearer {key}" ${baseUrl}/api/v1/clients`}
              />
              <ApiEndpoint
                method="POST"
                path="/api/v1/clients"
                desc="Maak een nieuwe klant aan"
                example={`curl -X POST ${baseUrl}/api/v1/clients \\\n  -H "Authorization: Bearer {key}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Jan Jansen","email":"jan@bedrijf.nl","company":"Bedrijf B.V."}'`}
              />
            </div>
          </section>

          {/* Statuses */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Offerte statussen</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { status: 'draft', label: 'Concept', color: 'bg-gray-100 text-gray-700' },
                { status: 'sent', label: 'Verstuurd', color: 'bg-blue-100 text-blue-700' },
                { status: 'signed', label: 'Ondertekend', color: 'bg-green-100 text-green-700' },
                { status: 'expired', label: 'Verlopen', color: 'bg-orange-100 text-orange-700' },
                { status: 'declined', label: 'Afgewezen', color: 'bg-red-100 text-red-700' },
              ].map(({ status, label, color }) => (
                <div key={status} className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono ${color}`}>{status}</span>
                  <span className="text-sm text-slate-600">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function ApiEndpoint({ method, path, desc, example, response }: {
  method: string
  path: string
  desc: string
  example: string
  response?: string
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PATCH: 'bg-orange-100 text-orange-700',
    DELETE: 'bg-red-100 text-red-700',
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-slate-50">
        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${methodColors[method] || 'bg-gray-100 text-gray-700'}`}>
          {method}
        </span>
        <code className="font-mono text-sm text-slate-700">{path}</code>
        <span className="text-slate-500 text-sm ml-1">— {desc}</span>
      </div>
      <div className="p-3">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Voorbeeld</p>
        <pre className="bg-slate-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto font-mono whitespace-pre-wrap">
          {example}
        </pre>
        {response && (
          <>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 mt-3">Respons</p>
            <pre className="bg-slate-50 text-slate-700 rounded-lg p-3 text-xs overflow-x-auto font-mono whitespace-pre">
              {response}
            </pre>
          </>
        )}
      </div>
    </div>
  )
}
