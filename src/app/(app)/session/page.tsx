'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarSearch } from '@/components/pintly/BarSearch'

interface Bar {
  id: string
  name: string
  city: string | null
  address: string | null
}

export default function NewSessionPage() {
  const router = useRouter()
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBar) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        bar_id: selectedBar.id,
        bar_name: selectedBar.name,
        bar_location: selectedBar.city,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !data) {
      setError('Erreur lors du démarrage de la session')
      setLoading(false)
    } else {
      router.push(`/session/active?id=${data.id}`)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Nouvelle session 🍺</h1>
        <p className="text-muted-foreground text-sm mt-1">Où est-ce qu&apos;on boit ce soir ?</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Choisis ton bar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStart} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Bar</Label>
              <BarSearch onSelect={setSelectedBar} selectedBar={selectedBar} />
              <p className="text-xs text-muted-foreground">
                Tape le nom pour chercher. Si ton bar n&apos;existe pas, tu peux le créer.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-[#FC4C02] hover:bg-[#e04400] text-white font-bold gap-2"
              disabled={loading || !selectedBar}
              size="lg"
            >
              <Play className="w-4 h-4" />
              {loading ? 'Démarrage...' : 'Démarrer la session'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
