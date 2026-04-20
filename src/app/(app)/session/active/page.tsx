'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DRINK_TYPES } from '@/types'
import type { DrinkType, Drink } from '@/types'
import { Square, Plus, Timer, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { awardBadges } from '@/lib/actions/award-badges'
import { BADGES } from '@/lib/badges'

function ActiveSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null)
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [drinkTimer, setDrinkTimer] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [ending, setEnding] = useState(false)

  const loadSession = useCallback(async () => {
    if (!sessionId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('sessions')
      .select('*, drinks(*)')
      .eq('id', sessionId)
      .single()
    if (data) {
      setSession(data)
      setDrinks(data.drinks || [])
    }
    setLoading(false)
  }, [sessionId])

  useEffect(() => { loadSession() }, [loadSession])

  // Elapsed timer
  useEffect(() => {
    if (!session?.started_at) return
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
      setElapsed(secs)
    }, 1000)
    return () => clearInterval(interval)
  }, [session?.started_at])

  // Per-drink timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setDrinkTimer(prev => {
        const updated: Record<string, number> = {}
        drinks.filter(d => !d.finished_at).forEach(d => {
          updated[d.id] = Math.floor((now - new Date(d.started_at).getTime()) / 1000)
        })
        return { ...prev, ...updated }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [drinks])

  function formatTime(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  async function addDrink(type: DrinkType) {
    const supabase = createClient()
    const { data } = await supabase
      .from('drinks')
      .insert({
        session_id: sessionId,
        type,
        name: DRINK_TYPES[type].label,
        started_at: new Date().toISOString(),
        volume_ml: DRINK_TYPES[type].defaultVolume,
      })
      .select()
      .single()
    if (data) setDrinks(d => [...d, data])
  }

  async function finishDrink(drinkId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('drinks')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', drinkId)
      .select()
      .single()
    if (data) setDrinks(d => d.map(x => x.id === drinkId ? data : x))
  }

  async function endSession() {
    setEnding(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (user) {
      const newBadges = await awardBadges(user.id)
      newBadges.forEach(badgeId => {
        const badge = BADGES[badgeId]
        toast.success(`Badge débloqué !`, {
          description: `${badge.emoji} ${badge.name} — ${badge.description}`,
          duration: 5000,
        })
      })
    }

    router.push(`/session/${sessionId}`)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>
  if (!session) return <div className="text-center py-16 text-muted-foreground">Session introuvable</div>

  const activeDrinks = drinks.filter(d => !d.finished_at)
  const finishedDrinks = drinks.filter(d => d.finished_at)

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Session header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] animate-pulse">Live</Badge>
          </div>
          <h1 className="text-xl font-black">{session.bar_name}</h1>
          {session.bar_location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {session.bar_location}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tabular-nums text-[#FC4C02]">{formatTime(elapsed)}</div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-0.5 justify-end">
            <Timer className="w-3 h-3" /> Durée
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Verres', value: drinks.length },
          { label: 'En cours', value: activeDrinks.length },
          { label: 'Terminés', value: finishedDrinks.length },
        ].map(({ label, value }) => (
          <Card key={label} className="p-3 text-center">
            <p className="text-2xl font-black">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          </Card>
        ))}
      </div>

      {/* Add drink */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Ajouter un verre</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(DRINK_TYPES) as [DrinkType, typeof DRINK_TYPES[DrinkType]][]).map(([type, { label, emoji }]) => (
            <button
              key={type}
              onClick={() => addDrink(type)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border bg-white hover:border-[#FC4C02] hover:bg-orange-50 transition-colors"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active drinks */}
      {activeDrinks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">En train de boire</p>
          <div className="space-y-2">
            {activeDrinks.map(drink => (
              <Card key={drink.id} className="p-3 flex items-center justify-between border-[#FC4C02]/30">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{DRINK_TYPES[drink.type]?.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold">{drink.name}</p>
                    <p className="text-xs text-[#FC4C02] font-mono font-bold">
                      {formatTime(drinkTimer[drink.id] ?? 0)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-[#FC4C02] text-[#FC4C02] hover:bg-orange-50"
                  onClick={() => finishDrink(drink.id)}
                >
                  Terminé ✓
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Finished drinks */}
      {finishedDrinks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Verres terminés ({finishedDrinks.length})</p>
          <div className="space-y-1.5">
            {finishedDrinks.map(drink => {
              const duration = drink.finished_at
                ? Math.floor((new Date(drink.finished_at).getTime() - new Date(drink.started_at).getTime()) / 1000)
                : null
              return (
                <div key={drink.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border opacity-70">
                  <span className="text-base">{DRINK_TYPES[drink.type]?.emoji}</span>
                  <span className="text-sm flex-1">{drink.name}</span>
                  {duration !== null && (
                    <span className="text-xs text-muted-foreground font-mono">{formatTime(duration)}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* End session */}
      <Button
        className="w-full bg-foreground hover:bg-foreground/80 text-background font-bold gap-2"
        size="lg"
        onClick={endSession}
        disabled={ending}
      >
        <Square className="w-4 h-4" />
        {ending ? 'Fin de session...' : 'Terminer la session'}
      </Button>
    </div>
  )
}

export default function ActiveSessionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>}>
      <ActiveSessionContent />
    </Suspense>
  )
}
