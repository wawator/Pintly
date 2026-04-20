export type DrinkType = 'beer' | 'wine' | 'shot' | 'cocktail' | 'cider' | 'other'

export interface User {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  bar_name: string
  bar_location: string | null
  started_at: string
  ended_at: string | null
  notes: string | null
  user?: User
  drinks?: Drink[]
  caps_count?: number
  user_capped?: boolean
}

export interface Drink {
  id: string
  session_id: string
  type: DrinkType
  name: string
  started_at: string
  finished_at: string | null
  volume_ml: number
}

export interface Cap {
  id: string
  session_id: string
  user_id: string
  created_at: string
  user?: User
}

export interface PersonalRecord {
  id: string
  user_id: string
  record_type: 'fastest_drink' | 'most_drinks_session' | 'longest_session' | 'most_sessions_week'
  value: number
  session_id: string | null
  drink_id: string | null
  achieved_at: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted'
  created_at: string
  friend?: User
}

export const DRINK_TYPES: Record<DrinkType, { label: string; emoji: string; defaultVolume: number }> = {
  beer: { label: 'Bière', emoji: '🍺', defaultVolume: 330 },
  wine: { label: 'Vin', emoji: '🍷', defaultVolume: 150 },
  shot: { label: 'Shot', emoji: '🥃', defaultVolume: 40 },
  cocktail: { label: 'Cocktail', emoji: '🍹', defaultVolume: 200 },
  cider: { label: 'Cidre', emoji: '🍎', defaultVolume: 330 },
  other: { label: 'Autre', emoji: '🥤', defaultVolume: 250 },
}
