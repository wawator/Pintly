import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddFriendForm } from '@/components/pintly/AddFriendForm'

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: friendships } = await supabase
    .from('friendships')
    .select('*, friend:friend_id(id, username, full_name)')
    .eq('user_id', user.id)
    .eq('status', 'accepted')

  const { data: pendingReceived } = await supabase
    .from('friendships')
    .select('*, requester:user_id(id, username, full_name)')
    .eq('friend_id', user.id)
    .eq('status', 'pending')

  const friends = friendships || []
  const pending = pendingReceived || []

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
      <h1 className="text-2xl font-black">Amis</h1>

      {/* Add friend */}
      <AddFriendForm currentUserId={user.id} />

      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demandes reçues</p>
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">{pending.length}</Badge>
          </div>
          <div className="space-y-2">
            {pending.map((p) => (
              <FriendRequestCard key={p.id} friendship={p} currentUserId={user.id} />
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Mes amis ({friends.length})
        </p>
        {friends.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-4xl block mb-3">🤝</span>
            <p className="text-muted-foreground text-sm">Pas encore d&apos;amis. Ajoutes-en ci-dessus !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <Card key={f.id} className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-[#FC4C02]">
                  {(f.friend?.username || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{f.friend?.full_name || f.friend?.username}</p>
                  <p className="text-xs text-muted-foreground">@{f.friend?.username}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FriendRequestCard({ friendship, currentUserId }: { friendship: any; currentUserId: string }) {
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-[#FC4C02]">
        {(friendship.requester?.username || '?')[0].toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{friendship.requester?.full_name || friendship.requester?.username}</p>
        <p className="text-xs text-muted-foreground">@{friendship.requester?.username}</p>
      </div>
      <AcceptFriendButton friendshipId={friendship.id} />
    </Card>
  )
}

function AcceptFriendButton({ friendshipId }: { friendshipId: string }) {
  return (
    <form action={async () => {
      'use server'
      const supabase = await createClient()
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    }}>
      <button type="submit" className="text-xs font-bold text-[#FC4C02] border border-[#FC4C02] rounded-lg px-3 py-1.5 hover:bg-orange-50">
        Accepter
      </button>
    </form>
  )
}
