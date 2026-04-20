'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'

export function TopBar({ user }: { user: User }) {
  const username = user.user_metadata?.username || user.email?.split('@')[0]
  return (
    <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
      <Link href="/feed" className="flex items-center gap-1.5">
        <span className="text-xl">🍺</span>
        <span className="text-lg font-black" style={{ color: '#FC4C02' }}>Pintly</span>
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Bell className="w-4 h-4" />
        </Button>
        <Link href="/profile">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-[#FC4C02]">
            {username?.[0]?.toUpperCase() ?? '?'}
          </div>
        </Link>
      </div>
    </header>
  )
}
