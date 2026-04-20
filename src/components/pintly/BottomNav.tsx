'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, BarChart3, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/friends', icon: Users, label: 'Amis' },
  { href: '/session', icon: Plus, label: 'Session', primary: true },
  { href: '/leaderboard', icon: BarChart3, label: 'Classement' },
  { href: '/profile', icon: User, label: 'Profil' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t px-2 py-2 flex items-center justify-around">
      {navItems.map(({ href, icon: Icon, label, primary }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        if (primary) {
          return (
            <Link key={href} href={href} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-5" style={{ backgroundColor: '#FC4C02' }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] mt-1 font-medium text-muted-foreground">{label}</span>
            </Link>
          )
        }
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-2">
            <Icon className={cn('w-5 h-5', active ? 'text-[#FC4C02]' : 'text-muted-foreground')} />
            <span className={cn('text-[10px] font-medium', active ? 'text-[#FC4C02]' : 'text-muted-foreground')}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
