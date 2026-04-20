import { differenceInSeconds, differenceInMinutes, getHours } from 'date-fns'

export type BadgeId =
  | 'first_round'
  | 'night_owl'
  | 'speed_runner'
  | 'iron_liver'
  | 'bar_hopper'
  | 'streak_master'
  | 'century'
  | 'social_butterfly'
  | 'cap_giver'
  | 'legend'
  | 'marathon'
  | 'variety_pack'

export interface BadgeDef {
  id: BadgeId
  name: string
  description: string
  emoji: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export const BADGES: Record<BadgeId, BadgeDef> = {
  first_round: {
    id: 'first_round',
    name: 'First Round',
    description: 'Terminer ta première session',
    emoji: '🍺',
    tier: 'bronze',
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Terminer une session après 2h du matin',
    emoji: '🦉',
    tier: 'silver',
  },
  speed_runner: {
    id: 'speed_runner',
    name: 'Speed Runner',
    description: 'Boire un verre en moins de 30 secondes',
    emoji: '⚡',
    tier: 'gold',
  },
  iron_liver: {
    id: 'iron_liver',
    name: 'Iron Liver',
    description: '10 sessions complétées',
    emoji: '🛡️',
    tier: 'silver',
  },
  bar_hopper: {
    id: 'bar_hopper',
    name: 'Bar Hopper',
    description: 'Visiter 5 bars différents',
    emoji: '🗺️',
    tier: 'silver',
  },
  streak_master: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Sessions 3 weekends de suite',
    emoji: '🔥',
    tier: 'gold',
  },
  century: {
    id: 'century',
    name: 'Century',
    description: '100 verres au total',
    emoji: '💯',
    tier: 'gold',
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Avoir 3 amis sur Pintly',
    emoji: '🦋',
    tier: 'bronze',
  },
  cap_giver: {
    id: 'cap_giver',
    name: 'Cap Giver',
    description: 'Donner 10 Caps à des amis',
    emoji: '🎩',
    tier: 'bronze',
  },
  legend: {
    id: 'legend',
    name: 'Legend',
    description: '50 sessions complétées',
    emoji: '👑',
    tier: 'platinum',
  },
  marathon: {
    id: 'marathon',
    name: 'Marathon',
    description: 'Session de plus de 5 heures',
    emoji: '🏃',
    tier: 'gold',
  },
  variety_pack: {
    id: 'variety_pack',
    name: 'Variety Pack',
    description: 'Boire 4 types de boissons différents en une session',
    emoji: '🎨',
    tier: 'silver',
  },
}

export const TIER_COLORS: Record<BadgeDef['tier'], string> = {
  bronze: 'bg-amber-100 border-amber-300 text-amber-800',
  silver: 'bg-slate-100 border-slate-300 text-slate-700',
  gold: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  platinum: 'bg-purple-100 border-purple-300 text-purple-800',
}

// Returns list of newly earned badge IDs given user's full stats
export function checkBadges(stats: {
  completedSessions: { bar_name: string; started_at: string; ended_at: string; drinks: { type: string; started_at: string; finished_at: string | null }[] }[]
  totalDrinks: number
  friendCount: number
  capsGiven: number
  existingBadges: BadgeId[]
}): BadgeId[] {
  const { completedSessions, totalDrinks, friendCount, capsGiven, existingBadges } = stats
  const earned = new Set(existingBadges)
  const newBadges: BadgeId[] = []

  function check(id: BadgeId, condition: boolean) {
    if (condition && !earned.has(id)) newBadges.push(id)
  }

  check('first_round', completedSessions.length >= 1)
  check('iron_liver', completedSessions.length >= 10)
  check('legend', completedSessions.length >= 50)
  check('century', totalDrinks >= 100)
  check('social_butterfly', friendCount >= 3)
  check('cap_giver', capsGiven >= 10)

  // Night owl — any session ending after 2am
  check('night_owl', completedSessions.some(s => getHours(new Date(s.ended_at)) >= 2 && getHours(new Date(s.ended_at)) < 6))

  // Speed runner — any drink finished in under 30s
  check('speed_runner', completedSessions.some(s =>
    s.drinks.some(d => {
      if (!d.finished_at) return false
      return differenceInSeconds(new Date(d.finished_at), new Date(d.started_at)) < 30
    })
  ))

  // Bar hopper — 5 unique bars
  const uniqueBars = new Set(completedSessions.map(s => s.bar_name.toLowerCase().trim()))
  check('bar_hopper', uniqueBars.size >= 5)

  // Marathon — session > 5h
  check('marathon', completedSessions.some(s =>
    differenceInMinutes(new Date(s.ended_at), new Date(s.started_at)) >= 300
  ))

  // Variety pack — 4 different drink types in one session
  check('variety_pack', completedSessions.some(s => {
    const types = new Set(s.drinks.map(d => d.type))
    return types.size >= 4
  }))

  // Streak master — sessions on 3 consecutive weekends
  const weekendDates = completedSessions
    .filter(s => {
      const day = new Date(s.started_at).getDay()
      return day === 0 || day === 5 || day === 6
    })
    .map(s => {
      const d = new Date(s.started_at)
      // Week number (Mon-based)
      const dayOfWeek = (d.getDay() + 6) % 7
      const monday = new Date(d)
      monday.setDate(d.getDate() - dayOfWeek)
      return Math.floor(monday.getTime() / (7 * 24 * 60 * 60 * 1000))
    })
  const uniqueWeeks = [...new Set(weekendDates)].sort((a, b) => a - b)
  let streakCount = 1
  for (let i = 1; i < uniqueWeeks.length; i++) {
    if (uniqueWeeks[i] - uniqueWeeks[i - 1] === 1) {
      streakCount++
      if (streakCount >= 3) break
    } else {
      streakCount = 1
    }
  }
  check('streak_master', streakCount >= 3)

  return newBadges
}
