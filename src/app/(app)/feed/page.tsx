import { createClient } from '@/lib/supabase/server'
import { SessionCard } from '@/components/pintly/SessionCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch sessions from user + friends
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      profiles:user_id (id, username, full_name, avatar_url),
      drinks (count),
      caps (count)
    `)
    .order('started_at', { ascending: false })
    .limit(20)

  const hasSessions = sessions && sessions.length > 0

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Active session banner */}
      <div className="mb-4 p-4 rounded-xl border-2 border-dashed border-[#FC4C02]/40 bg-orange-50 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-[#FC4C02]">Prêt pour ce soir ?</p>
          <p className="text-xs text-muted-foreground">Lance ta session et commence à tracker</p>
        </div>
        <Link href="/session">
          <Button size="sm" className="bg-[#FC4C02] hover:bg-[#e04400] text-white gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Nouvelle session
          </Button>
        </Link>
      </div>

      {/* Sessions feed */}
      <div className="space-y-3">
        {hasSessions ? (
          sessions.map((session) => (
            <SessionCard key={session.id} session={session} currentUserId={user?.id ?? ''} />
          ))
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🍺</span>
            <h3 className="font-bold text-lg mb-1">Pas encore de sessions</h3>
            <p className="text-muted-foreground text-sm mb-4">Lance ta première session ou ajoute des amis pour voir leur activité.</p>
            <Link href="/session">
              <Button className="bg-[#FC4C02] hover:bg-[#e04400] text-white">
                Démarrer ma première session
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
