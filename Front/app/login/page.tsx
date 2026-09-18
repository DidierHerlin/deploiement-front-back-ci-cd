"use client"

import { Suspense } from "react"
import { LoginForm } from "@/components/login/login-form"

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Chargement...
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}