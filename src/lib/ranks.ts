export interface Rank {
  id: string
  name: string
  emoji: string
  minSessions: number
  color: string
  bgColor: string
}

export const RANKS: Rank[] = [
  { id: 'rookie',       name: 'Rookie',       emoji: '🌱', minSessions: 0,   color: 'text-green-700',  bgColor: 'bg-green-100 border-green-300' },
  { id: 'regular',      name: 'Regular',      emoji: '🍺', minSessions: 5,   color: 'text-blue-700',   bgColor: 'bg-blue-100 border-blue-300' },
  { id: 'veteran',      name: 'Veteran',      emoji: '🥃', minSessions: 15,  color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-300' },
  { id: 'legend',       name: 'Legend',       emoji: '🔥', minSessions: 30,  color: 'text-red-700',    bgColor: 'bg-red-100 border-red-300' },
  { id: 'hall_of_fame', name: 'Hall of Fame', emoji: '👑', minSessions: 50,  color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-300' },
]

export function getRank(sessionCount: number): Rank {
  return [...RANKS].reverse().find(r => sessionCount >= r.minSessions) ?? RANKS[0]
}

export function getNextRank(sessionCount: number): Rank | null {
  return RANKS.find(r => r.minSessions > sessionCount) ?? null
}

export function getRankProgress(sessionCount: number): number {
  const current = getRank(sessionCount)
  const next = getNextRank(sessionCount)
  if (!next) return 100
  const range = next.minSessions - current.minSessions
  const progress = sessionCount - current.minSessions
  return Math.round((progress / range) * 100)
}
