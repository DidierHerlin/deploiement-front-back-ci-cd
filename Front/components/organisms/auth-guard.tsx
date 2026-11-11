"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { marquerDeconnecte, getAccessToken, rafraichirToken } from "@/lib/auth"
import { estPublique } from "@/lib/routes-publiques"
import { getProfil } from "@/lib/api"

export default function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  // Bloquer si la session est rejetée
  const [rejete, setRejete] = useState(false)

  useEffect(() => {
    // Les pages publiques
    if (estPublique(pathname)) return

    let annule = false

    async function verifierSession() {
      let token = getAccessToken()
      if (!token) {
        token = await rafraichirToken()
      }

      // Toujours pas de token → redirection login
      if (!token) {
        if (!annule) {
          marquerDeconnecte()
          setRejete(true)
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        }
        return
      }

      try {
        await getProfil()
      } catch {
        if (!annule) {
          marquerDeconnecte()
          setRejete(true)
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}&expired=1`)
        }
      }
    }

    verifierSession()

    return () => {
      annule = true
    }
  }, [pathname, router])

  if (rejete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Redirection...
      </div>
    )
  }

  return <>{children}</>
}
