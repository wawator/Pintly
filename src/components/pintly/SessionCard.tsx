'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, differenceInMinutes } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MapPin, Clock, Beer, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DRINK_TYPES } from '@/types'
import type { DrinkType } from '@/types'

interface SessionCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
  currentUserId: string
}

export function SessionCard({ session, currentUserId }: SessionCardProps) {
  const [capsCount, setCapsCount] = useState(session.caps?.[0]?.count ?? 0)
  const [capped, setCapped] = useState(false)
  const profile = session.profiles
  const username = profile?.username || profile?.full_name || 'Anonyme'
  const drinkCount = session.drinks?.[0]?.count ?? 0
  const isActive = !session.ended_at
  const duration = session.ended_at
    ? differenceInMinutes(new Date(session.ended_at), new Date(session.started_at))
    : differenceInMinutes(new Date(), new Date(session.started_at))

  async function handleCap() {
    if (capped || session.user_id === currentUserId) return
    const supabase = createClient()
    const { error } = await supabase.from('caps').insert({
      session_id: session.id,
      user_id: currentUserId,
    })
    if (!error) {
      setCapsCount((c: number) => c + 1)
      setCapped(true)
    }
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-base font-bold text-[#FC4C02]">
            {username[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">{username}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(session.started_at), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
        {isActive && (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] animate-pulse">
            En cours
          </Badge>
        )}
      </div>

      {/* Bar name */}
      <div className="mb-3">
        <p className="font-black text-base">{session.bar_name}</p>
        {session.bar_location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {session.bar_location}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3 bg-muted/40 rounded-lg p-2">
        <div className="text-center">
          <p className="text-lg font-black">{drinkCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Verres</p>
        </div>
        <div className="text-center border-x">
          <p className="text-lg font-black">{Math.floor(duration / 60)}h{String(duration % 60).padStart(2, '0')}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Durée</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black">{drinkCount > 0 && duration > 0 ? Math.round(duration / drinkCount) : '—'}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Min/verre</p>
        </div>
      </div>

      {/* Drink types */}
      {session.drink_types && session.drink_types.length > 0 && (
        <div className="flex gap-1 mb-3 flex-wrap">
          {session.drink_types.map((t: DrinkType) => (
            <span key={t} className="text-base">{DRINK_TYPES[t]?.emoji}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <button
          onClick={handleCap}
          disabled={session.user_id === currentUserId}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            capped ? 'text-[#FC4C02]' : 'text-muted-foreground hover:text-[#FC4C02]'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span className="text-base">{capped ? '🍺' : '🤍'}</span>
          <span>{capsCount} Caps</span>
        </button>
        <Link href={`/session/${session.id}`} className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
          Détails <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  )
}
