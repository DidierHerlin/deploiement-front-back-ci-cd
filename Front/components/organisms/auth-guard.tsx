"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { marquerDeconnecte, getAccessToken, rafraichirToken } from "@/lib/auth"
import { estPublique } from "@/lib/routes-publiques"
import { getApiUrl } from "@/lib/config"

export default function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  //Bloquer sir la session est rejetée
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
        const response = await fetch(`${getApiUrl()}/profil/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (annule) return

        if (response.ok) return

        if (response.status === 401) {
          const nouveauToken = await rafraichirToken()
          if (annule) return

          if (nouveauToken) {
            const retry = await fetch(`${getApiUrl()}/profil/`, {
              headers: { Authorization: `Bearer ${nouveauToken}` },
            })
            if (annule) return
            if (retry.ok) return
          }
        }

        if (!annule) {
          marquerDeconnecte()
          setRejete(true)
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}&expired=1`)
        }
      } catch {
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