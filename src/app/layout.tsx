import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Pintly — Track your bar sessions",
  description: "Strava for bars. Track your drinks, compete with friends, earn caps.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
