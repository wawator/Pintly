'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          full_name: form.full_name,
        },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/feed')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-muted/30">
      <div className="mb-8 text-center">
        <span className="text-4xl">🍺</span>
        <h1 className="text-2xl font-black mt-2" style={{ color: '#FC4C02' }}>Pintly</h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>Rejoins la communauté des athletes du bar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Prénom</Label>
                <Input id="full_name" name="full_name" placeholder="Alex" value={form.full_name} onChange={handleChange} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Pseudo</Label>
                <Input id="username" name="username" placeholder="alex_pint" value={form.username} onChange={handleChange} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="toi@exemple.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" placeholder="8 caractères min." value={form.password} onChange={handleChange} required minLength={8} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-[#FC4C02] hover:bg-[#e04400] text-white" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium text-[#FC4C02] hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
