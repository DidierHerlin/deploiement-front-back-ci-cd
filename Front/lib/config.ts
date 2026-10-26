/**
 * Configuration centralisée de l'URL de l'API Backend.
 *
 * Priorités :
 * 1. Côté serveur (SSR / Route handlers) : process.env.INTERNAL_API_URL si présent (ex: http://backend:8000/api)
 * 2. process.env.NEXT_PUBLIC_API_URL (défini au build / dans l'environnement, ex: http://localhost:8000/api)
 * 3. Côté navigateur : détecte automatiquement l'hôte actuel (ex: 13.53.227.16 ou domaine) sur le port 8000
 * 4. Côté serveur / fallback : localhost:8000
 */
export function getApiUrl(): string {
  // Côté serveur Next.js (SSR / API route handlers dans le réseau Docker)
  if (typeof window === "undefined" && process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:8000/api`
  }
  return "http://localhost:8000/api"
}

export const API_URL = getApiUrl()
