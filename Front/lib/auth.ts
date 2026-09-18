// lib/auth.ts

const AUTH_COOKIE = "auth"
const AUTH_MAX_AGE_SECONDES = 60 * 60 * 24 * 14

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

//Stockage des tokens JWT 
export function sauvegarderTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access)
  localStorage.setItem("refresh_token", refresh)
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token")
}

function supprimerTokens() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

//Cookie indicateur pour le middleware SSR 
export function marquerConnecte() {
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${AUTH_MAX_AGE_SECONDES}; samesite=lax`
}

// déconnexion ou une session invalide détectée.
export function marquerDeconnecte() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`
  supprimerTokens()
}

//Refresh du token 

let refreshPromise: Promise<string | null> | null = null

export async function rafraichirToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refresh = getRefreshToken()
    if (!refresh) {
      refreshPromise = null;
      return null
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      })

      if (!response.ok) {
        refreshPromise = null;
        return null
      }

      const data = await response.json()
      if (data.access) {
        localStorage.setItem("access_token", data.access)
        if (data.refresh) {
          localStorage.setItem("refresh_token", data.refresh)
        }
        refreshPromise = null;
        return data.access
      }
      refreshPromise = null;
      return null
    } catch {
      refreshPromise = null;
      return null
    }
  })();

  return refreshPromise;
}

// Déconnexion

export async function deconnecter() {
  const access = getAccessToken()
  const refresh = getRefreshToken()

  try {
    if (refresh) {
      await fetch(`${API_URL}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify({ refresh }),
      })
    }
  } finally {
    marquerDeconnecte()
    window.location.href = "/login"
  }
}