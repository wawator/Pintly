'use server'

import { createClient } from '@/lib/supabase/server'
import { checkBadges, type BadgeId } from '@/lib/badges'

export async function awardBadges(userId: string): Promise<BadgeId[]> {
  const supabase = await createClient()

  const [
    { data: sessions },
    { data: friends },
    { data: capsGiven },
    { data: existingBadges },
  ] = await Promise.all([
    supabase
      .from('sessions')
      .select('bar_name, started_at, ended_at, drinks(type, started_at, finished_at)')
      .eq('user_id', userId)
      .not('ended_at', 'is', null),
    supabase
      .from('friendships')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'accepted'),
    supabase
      .from('caps')
      .select('id')
      .eq('user_id', userId),
    supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId),
  ])

  const completedSessions = (sessions || []).map(s => ({
    ...s,
    drinks: (s.drinks || []) as { type: string; started_at: string; finished_at: string | null }[],
  }))

  const totalDrinks = completedSessions.reduce((acc, s) => acc + s.drinks.length, 0)
  const existing = (existingBadges || []).map(b => b.badge_id as BadgeId)

  const newBadges = checkBadges({
    completedSessions,
    totalDrinks,
    friendCount: friends?.length ?? 0,
    capsGiven: capsGiven?.length ?? 0,
    existingBadges: existing,
  })

  if (newBadges.length > 0) {
    await supabase.from('user_badges').insert(
      newBadges.map(badge_id => ({ user_id: userId, badge_id }))
    )
  }

  return newBadges
}
