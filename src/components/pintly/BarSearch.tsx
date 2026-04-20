'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { MapPin, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Bar {
  id: string
  name: string
  city: string | null
  address: string | null
}

interface BarSearchProps {
  onSelect: (bar: Bar) => void
  selectedBar: Bar | null
}

export function BarSearch({ onSelect, selectedBar }: BarSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Bar[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [city, setCity] = useState('')
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedBar) {
      setQuery(selectedBar.name)
      setOpen(false)
    }
  }, [selectedBar])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('bars')
        .select('id, name, city, address')
        .ilike('name', `%${query}%`)
        .limit(6)
      setResults(data || [])
      setLoading(false)
      setOpen(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowCreate(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleCreate() {
    if (!query.trim()) return
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('bars')
      .insert({ name: query.trim(), city: city.trim() || null, created_by: user?.id })
      .select()
      .single()
    if (!error && data) {
      onSelect(data)
      setOpen(false)
      setShowCreate(false)
    }
    setCreating(false)
  }

  if (selectedBar) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#FC4C02] bg-orange-50 cursor-pointer"
        onClick={() => { onSelect(null as unknown as Bar); setQuery(''); setOpen(false) }}
      >
        <MapPin className="w-4 h-4 text-[#FC4C02] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{selectedBar.name}</p>
          {selectedBar.city && <p className="text-xs text-muted-foreground">{selectedBar.city}</p>}
        </div>
        <span className="text-xs text-[#FC4C02] font-medium shrink-0">Changer</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cherche un bar..."
          value={query}
          onChange={e => { setQuery(e.target.value); setShowCreate(false) }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="pl-9"
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border shadow-lg overflow-hidden">
          {results.length > 0 && (
            <ul>
              {results.map(bar => (
                <li
                  key={bar.id}
                  onClick={() => onSelect(bar)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 cursor-pointer border-b last:border-0"
                >
                  <span className="text-base">🍺</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{bar.name}</p>
                    {bar.city && <p className="text-xs text-muted-foreground">{bar.city}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Create new bar */}
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-[#FC4C02] hover:bg-orange-50 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter &quot;{query}&quot; comme nouveau bar
            </button>
          ) : (
            <div className="p-3 border-t bg-orange-50 space-y-2">
              <p className="text-xs font-semibold text-[#FC4C02]">Nouveau bar : <span className="text-foreground">{query}</span></p>
              <Input
                placeholder="Ville (ex: Paris)"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="text-sm h-8"
              />
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-[#FC4C02] text-white rounded-lg py-1.5 text-sm font-bold hover:bg-[#e04400] disabled:opacity-50"
              >
                {creating ? 'Création...' : 'Créer et sélectionner'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
