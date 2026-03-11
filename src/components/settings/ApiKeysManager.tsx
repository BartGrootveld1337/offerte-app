'use client'

import { useState } from 'react'
import { Key, Plus, Trash2, Copy, Eye, EyeOff, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

interface ApiKeyRecord {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at?: string | null
}

interface Props {
  initialKeys: ApiKeyRecord[]
}

export default function ApiKeysManager({ initialKeys }: Props) {
  const [keys, setKeys] = useState<ApiKeyRecord[]>(initialKeys)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newRawKey, setNewRawKey] = useState<string | null>(null)
  const [showNewKey, setShowNewKey] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newKeyName.trim()) { toast.error('Geef de sleutel een naam'); return }
    setCreating(true)
    const res = await fetch('/api/settings/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Fout bij aanmaken'); setCreating(false); return }

    setKeys(prev => [data.data, ...prev])
    setNewRawKey(data.data.raw_key)
    setNewKeyName('')
    setCreating(false)
    toast.success('API sleutel aangemaakt! Sla hem nu op — hij wordt niet opnieuw getoond.')
  }

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/settings/api-keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setKeys(prev => prev.filter(k => k.id !== id))
      setDeleteConfirm(null)
      toast.success('API sleutel ingetrokken')
    } else {
      toast.error('Fout bij intrekken')
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Gekopieerd naar klembord')
  }

  return (
    <div className="space-y-6">
      {/* New raw key banner */}
      {newRawKey && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-600 text-lg">⚠️</span>
            <h3 className="font-bold text-amber-800">Sla deze sleutel nu op!</h3>
          </div>
          <p className="text-amber-700 text-sm mb-3">
            Dit is de enige keer dat je de volledige sleutel ziet. Sla hem op in een veilige plek.
          </p>
          <div className="bg-[#1e1e2a] border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <code className="font-mono text-sm text-slate-800 break-all flex-1">
              {showNewKey ? newRawKey : `${newRawKey.substring(0, 20)}${'•'.repeat(20)}`}
            </code>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setShowNewKey(!showNewKey)} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
                {showNewKey ? <EyeOff size={16} className="text-amber-600" /> : <Eye size={16} className="text-amber-600" />}
              </button>
              <button onClick={() => handleCopy(newRawKey)} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
                <Copy size={16} className="text-amber-600" />
              </button>
            </div>
          </div>
          <button onClick={() => setNewRawKey(null)} className="mt-3 text-sm text-amber-600 hover:underline">
            Ik heb de sleutel opgeslagen →
          </button>
        </div>
      )}

      {/* Create new */}
      <div className="bg-[#1e1e2a] rounded-2xl p-6 shadow-sm border border-white/6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Key size={18} className="text-indigo-400" />
          API Sleutels
        </h2>
        <p className="text-[#6b6b7a] text-sm mb-5">
          Gebruik API-sleutels om de REST API te gebruiken voor CRM-integraties.
          Zie de <a href="/api-docs" className="text-indigo-400 hover:underline inline-flex items-center gap-1">API documentatie <ExternalLink size={12} /></a> voor meer info.
        </p>

        <div className="flex gap-3 mb-6">
          <input
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Naam voor de sleutel, bijv. 'HubSpot CRM'"
            className="flex-1 px-3 py-2 border border-white/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newKeyName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
            {creating ? 'Aanmaken...' : 'Aanmaken'}
          </button>
        </div>

        {/* Keys list */}
        {keys.length === 0 ? (
          <div className="text-center py-8 text-[#6b6b7a]">
            <Key size={32} className="mx-auto mb-3 opacity-30" />
            <p>Nog geen API-sleutels aangemaakt</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-4 border border-white/8 rounded-xl hover:border-slate-300 transition-colors">
                <div>
                  <p className="font-semibold text-white">{key.name}</p>
                  <code className="text-xs font-mono text-[#6b6b7a]">{key.key_prefix}•••••••••••••••••••</code>
                  <p className="text-xs text-[#6b6b7a] mt-0.5">
                    Aangemaakt: {formatDateTime(key.created_at)}
                    {key.last_used_at && ` · Laatst gebruikt: ${formatDateTime(key.last_used_at)}`}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirm(key.id)}
                  className="p-2 text-[#6b6b7a] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                  title="Intrekken"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e2a] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">API sleutel intrekken?</h3>
            <p className="text-[#6b6b7a] text-sm mb-6">Apps die deze sleutel gebruiken kunnen niet meer inloggen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-white/8 rounded-xl text-[#a0a0b0] font-medium">
                Annuleren
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">
                Intrekken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
