import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { differenceInMinutes } from 'date-fns'
import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: sessions }, { data: bars }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, profiles:user_id(id, username, full_name), drinks(count)')
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false }),
    supabase
      .from('bars')
      .select('id, name, city'),
  ])

  const allSessions = sessions || []
  const allBars = bars || []

  // --- USER RANKINGS ---

  // Most drinks in a single session
  const topDrinks = [...allSessions]
    .sort((a, b) => (b.drinks?.[0]?.count ?? 0) - (a.drinks?.[0]?.count ?? 0))
    .slice(0, 10)

  // Most sessions per user
  const sessionsByUser: Record<string, { username: string; count: number }> = {}
  allSessions.forEach(s => {
    const uid = s.profiles?.id
    if (!uid) return
    if (!sessionsByUser[uid]) sessionsByUser[uid] = { username: s.profiles?.username || '?', count: 0 }
    sessionsByUser[uid].count++
  })
  const topSessions = Object.values(sessionsByUser).sort((a, b) => b.count - a.count).slice(0, 10)

  // Longest session
  const topDuration = [...allSessions]
    .map(s => ({ ...s, duration: differenceInMinutes(new Date(s.ended_at), new Date(s.started_at)) }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10)

  // --- BAR RANKINGS ---

  // Aggregate stats per bar
  const barStats: Record<string, {
    id: string
    name: string
    city: string | null
    sessions: number
    totalDrinks: number
    uniqueVisitors: Set<string>
    recordDrinks: number
  }> = {}

  allSessions.forEach(s => {
    if (!s.bar_id) return
    if (!barStats[s.bar_id]) {
      const barInfo = allBars.find(b => b.id === s.bar_id)
      barStats[s.bar_id] = {
        id: s.bar_id,
        name: s.bar_name,
        city: barInfo?.city ?? null,
        sessions: 0,
        totalDrinks: 0,
        uniqueVisitors: new Set(),
        recordDrinks: 0,
      }
    }
    const drinks = s.drinks?.[0]?.count ?? 0
    barStats[s.bar_id].sessions++
    barStats[s.bar_id].totalDrinks += drinks
    barStats[s.bar_id].uniqueVisitors.add(s.profiles?.id)
    if (drinks > barStats[s.bar_id].recordDrinks) barStats[s.bar_id].recordDrinks = drinks
  })

  const barList = Object.values(barStats)

  const topBarsByVisits = [...barList].sort((a, b) => b.sessions - a.sessions).slice(0, 10)
  const topBarsByDrinks = [...barList].sort((a, b) => b.totalDrinks - a.totalDrinks).slice(0, 10)
  const topBarsByRecord = [...barList].sort((a, b) => b.recordDrinks - a.recordDrinks).slice(0, 10)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-black">Classement 🏆</h1>

      <Tabs defaultValue="bars-visits">
        <TabsList className="grid grid-cols-2 w-full mb-1">
          <TabsTrigger value="bars-visits" className="text-xs">🍺 Bars</TabsTrigger>
          <TabsTrigger value="users-drinks" className="text-xs">👤 Joueurs</TabsTrigger>
        </TabsList>

        {/* ── BARS ── */}
        <Tabs defaultValue="bars-visits">
          <TabsList className="w-full">
            <TabsTrigger value="bars-visits" className="flex-1 text-xs">Visites</TabsTrigger>
            <TabsTrigger value="bars-drinks" className="flex-1 text-xs">Verres total</TabsTrigger>
            <TabsTrigger value="bars-record" className="flex-1 text-xs">Record</TabsTrigger>
          </TabsList>

          <TabsContent value="bars-visits" className="space-y-2 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Bars les plus visités</p>
            {topBarsByVisits.length === 0
              ? <EmptyBars />
              : topBarsByVisits.map((bar, i) => (
                <BarRow key={bar.id} bar={bar} rank={i} medal={medals[i]} value={`${bar.sessions} sessions`} sub={`${bar.uniqueVisitors.size} clients`} />
              ))}
          </TabsContent>

          <TabsContent value="bars-drinks" className="space-y-2 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Bars avec le plus de verres consommés au total</p>
            {topBarsByDrinks.length === 0
              ? <EmptyBars />
              : topBarsByDrinks.map((bar, i) => (
                <BarRow key={bar.id} bar={bar} rank={i} medal={medals[i]} value={`${bar.totalDrinks} 🍺`} sub={`${bar.sessions} sessions`} />
              ))}
          </TabsContent>

          <TabsContent value="bars-record" className="space-y-2 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Record absolu — max verres en une seule soirée</p>
            {topBarsByRecord.length === 0
              ? <EmptyBars />
              : topBarsByRecord.map((bar, i) => (
                <BarRow key={bar.id} bar={bar} rank={i} medal={medals[i]} value={`${bar.recordDrinks} 🍺`} sub="record soirée" />
              ))}
          </TabsContent>
        </Tabs>

        {/* ── JOUEURS ── */}
        <Tabs defaultValue="users-drinks">
          <TabsList className="w-full">
            <TabsTrigger value="users-drinks" className="flex-1 text-xs">Max verres</TabsTrigger>
            <TabsTrigger value="users-sessions" className="flex-1 text-xs">Sessions</TabsTrigger>
            <TabsTrigger value="users-duration" className="flex-1 text-xs">Durée</TabsTrigger>
          </TabsList>

          <TabsContent value="users-drinks" className="space-y-2 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Plus grand nombre de verres en une seule session</p>
            {topDrinks.map((s, i) => (
              <Card key={s.id} className="p-3 flex items-center gap-3">
                <span className="text-lg w-7 text-center">{medals[i] || i + 1}</span>
                <Avatar username={s.profiles?.username} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{s.profiles?.username}</p>
                  {s.bar_id
                    ? <Link href={`/bar/${s.bar_id}`} className="text-xs text-[#FC4C02] hover:underline truncate block">{s.bar_name}</Link>
                    : <p className="text-xs text-muted-foreground truncate">{s.bar_name}</p>
                  }
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-black shrink-0">
                  {s.drinks?.[0]?.count ?? 0} 🍺
                </Badge>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="users-sessions" className="space-y-2 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Nombre total de sessions complétées</p>
            {topSessions.map((s, i) => (
              <Card key={s.username} className="p-3 flex items-center gap-3">
                <span className="text-lg w-7 text-center">{medals[i] || i + 1}</span>
                <Avatar username={s.username} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">@{s.username}</p>
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-black">{s.count} sessions</Badge>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="users-duration" className="space-y-2 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Session la plus longue</p>
            {topDuration.map((s, i) => (
              <Card key={s.id} className="p-3 flex items-center gap-3">
                <span className="text-lg w-7 text-center">{medals[i] || i + 1}</span>
                <Avatar username={s.profiles?.username} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{s.profiles?.username}</p>
                  {s.bar_id
                    ? <Link href={`/bar/${s.bar_id}`} className="text-xs text-[#FC4C02] hover:underline truncate block">{s.bar_name}</Link>
                    : <p className="text-xs text-muted-foreground truncate">{s.bar_name}</p>
                  }
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-black shrink-0">
                  {Math.floor(s.duration / 60)}h{String(s.duration % 60).padStart(2, '0')}
                </Badge>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </Tabs>
    </div>
  )
}

function Avatar({ username }: { username?: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-[#FC4C02] shrink-0">
      {(username || '?')[0].toUpperCase()}
    </div>
  )
}

function BarRow({ bar, rank, medal, value, sub }: {
  bar: { id: string; name: string; city: string | null }
  rank: number
  medal?: string
  value: string
  sub: string
}) {
  return (
    <Link href={`/bar/${bar.id}`}>
      <Card className="p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
        <span className="text-lg w-7 text-center">{medal || rank + 1}</span>
        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-base shrink-0">🍺</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{bar.name}</p>
          {bar.city && (
            <p className="text-xs text-muted-foreground flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />{bar.city}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-black text-sm text-[#FC4C02]">{value}</p>
          <p className="text-[10px] text-muted-foreground">{sub}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </Card>
    </Link>
  )
}

function EmptyBars() {
  return (
    <div className="text-center py-10">
      <span className="text-4xl block mb-2">🍺</span>
      <p className="text-sm text-muted-foreground">Démarre une session dans un bar pour le voir apparaître ici !</p>
    </div>
  )
}
