'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserPlus } from 'lucide-react'

export function AddFriendForm({ currentUserId }: { currentUserId: string }) {
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    setStatus('loading')
    const supabase = createClient()

    const { data: found } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username.trim())
      .single()

    if (!found) {
      setMessage('Utilisateur introuvable')
      setStatus('error')
      return
    }
    if (found.id === currentUserId) {
      setMessage('Tu ne peux pas t\'ajouter toi-même')
      setStatus('error')
      return
    }

    const { error } = await supabase.from('friendships').insert({
      user_id: currentUserId,
      friend_id: found.id,
      status: 'pending',
    })

    if (error) {
      setMessage('Demande déjà envoyée ou erreur')
      setStatus('error')
    } else {
      setMessage(`Demande envoyée à @${found.username} !`)
      setStatus('success')
      setUsername('')
    }
  }

  return (
    <Card className="p-4">
      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-[#FC4C02]" />
        Ajouter un ami
      </p>
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="@pseudo"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          className="bg-[#FC4C02] hover:bg-[#e04400] text-white"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? '...' : 'Ajouter'}
        </Button>
      </form>
      {message && (
        <p className={`text-xs mt-2 ${status === 'success' ? 'text-green-600' : 'text-destructive'}`}>
          {message}
        </p>
      )}
    </Card>
  )
}
