import Link from "next/link"
import { Beer, Trophy, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍺</span>
          <span className="text-xl font-black tracking-tight" style={{ color: '#FC4C02' }}>Pintly</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Connexion</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-[#FC4C02] hover:bg-[#e04400] text-white">Commencer</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Strava, mais pour les bars
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4 leading-tight">
            Enregistre tes sessions.<br />
            <span style={{ color: '#FC4C02' }}>Bats tes records.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Démarre une session au bar, enregistre chaque verre, suis tes perfs et donne des Caps à tes amis. Pintly transforme ta soirée en athlete story.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-[#FC4C02] hover:bg-[#e04400] text-white font-bold px-8">
                Créer un compte
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">Se connecter</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Beer className="w-6 h-6 text-[#FC4C02]" />
            </div>
            <h3 className="font-bold mb-2">Sessions live</h3>
            <p className="text-sm text-muted-foreground">Lance une session, ajoute chaque verre en temps réel avec chrono.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6 text-[#FC4C02]" />
            </div>
            <h3 className="font-bold mb-2">Personal Records</h3>
            <p className="text-sm text-muted-foreground">Bière la + rapide, record de verres en soirée, plus longue session...</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-[#FC4C02]" />
            </div>
            <h3 className="font-bold mb-2">Amis & Caps</h3>
            <p className="text-sm text-muted-foreground">Suis tes amis, donne des Caps à leurs sessions, accède au feed.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        <span className="font-black text-[#FC4C02]">Pintly</span> — Boire avec style depuis 2026
      </footer>
    </div>
  )
}
