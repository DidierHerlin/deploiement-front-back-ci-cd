"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

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
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Redirection vers votre espace...
    </div>
  )
}
