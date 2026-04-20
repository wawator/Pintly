import { getRank, getNextRank, getRankProgress, RANKS } from '@/lib/ranks'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function RankCard({ sessionCount }: { sessionCount: number }) {
  const current = getRank(sessionCount)
  const next = getNextRank(sessionCount)
  const progress = getRankProgress(sessionCount)

  return (
    <div className={cn('rounded-xl border-2 p-4', current.bgColor)}>
      {/* Current rank */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Rang actuel</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xl">{current.emoji}</span>
            <span className={cn('text-xl font-black', current.color)}>{current.name}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black">{sessionCount}</p>
          <p className="text-xs opacity-60">sessions</p>
        </div>
      </div>

      {/* Progress to next rank */}
      {next ? (
        <div>
          <div className="flex justify-between text-xs mb-1.5 opacity-70">
            <span>{current.name}</span>
            <span>{next.emoji} {next.name} dans {next.minSessions - sessionCount} session{next.minSessions - sessionCount > 1 ? 's' : ''}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ) : (
        <p className={cn('text-sm font-bold text-center', current.color)}>
          👑 Rang maximum atteint — tu es une légende
        </p>
      )}
    </div>
  )
}

export function RankTimeline({ sessionCount }: { sessionCount: number }) {
  const current = getRank(sessionCount)
  return (
    <div className="flex items-center justify-between px-1">
      {RANKS.map((rank, i) => {
        const reached = sessionCount >= rank.minSessions
        const isCurrent = rank.id === current.id
        return (
          <div key={rank.id} className="flex flex-col items-center gap-1 flex-1">
            {i < RANKS.length - 1 && (
              <div className="relative w-full flex items-center">
                <div className={cn(
                  'absolute left-1/2 right-0 h-0.5 top-3 z-0',
                  reached && RANKS[i + 1] && sessionCount >= RANKS[i + 1].minSessions
                    ? 'bg-[#FC4C02]' : 'bg-muted'
                )} />
              </div>
            )}
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 z-10 relative',
              reached ? 'border-[#FC4C02] bg-white' : 'border-muted bg-muted/50',
              isCurrent && 'ring-2 ring-[#FC4C02] ring-offset-1'
            )}>
              <span className={reached ? '' : 'grayscale opacity-40'}>{rank.emoji}</span>
            </div>
            <span className={cn(
              'text-[9px] font-semibold text-center leading-tight',
              reached ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {rank.name}
            </span>
            <span className="text-[8px] text-muted-foreground">{rank.minSessions}+</span>
          </div>
        )
      })}
    </div>
  )
}
