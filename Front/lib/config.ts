/**
 * Configuration centralisée de l'URL de l'API Backend.
 *
 * Priorités :
 * 1. process.env.NEXT_PUBLIC_API_URL (défini au build / dans l'environnement)
 * 2. Côté navigateur : détecte automatiquement l'hôte actuel (ex: 13.53.227.16 ou domaine) sur le port 8000
 * 3. Côté serveur / fallback : localhost:8000
 */
export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:8000/api`
  }
  return "http://localhost:8000/api"
}

export const API_URL = getApiUrl()
