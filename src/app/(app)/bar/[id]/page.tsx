import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MapPin, Users, Beer, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { differenceInMinutes, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

export default async function BarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: bar } = await supabase
    .from('bars')
    .select('*')
    .eq('id', id)
    .single()

  if (!bar) notFound()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, profiles:user_id(id, username, full_name), drinks(count)')
    .eq('bar_id', id)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })

  const allSessions = sessions || []

  // Stats globales du bar
  const totalVisits = allSessions.length
  const totalDrinks = allSessions.reduce((acc, s) => acc + (s.drinks?.[0]?.count ?? 0), 0)
  const uniqueVisitors = new Set(allSessions.map(s => s.user_id)).size

  // Record du bar — session avec le plus de verres
  const recordSession = allSessions.reduce((best, s) => {
    return (s.drinks?.[0]?.count ?? 0) > (best?.drinks?.[0]?.count ?? 0) ? s : best
  }, null as typeof allSessions[0] | null)

  // Classement par nombre de verres en une session
  const leaderboard = [...allSessions]
    .sort((a, b) => (b.drinks?.[0]?.count ?? 0) - (a.drinks?.[0]?.count ?? 0))
    .slice(0, 10)

  // Habitués — les users avec le plus de sessions dans ce bar
  const visitsByUser: Record<string, { username: string; count: number }> = {}
  allSessions.forEach(s => {
    const uid = s.profiles?.id
    if (!uid) return
    if (!visitsByUser[uid]) visitsByUser[uid] = { username: s.profiles?.username || '?', count: 0 }
    visitsByUser[uid].count++
  })
  const regulars = Object.values(visitsByUser).sort((a, b) => b.count - a.count).slice(0, 3)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
      {/* Header bar */}
      <div>
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl mb-3">🍺</div>
        <h1 className="text-2xl font-black">{bar.name}</h1>
        {bar.city && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" /> {bar.city}
          </p>
        )}
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: '📍', label: 'Visites', value: totalVisits },
          { emoji: '🍺', label: 'Verres', value: totalDrinks },
          { emoji: '👤', label: 'Clients', value: uniqueVisitors },
        ].map(({ emoji, label, value }) => (
          <Card key={label} className="p-3 text-center">
            <span className="text-xl block">{emoji}</span>
            <p className="text-xl font-black">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          </Card>
        ))}
      </div>

      {/* Record du bar */}
      {recordSession && (
        <Card className="p-4 border-[#FC4C02]/30 bg-orange-50">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-[#FC4C02]" />
            <span className="text-sm font-bold text-[#FC4C02]">Record du bar</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{recordSession.profiles?.username}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(recordSession.started_at), 'd MMM yyyy', { locale: fr })}
              </p>
            </div>
            <Badge className="bg-orange-200 text-orange-900 border-orange-300 font-black text-base px-3 py-1">
              {recordSession.drinks?.[0]?.count ?? 0} 🍺
            </Badge>
          </div>
        </Card>
      )}

      {/* Habitués */}
      {regulars.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Habitués
          </p>
          <div className="flex gap-2">
            {regulars.map((r, i) => (
              <div key={r.username} className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/40 border">
                <span>{medals[i]}</span>
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-[#FC4C02]">
                  {r.username[0].toUpperCase()}
                </div>
                <p className="text-xs font-semibold truncate max-w-full">{r.username}</p>
                <p className="text-[10px] text-muted-foreground">{r.count} visites</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classement sessions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" /> Classement — max verres en une soirée
        </p>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Pas encore de sessions terminées ici</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((s, i) => {
              const dur = differenceInMinutes(new Date(s.ended_at), new Date(s.started_at))
              return (
                <Link key={s.id} href={`/session/${s.id}`}>
                  <Card className="p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                    <span className="text-lg w-7 text-center">{medals[i] ?? `${i + 1}`}</span>
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-[#FC4C02] shrink-0">
                      {(s.profiles?.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.profiles?.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(s.started_at), 'd MMM yyyy', { locale: fr })} · {Math.floor(dur / 60)}h{String(dur % 60).padStart(2, '0')}
                      </p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-black shrink-0">
                      {s.drinks?.[0]?.count ?? 0} 🍺
                    </Badge>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
