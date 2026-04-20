import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Beer, Clock, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { differenceInMinutes, differenceInSeconds, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DRINK_TYPES } from '@/types'
import type { DrinkType } from '@/types'
import { SignOutButton } from '@/components/pintly/SignOutButton'
import { BadgesGrid } from '@/components/pintly/BadgesGrid'
import { RankCard, RankTimeline } from '@/components/pintly/RankCard'
import type { BadgeId } from '@/lib/badges'
import { getRank } from '@/lib/ranks'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const username = user.user_metadata?.username || user.email?.split('@')[0]
  const fullName = user.user_metadata?.full_name || username

  const [{ data: sessions }, { data: userBadges }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, drinks(*), caps(count)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', user.id),
  ])

  const allSessions = sessions || []
  const earnedBadgeIds = (userBadges || []).map(b => b.badge_id as BadgeId)
  const completedSessions = allSessions.filter(s => s.ended_at)

  // Compute stats
  const totalDrinks = allSessions.reduce((acc, s) => acc + (s.drinks?.length || 0), 0)
  const totalSessions = allSessions.length
  const totalMinutes = completedSessions.reduce((acc, s) => {
    return acc + differenceInMinutes(new Date(s.ended_at), new Date(s.started_at))
  }, 0)

  // Best session (most drinks)
  const bestSession = allSessions.reduce((best, s) => {
    return (s.drinks?.length || 0) > (best?.drinks?.length || 0) ? s : best
  }, null as typeof allSessions[0] | null)

  // Fastest drink across all sessions
  let fastestDrink: { name: string; type: DrinkType; secs: number } | null = null
  allSessions.forEach(s => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s.drinks || []).forEach((d: any) => {
      if (!d.finished_at) return
      const secs = differenceInSeconds(new Date(d.finished_at), new Date(d.started_at))
      if (!fastestDrink || secs < fastestDrink.secs) {
        fastestDrink = { name: d.name, type: d.type, secs }
      }
    })
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Profile header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-black text-[#FC4C02]">
            {username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black">{fullName}</h1>
            <p className="text-sm text-muted-foreground">@{username}</p>
            {(() => {
              const rank = getRank(totalSessions)
              return (
                <Badge className={`mt-1 border text-[10px] ${rank.bgColor} ${rank.color}`}>
                  {rank.emoji} {rank.name}
                </Badge>
              )
            })()}
          </div>
        </div>
        <SignOutButton />
      </div>

      {/* Rank */}
      <RankCard sessionCount={totalSessions} />
      <RankTimeline sessionCount={totalSessions} />

      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Beer, label: 'Sessions', value: totalSessions },
          { icon: Zap, label: 'Verres', value: totalDrinks },
          { icon: Clock, label: 'Heures', value: Math.floor(totalMinutes / 60) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-3 text-center">
            <Icon className="w-4 h-4 mx-auto mb-1 text-[#FC4C02]" />
            <p className="text-xl font-black">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          </Card>
        ))}
      </div>

      {/* PRs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-[#FC4C02]" />
          <h2 className="font-black">Personal Records</h2>
        </div>
        <div className="space-y-2">
          {bestSession && (
            <Card className="p-3 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Meilleure session</p>
                <p className="font-bold text-sm">{bestSession.bar_name}</p>
                <p className="text-xs text-muted-foreground">{bestSession.drinks?.length} verres · {format(new Date(bestSession.started_at), 'd MMM yyyy', { locale: fr })}</p>
              </div>
              <Badge className="ml-auto bg-orange-100 text-orange-700 border-orange-200">{bestSession.drinks?.length} 🍺</Badge>
            </Card>
          )}
          {fastestDrink && (() => {
            const fd = fastestDrink as { name: string; type: DrinkType; secs: number }
            return (
              <Card className="p-3 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Verre le + rapide</p>
                  <p className="font-bold text-sm">{DRINK_TYPES[fd.type]?.emoji} {fd.name}</p>
                </div>
                <Badge className="ml-auto bg-orange-100 text-orange-700 border-orange-200">
                  {fd.secs < 60 ? `${fd.secs}s` : `${Math.floor(fd.secs / 60)}m${fd.secs % 60}s`}
                </Badge>
              </Card>
            )
          })()}
          {!bestSession && !fastestDrink && (
            <p className="text-sm text-muted-foreground text-center py-4">Lance ta première session pour débloquer tes PRs !</p>
          )}
        </div>
      </div>

      {/* Sessions history + Badges */}
      <Tabs defaultValue="badges">
        <TabsList className="w-full">
          <TabsTrigger value="badges" className="flex-1">
            Badges ({earnedBadgeIds.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex-1">Sessions ({totalSessions})</TabsTrigger>
        </TabsList>
        <TabsContent value="badges" className="mt-3">
          <BadgesGrid earnedIds={earnedBadgeIds} />
        </TabsContent>
        <TabsContent value="sessions" className="space-y-2 mt-3">
          {allSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune session pour l&apos;instant</p>
          ) : (
            allSessions.map(s => {
              const dur = s.ended_at ? differenceInMinutes(new Date(s.ended_at), new Date(s.started_at)) : null
              return (
                <Card key={s.id} className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-base">🍺</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.bar_name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(s.started_at), 'd MMM yyyy', { locale: fr })}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{s.drinks?.length || 0} 🍺</p>
                    {dur !== null && <p className="text-xs text-muted-foreground">{Math.floor(dur / 60)}h{String(dur % 60).padStart(2, '0')}</p>}
                  </div>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
