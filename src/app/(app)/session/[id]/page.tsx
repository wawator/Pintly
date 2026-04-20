import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MapPin, Clock, Trophy, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DRINK_TYPES } from '@/types'
import type { DrinkType } from '@/types'
import Link from 'next/link'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*, profiles:user_id(username, full_name), drinks(*), caps(count)')
    .eq('id', id)
    .single()

  if (!session) notFound()

  const drinks = session.drinks || []
  const duration = session.ended_at
    ? differenceInMinutes(new Date(session.ended_at), new Date(session.started_at))
    : null

  // Find fastest drink
  const finishedDrinks = drinks.filter((d: { finished_at: string | null }) => d.finished_at)
  const fastestDrink = finishedDrinks.reduce((fastest: typeof drinks[0] | null, d: typeof drinks[0]) => {
    const secs = differenceInSeconds(new Date(d.finished_at!), new Date(d.started_at))
    if (!fastest) return d
    const fastestSecs = differenceInSeconds(new Date(fastest.finished_at!), new Date(fastest.started_at))
    return secs < fastestSecs ? d : fastest
  }, null)

  const drinkTypeCounts = drinks.reduce((acc: Record<string, number>, d: { type: DrinkType }) => {
    acc[d.type] = (acc[d.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-[#FC4C02]">
            {(session.profiles?.username || session.profiles?.full_name || '?')[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium">{session.profiles?.username || session.profiles?.full_name}</span>
        </div>
        {session.bar_id ? (
          <Link href={`/bar/${session.bar_id}`} className="group flex items-center gap-1 w-fit">
            <h1 className="text-2xl font-black group-hover:text-[#FC4C02] transition-colors">{session.bar_name}</h1>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#FC4C02] transition-colors mt-0.5" />
          </Link>
        ) : (
          <h1 className="text-2xl font-black">{session.bar_name}</h1>
        )}
        {session.bar_location && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" /> {session.bar_location}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(session.started_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Verres', value: drinks.length, icon: '🍺' },
          { label: 'Durée', value: duration !== null ? `${Math.floor(duration / 60)}h${String(duration % 60).padStart(2, '0')}` : 'Live', icon: '⏱️' },
          { label: 'Caps', value: session.caps?.[0]?.count ?? 0, icon: '🎩' },
          { label: 'Min/verre', value: drinks.length > 0 && duration ? Math.round(duration / drinks.length) : '—', icon: '📊' },
        ].map(({ label, value, icon }) => (
          <Card key={label} className="p-3 text-center">
            <span className="text-lg block">{icon}</span>
            <p className="text-base font-black leading-tight">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          </Card>
        ))}
      </div>

      {/* Fastest drink PR */}
      {fastestDrink && (
        <Card className="p-4 border-[#FC4C02]/30 bg-orange-50">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-[#FC4C02]" />
            <span className="text-sm font-bold text-[#FC4C02]">Record de la soirée</span>
          </div>
          <p className="text-sm">
            <span className="font-bold">{DRINK_TYPES[fastestDrink.type as DrinkType]?.emoji} {fastestDrink.name}</span>{' '}
            bu en{' '}
            <span className="font-black text-[#FC4C02]">
              {(() => {
                const secs = differenceInSeconds(new Date(fastestDrink.finished_at!), new Date(fastestDrink.started_at))
                const m = Math.floor(secs / 60)
                const s = secs % 60
                return m > 0 ? `${m}m${s}s` : `${s}s`
              })()}
            </span>
          </p>
        </Card>
      )}

      {/* Drink breakdown */}
      {Object.keys(drinkTypeCounts).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Composition</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(drinkTypeCounts) as [DrinkType, number][]).map(([type, count]) => (
              <Card key={type} className="p-3 text-center">
                <span className="text-xl">{DRINK_TYPES[type]?.emoji}</span>
                <p className="font-black text-base">{count}</p>
                <p className="text-[10px] text-muted-foreground">{DRINK_TYPES[type]?.label}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Drink timeline */}
      {drinks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Chronologie</p>
          <div className="space-y-2">
            {drinks.map((drink: { id: string; type: DrinkType; name: string; started_at: string; finished_at: string | null }, i: number) => {
              const secs = drink.finished_at
                ? differenceInSeconds(new Date(drink.finished_at), new Date(drink.started_at))
                : null
              return (
                <div key={drink.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <span className="text-muted-foreground text-xs w-5 text-right">{i + 1}</span>
                  <span className="text-base">{DRINK_TYPES[drink.type]?.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{drink.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(drink.started_at), 'HH:mm')}
                    </p>
                  </div>
                  {secs !== null && (
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m${secs % 60}s`}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
