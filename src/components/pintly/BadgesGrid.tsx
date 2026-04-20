import { BADGES, TIER_COLORS, type BadgeId } from '@/lib/badges'
import { cn } from '@/lib/utils'

interface BadgesGridProps {
  earnedIds: BadgeId[]
}

export function BadgesGrid({ earnedIds }: BadgesGridProps) {
  const earned = new Set(earnedIds)
  const allBadges = Object.values(BADGES)

  return (
    <div className="grid grid-cols-3 gap-3">
      {allBadges.map(badge => {
        const isEarned = earned.has(badge.id)
        return (
          <div
            key={badge.id}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all',
              isEarned
                ? TIER_COLORS[badge.tier]
                : 'bg-muted/30 border-muted text-muted-foreground opacity-40 grayscale'
            )}
          >
            <span className={cn('text-2xl', !isEarned && 'opacity-30')}>{badge.emoji}</span>
            <p className={cn('text-xs font-bold leading-tight', !isEarned && 'opacity-50')}>
              {badge.name}
            </p>
            {isEarned && (
              <span className={cn(
                'text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide',
                badge.tier === 'bronze' && 'bg-amber-200 text-amber-900',
                badge.tier === 'silver' && 'bg-slate-200 text-slate-700',
                badge.tier === 'gold' && 'bg-yellow-200 text-yellow-900',
                badge.tier === 'platinum' && 'bg-purple-200 text-purple-900',
              )}>
                {badge.tier}
              </span>
            )}
            {!isEarned && (
              <p className="text-[9px] opacity-40">{badge.description}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
