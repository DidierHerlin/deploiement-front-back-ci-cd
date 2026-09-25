"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DispatchPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    
    if (!token) {
      router.replace("/login")
      return
    }

    try {
      // Décodage du payload JWT (le rôle y est stocké)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const role = payload.role || "LOCATAIRE"
      
      switch (role) {
        case "ADMIN":
          router.replace("/admin/dashboard")
          break
        case "AGENT":
          router.replace("/agent/dashboard")
          break
        case "PROPRIETAIRE":
          router.replace("/proprietaire/dashboard")
          break
        case "LOCATAIRE":
        default:
          router.replace("/locataire/dashboard")
          break
      }
    } catch {
      // En cas de token malformé
      router.replace("/login")
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p>Redirection vers votre espace...</p>
    </div>
  )
}
