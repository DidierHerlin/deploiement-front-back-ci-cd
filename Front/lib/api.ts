import { getAccessToken, rafraichirToken, marquerDeconnecte, getRefreshToken, isTokenValid } from "./auth"
import { getApiUrl } from "./config"

const apiCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL_MS = 60 * 1000 // 1 minute

function getCacheKey(path: string, options: RequestInit) {
  return `${options.method || 'GET'}:${path}`
}

export function invalidateCache() {
  apiCache.clear()
}


export * from "../types"
export { fetchAPI, fetchAPI as apiFetch }

export interface ApiOptions extends RequestInit {
  skipAuth?: boolean
  requiresAuth?: boolean
}

export type ApiFetchOptions = ApiOptions

export function isPublicAuthRoute(path: string): boolean {
  const cleanPath = path.split("?")[0].toLowerCase()
  if (cleanPath.includes("changer-mot-de-passe")) {
    return false
  }
  return (
    cleanPath.startsWith("/auth/") ||
    cleanPath.startsWith("/mot-de-passe/") ||
    cleanPath.includes("/mot-de-passe/") ||
    cleanPath.includes("login") ||
    cleanPath.includes("register") ||
    cleanPath.includes("signup") ||
    cleanPath.includes("reinitialiser")
  )
}

export interface Notification {
  id: number;
  utilisateur: number;
  type: string;
  type_display: string;
  titre: string;
  message: string;
  lien: string | null;
  date_creation: string;
  lu: boolean;
  email_envoye: boolean;
}

export interface ReservationData {
  id: number
  locataire: number
  bien: number
  commentaire: string
  type_reservation: "LOCATION" | "ACHAT"
  statut: "EN_ATTENTE" | "TRAITEE" | "ANNULEE"
  reponse_admin: string
  contrat: number | null
  date_creation: string
  locataire_nom?: string
  locataire_prenoms?: string
  locataire_email?: string
  locataire_telephone?: string
  bien_titre?: string
  bien_type?: string
  bien_adresse?: string
  bien_surface?: number
  bien_loyer_mensuel?: string | null
  bien_prix?: string | null
  bien_mode_transaction?: string
  bien_statut?: string
  bien_nombre_pieces?: number | null
}


function gererExpirationSession() {
  if (typeof window !== "undefined") {
    marquerDeconnecte()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = "/login?expired=1"
    }
  }
}

async function fetchAPI<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const isPublic = isPublicAuthRoute(path)
  const skipAuth =
    options.skipAuth === true ||
    options.requiresAuth === false ||
    (options.skipAuth !== false && options.requiresAuth !== true && isPublic)

  let token: string | null = null
  const method = (options.method || 'GET').toUpperCase()
  if (method === 'GET') {
    const cacheKey = getCacheKey(path, options)
    const cached = apiCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data as T
    }
  }

  if (!skipAuth) {
    token = getAccessToken()
    if (!isTokenValid(token)) {
      const refresh = getRefreshToken()
      if (!isTokenValid(refresh)) {
        gererExpirationSession()
        throw new Error("Votre session a expiré. Veuillez vous reconnecter.")
      }
      token = await rafraichirToken()
      if (!token) {
        gererExpirationSession()
        throw new Error("Votre session a expiré. Veuillez vous reconnecter.")
      }
    }
  }

  const buildHeaders = (t: string | null): HeadersInit => {
    const customHeaders = ((options.headers as Record<string, string>) ?? {})
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    }
    if (!skipAuth && t) {
      headers["Authorization"] = `Bearer ${t}`
    } else if (skipAuth && headers["Authorization"]) {
      delete headers["Authorization"]
    }
    return headers
  }

  const TIMEOUT_MS = 30_000  
  const MAX_RETRIES = 1     

  async function doFetch(tokenValue: string | null): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${getApiUrl()}${path}`, {
        ...options,
        headers: buildHeaders(tokenValue),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return res
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  let lastError: any = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let res = await doFetch(skipAuth ? null : token)
      if (res.status === 401 && !skipAuth) {
        token = await rafraichirToken()
        if (!token) {
          gererExpirationSession()
          throw new Error("Votre session a expiré. Veuillez vous reconnecter.")
        }
        res = await doFetch(token)

        if (res.status === 401) {
          gererExpirationSession()
          throw new Error("Votre session a expiré. Veuillez vous reconnecter.")
        }
      }

      if (!res.ok) {
        let detail = `Erreur ${res.status}`
        try {
          const body = await res.json()
          detail = JSON.stringify(body)
        } catch {
        }
        throw new Error(`Erreur API (${res.status}) sur ${path} : ${detail}`)
      }

      if (res.status === 204) {
        if (method !== 'GET') {
          invalidateCache()
          if (typeof window !== "undefined" && !path.includes('marquer-lu')) {
            import("sonner").then(({ toast }) => {
              if (method === 'DELETE') toast.success("Suppression effectuée avec succès")
              else toast.success("Opération réussie")
            })
          }
        }
        return null as unknown as T
      }

      const text = await res.text()
      if (!text) {
        if (method !== 'GET') invalidateCache()
        return null as unknown as T
      }

      const data = JSON.parse(text) as T
      if (method === 'GET') {
         apiCache.set(getCacheKey(path, options), { data, timestamp: Date.now() })
      } else {
         invalidateCache()
         if (typeof window !== "undefined" && !path.includes('marquer-lu')) {
           import("sonner").then(({ toast }) => {
             let msg = "Opération réussie"
             if (method === 'POST') {
               if (path.includes('valider')) msg = "Paiement validé avec succès"
               else if (path.includes('refuser')) msg = "Paiement refusé"
               else if (path.includes('annuler')) msg = "Paiement annulé"
               else if (path.includes('resilier')) msg = "Contrat résilié"
               else if (path.includes('terminer')) msg = "Contrat terminé"
               else if (path.includes('finaliser_vente')) msg = "Vente finalisée"
               else if (path.includes('repondre')) msg = "Réponse envoyée"
               else if (isPublic || skipAuth) return
               else msg = "Ajout effectué avec succès"
             } else if (method === 'PATCH' || method === 'PUT') {
               msg = "Mise à jour effectuée avec succès"
             } else if (method === 'DELETE') {
               msg = "Suppression effectuée avec succès"
             }
             toast.success(msg)
           })
         }
      }
      return data

    } catch (error: any) {
      const isNetworkError = error.name === 'AbortError'
        || error.message === 'Failed to fetch'
        || error.message?.includes('network')
        || error.message?.includes('ECONNREFUSED')

      if (isNetworkError && attempt < MAX_RETRIES) {
        lastError = error
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }

      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé (timeout). Veuillez vérifier votre connexion.")
      }
      throw error
    }
  }

  throw lastError ?? new Error("Erreur réseau inattendue.")
}

// API Dashboard Admin
export async function getAdminDashboardStats(): Promise<any> {
  return await fetchAPI<any>("/admin/dashboard/")
}

// API Dashboard Agent
export async function getAgentDashboardStats(): Promise<any> {
  return await fetchAPI<any>("/agent/dashboard/")
}

// API Dashboard Propriétaire
export async function getProprietaireDashboardStats(): Promise<any> {
  return await fetchAPI<any>("/dashboard/proprietaire-optimized/")
}

// API Biens

export async function getBiens(page: number = 1, page_size: number = 100): Promise<Bien[]> {
  const res = await fetchAPI<{
    success: boolean
    count: number
    results: Bien[]
  }>(`/biens/?page=${page}&page_size=${page_size}`)
  
  return res.results || (res as any)
}

export async function createBien(payload: Partial<Bien>): Promise<Bien> {
  const res = await fetchAPI<{ success: boolean; data: Bien }>("/biens/", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return res.data
}

export async function updateBien(id: number, payload: Partial<Bien>): Promise<Bien> {
  const res = await fetchAPI<{ success: boolean; data: Bien }>(`/biens/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return res.data
}

export async function deleteBien(id: number): Promise<void> {
  await fetchAPI<void>(`/biens/${id}/`, {
    method: "DELETE",
  })
}



export async function getBiensDisponibles(): Promise<BienListItem[]> {
  const res = await fetchAPI<{
    success: boolean
    count: number
    results: BienListItem[]
  }>("/biens/disponible/")
  return res.results
}



export async function fetchBlob(
  path: string,
  options: RequestInit = {}
): Promise<Blob> {
  let token = getAccessToken()

  if (!isTokenValid(token)) {
    const refresh = getRefreshToken()
    if (!isTokenValid(refresh)) {
      gererExpirationSession()
      throw new Error("Session expirée veuillez vous reconnecter.")
    }
    token = await rafraichirToken()
    if (!token) {
      gererExpirationSession()
      throw new Error("Session expirée veuillez vous reconnecter.")
    }
  }

  const buildHeaders = (t: string | null): HeadersInit => ({
    Accept: "application/pdf, application/octet-stream, */*",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  })

  const TIMEOUT_MS = 60_000  
  const MAX_RETRIES = 0  

  async function doFetch(tokenValue: string | null): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${getApiUrl()}${path}`, {
        ...options,
        headers: buildHeaders(tokenValue),
        signal: controller.signal,
        credentials: "include",
      })
      clearTimeout(timeoutId)
      return res
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  let lastError: any = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let res = await doFetch(token)

      if (res.status === 401) {
        token = await rafraichirToken()
        if (!token) {
          gererExpirationSession()
          throw new Error("Session expire veuillez vous reconnecter.")
        }
        res = await doFetch(token)

        if (res.status === 401) {
          gererExpirationSession()
          throw new Error("Session expirée veuillez vous reconnecter.")
        }
      }

      if (!res.ok) {
        // Tenter de lire le message d'erreur JSON du backend
        let detail = `Erreur HTTP ${res.status}`
        try {
          const errorBody = await res.json()
          detail = errorBody.error || errorBody.detail || JSON.stringify(errorBody)
        } catch {

        }
        throw new Error(detail)
      }

      return await res.blob()

    } catch (error: any) {
      const isNetworkError = error.name === 'AbortError'
        || error.message === 'Failed to fetch'
        || error.message?.includes('network')
        || error.message?.includes('ECONNREFUSED')

      if (isNetworkError && attempt < MAX_RETRIES) {
        lastError = error
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }

      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors du téléchargement. Veuillez réessayer.")
      }
      throw error
    }
  }

  throw lastError ?? new Error("Impossible de télécharger le fichier. Vérifiez que le serveur est accessible.")
}

export async function getBienDetail(id: number): Promise<Bien> {
  const res = await fetchAPI<{ success: boolean; data: Bien }>(`/biens/${id}/`)
  return res.data
}



export async function getBienInfo(bienId: number): Promise<BienInfo> {
  return fetchAPI<BienInfo>(`/contrats/bien-info/?bien_id=${bienId}`)
}


//  API Locataires
export async function getProprietaires(): Promise<Proprietaire[]> {
  const res = await fetchAPI<{
    success: boolean
    count: number
    results: Proprietaire[]
  }>("/proprietaires/")
  return res.results
}

export async function getLocataires(): Promise<Locataire[]> {
  const res = await fetchAPI<{
    success: boolean
    count: number
    results: Locataire[]
  }>("/locataires/")
  return res.results
}

export async function getLocataireDetail(id: number): Promise<Locataire> {
  const res = await fetchAPI<{ success: boolean; data: Locataire }>(`/locataires/${id}/`)
  return res.data
}

// API  Contrats
export async function getContrats(): Promise<Contrat[]> {
  const res = await fetchAPI<{
    success: boolean
    count: number
    results: Contrat[]
  }>("/contrats/")
  return res.results || (res as any)
}

export async function getContrat(id: number): Promise<Contrat> {
  const res = await fetchAPI<Contrat>(`/contrats/${id}/`)
  return res
}

export async function creerContrat(payload: CreerContratPayload): Promise<Contrat> {
  return fetchAPI<Contrat>("/contrats/", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateContrat(id: number, payload: Partial<CreerContratPayload>): Promise<Contrat> {
  return fetchAPI<Contrat>(`/contrats/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

// API  Paiements




export async function getPaiements(): Promise<Paiement[]> {
  const PAGE_SIZE = 500

  const res = await fetchAPI<{
    count: number
    next: string | null
    results: Paiement[]
  }>(`/paiements/?page_size=${PAGE_SIZE}`)

  let paiements: Paiement[] = res.results ?? (res as any)

  if (!Array.isArray(paiements)) return []

  if (res.count > PAGE_SIZE) {
    const totalPages = Math.ceil(res.count / PAGE_SIZE)
    const pagePromises: Promise<Paiement[]>[] = []

    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(
        fetchAPI<{ results: Paiement[] }>(`/paiements/?page_size=${PAGE_SIZE}&page=${page}`)
          .then(r => r.results ?? [])
          .catch(() => []) // Ignorer silencieusement les pages en erreur
      )
    }

    const additionalPages = await Promise.all(pagePromises)
    for (const pagePaiements of additionalPages) {
      paiements = paiements.concat(pagePaiements)
    }
  }

  paiements.sort((a, b) => {
    const getRank = (p: Paiement) => {
      if (p.statut === 'EN_ATTENTE') return 1;
      if (p.statut === 'VALIDE' || p.statut === 'PAYE') return 3;
      return 2;
    };

    const rankDiff = getRank(a) - getRank(b);
    if (rankDiff !== 0) return rankDiff;

    const dateA = a.date_echeance ? new Date(a.date_echeance).getTime() : Infinity;
    const dateB = b.date_echeance ? new Date(b.date_echeance).getTime() : Infinity;
    return dateA - dateB;
  })
  
  return paiements
}

export async function validerPaiement(id: number, modePaiement: string, reference?: string): Promise<Paiement> {
  return await fetchAPI<Paiement>(`/paiements/${id}/valider/`, {
    method: "POST",
    body: JSON.stringify({
      mode_paiement: modePaiement,
      ...(reference ? { reference } : {})
    })
  })
}

export async function refuserPaiement(id: number): Promise<Paiement> {
  return await fetchAPI<Paiement>(`/paiements/${id}/refuser/`, {
    method: "POST"
  })
}

export async function createPaiement(payload: Partial<Paiement>): Promise<Paiement> {
  const res = await fetchAPI<{ success: boolean; data: Paiement }>("/paiements/", {
    method: "POST",
    body: JSON.stringify(payload)
  })
  return res.data || res as any
}

export async function updatePaiement(id: number, payload: Partial<Paiement>): Promise<Paiement> {
  const res = await fetchAPI<{ success: boolean; data: Paiement }>(`/paiements/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
  return res.data || res as any
}

export async function annulerPaiement(id: number): Promise<Paiement> {
  const res = await fetchAPI<{ success: boolean; data: Paiement }>(`/paiements/${id}/annuler/`, {
    method: "POST"
  })
  return res.data || res as any
}

export async function getImpayes(): Promise<Paiement[]> {
  const res = await fetchAPI<{ count: number; results: Paiement[] }>("/paiements/impayes/")
  return res.results || (res as any)
}

export interface PaiementStatsData {
  total: number
  count_paye: number
  count_attente: number
  count_retard: number
  total_encaisse: number
  montant_restant: number
}

export async function getPaiementsStats(userId?: number): Promise<PaiementStatsData> {
  const url = userId ? `/paiements/stats/?user_id=${userId}` : '/paiements/stats/'
  return fetchAPI<PaiementStatsData>(url)
}

export async function getDemandesPaiement(): Promise<DemandePaiement[]> {
  const res = await fetchAPI<{ count: number; results: DemandePaiement[] }>("/demandes-paiement/")
  return res.results ?? (res as any) ?? []
}

export async function creerDemandePaiement(payload: CreerDemandePaiementPayload): Promise<DemandePaiement> {
  return await fetchAPI<DemandePaiement>("/demandes-paiement/", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function annulerDemandePaiement(id: number): Promise<DemandePaiement> {
  return await fetchAPI<DemandePaiement>(`/demandes-paiement/${id}/annuler/`, {
    method: "POST"
  })
}

export async function getFacturesEligibles(): Promise<{ mois_cible: string; count: number; results: Paiement[] }> {
  return await fetchAPI<{ mois_cible: string; count: number; results: Paiement[] }>("/demandes-paiement/factures-eligibles/")
}

export async function validerDemandePaiement(id: number): Promise<DemandePaiement> {
  return await fetchAPI<DemandePaiement>(`/demandes-paiement/${id}/valider/`, {
    method: "POST"
  })
}

export async function refuserDemandePaiement(id: number, motif: string = ""): Promise<DemandePaiement> {
  return await fetchAPI<DemandePaiement>(`/demandes-paiement/${id}/refuser/`, {
    method: "POST",
    body: JSON.stringify({ motif_refus: motif, motif: motif })
  })
}

export const demandePaiementApi = {
  list: getDemandesPaiement,
  create: creerDemandePaiement,
  annuler: annulerDemandePaiement,
  valider: validerDemandePaiement,
  rejeter: refuserDemandePaiement,
  getFacturesEligibles: getFacturesEligibles,
}

export async function downloadQuittance(id: number, reference: string = "quittance"): Promise<void> {
  const token = getAccessToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  try {
    const response = await fetch(`${getApiUrl()}/paiements/${id}/quittance/`, { headers })
    
    if (!response.ok) {
      const rawText = await response.text()
      let errorMsg = "Erreur lors du télchargement de la quittance."
      try {
        const errorData = JSON.parse(rawText)
        if (errorData.error) errorMsg = errorData.error
      } catch (e) {
        errorMsg = "Erreur serveur : " + rawText.substring(0, 200)
      }
      throw new Error(errorMsg)
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${reference}_paiement_${id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    console.error("Download Error:", error)
    alert(error.message || "Erreur de connexion.")
  }
}



export async function getNotifications(): Promise<Notification[]> {
  const res = await fetchAPI<{ count?: number; results?: Notification[] } | Notification[]>('/notifications/');
  return Array.isArray(res) ? res : (res.results || []);
}

export async function getUnreadNotificationsCount(): Promise<{ count: number }> {
  return fetchAPI<{ count: number }>('/notifications/non-lues/count/');
}

export async function markNotificationsAsRead(notificationIds?: number[]): Promise<any> {
  return fetchAPI<any>('/notifications/marquer-lu/', {
    method: 'POST',
    body: JSON.stringify(notificationIds ? { notification_ids: notificationIds } : {}),
  });
}



export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("blob:") || url.startsWith("data:")) return url

  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (typeof window !== "undefined" && window.location?.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      try {
        const parsed = new URL(url)
        if (parsed.pathname.startsWith("/media/")) {
          return `${window.location.protocol}//${window.location.hostname}:8000${parsed.pathname}`
        }
      } catch {
        if (url.includes("localhost:8000") || url.includes("127.0.0.1:8000")) {
          return url.replace(/localhost:8000|127\.0\.0\.1:8000/, `${window.location.hostname}:8000`)
        }
      }
    }
    return url
  }

  const base = getApiUrl().replace(/\/api\/?$/, "")
  return `${base}${url.startsWith("/") ? url : `/${url}`}`
}


export function getUserPhotoSrc(user: { photo_url?: string | null; photo_profil?: string | null } | null | undefined): string | null {
  if (!user) return null
  return resolveMediaUrl(user.photo_url ?? user.photo_profil)
}

export async function getProfil(): Promise<UserProfil> {
  const res = await fetchAPI<{ success: boolean; user: UserProfil }>("/profil/")
  return res.user
}

export async function updateProfil(payload: FormData): Promise<UserProfil> {
  let token = getAccessToken()

  if (!isTokenValid(token)) {
    const refresh = getRefreshToken()
    if (!isTokenValid(refresh)) {
      gererExpirationSession()
      throw new Error("Session expirée  veuillez vous reconnecter.")
    }
    token = await rafraichirToken()
    if (!token) {
      gererExpirationSession()
      throw new Error("Session expire veuillez vous reconnecter.")
    }
  }

  const options: RequestInit = {
    method: "PUT",
    body: payload,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  let res = await fetch(`${getApiUrl()}/profil/`, options)

  if (res.status === 401) {
    const { rafraichirToken } = await import("./auth")
    token = await rafraichirToken()
    if (!token) {
      gererExpirationSession()
      throw new Error("Session expirée  veuillez vous reconnecter.")
    }
    options.headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    res = await fetch(`${getApiUrl()}/profil/`, options)
    
    if (res.status === 401) {
      gererExpirationSession()
      throw new Error("Session expirée  veuillez vous reconnecter.")
    }
  }

  if (!res.ok) {
    let detail = `Erreur ${res.status}`
    try {
      const body = await res.json()
      detail = JSON.stringify(body)
    } catch {}
    throw new Error(detail)
  }

  const data = await res.json() as { success: boolean; user: UserProfil }
  invalidateCache()
  if (typeof window !== "undefined") {
    import("sonner").then(({ toast }) => toast.success("Profil mis à jour avec succès"))
  }
  return data.user
}

export async function getAllUsers(): Promise<UserProfil[]> {
  const res = await fetchAPI<{ count: number; results: UserProfil[] }>("/tous-utilisateurs/")
  return res.results || (res as any)
}

export async function deleteUser(id: number): Promise<void> {
  await fetchAPI(`/tous-utilisateurs/${id}/`, { method: "DELETE" })
}

export async function updateUser(id: number, payload: any): Promise<any> {
  return await fetchAPI(`/tous-utilisateurs/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function createUser(payload: { nom: string; prenoms: string; email: string; role: string; password: string }): Promise<any> {
  const roleMap: Record<string, string> = {
    'Locataire': 'locataires/register/',
    'Propriétaire': 'proprietaires/register/',
    'Agent': 'agents/register/',
    'Admin': 'agents/register/' // fallback if admin registration not split, or maybe it fails
  }
  const endpoint = roleMap[payload.role] || 'agents/register/'
  return await fetchAPI(`/${endpoint}`, {
    method: "POST",
    body: JSON.stringify(payload)
  })
}
export async function createProprietaire(payload: any): Promise<Proprietaire> {
  const res = await fetchAPI<{ success: boolean; data: Proprietaire }>("/proprietaires/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return res.data || res as any
}

export async function updateProprietaire(id: number, payload: any): Promise<Proprietaire> {
  const res = await fetchAPI<{ success: boolean; data: Proprietaire }>(`/proprietaires/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  return res.data || res as any
}

export async function createLocataire(payload: any): Promise<Locataire> {
  const res = await fetchAPI<{ success: boolean; data: Locataire }>("/locataires/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return res.data || res as any
}

export async function updateLocataire(id: number, payload: any): Promise<Locataire> {
  const res = await fetchAPI<{ success: boolean; data: Locataire }>(`/locataires/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  return res.data || res as any
}


export async function deleteContrat(id: number): Promise<void> {
  await fetchAPI<void>(`/contrats/${id}/`, { method: "DELETE" })
}

export async function actionContrat(id: number, action: 'resilier' | 'terminer' | 'finaliser_vente'): Promise<Contrat> {
  const res = await fetchAPI<{ success: boolean; data: Contrat }>(`/contrats/${id}/${action}/`, {
    method: "POST",
  })
  return res.data || res as any
}

export async function getEcheances(): Promise<any[]> {
  const res = await fetchAPI<{ count: number; results: any[] }>('/contrats/echeances/');
  return res.results || [];
}


export async function getReservations(): Promise<ReservationData[]> {
  const res = await fetchAPI<{ success: boolean; count: number; results: ReservationData[] }>("/reservations/")
  return res.results || (res as any)
}

export async function getReservation(id: number): Promise<ReservationData> {
  const res = await fetchAPI<{ success: boolean; data: ReservationData }>(`/reservations/${id}/`)
  return res.data || (res as any)
}

export async function creerReservation(payload: { bien: number; commentaire?: string; type_reservation: "LOCATION" | "ACHAT" }): Promise<ReservationData> {
  const res = await fetchAPI<{ success: boolean; data: ReservationData }>("/reservations/", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return res.data || (res as any)
}

export async function repondreReservation(id: number, payload: { reponse_admin: string; statut?: string }): Promise<ReservationData> {
  const res = await fetchAPI<{ success: boolean; data: ReservationData }>(`/reservations/${id}/repondre/`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return res.data || (res as any)
}

export async function getReportingStats(): Promise<any> {
  const res = await fetchAPI<any>('/reporting/stats/');
  return res;
}

export async function demanderCodeMdp(email: string, options: ApiOptions = {}): Promise<any> {
  return await fetchAPI<any>("/mot-de-passe/demande/", {
    ...options,
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuth: true,
  })
}

export async function verifierCodeMdp(email: string, code: string, options: ApiOptions = {}): Promise<any> {
  const bodyData = {
    email,
    code,
    token: code,
    otp: code,
  }
  try {
    return await fetchAPI<any>("/mot-de-passe/verifier-code/", {
      ...options,
      method: "POST",
      body: JSON.stringify(bodyData),
      skipAuth: true,
    })
  } catch (err: any) {
    if (err?.message?.includes("404") || err?.status === 404) {
      return await fetchAPI<any>("/mot-de-passe/verifier/", {
        ...options,
        method: "POST",
        body: JSON.stringify(bodyData),
        skipAuth: true,
      })
    }
    throw err
  }
}

export async function reinitialiserMdp(
  payload: {
    email: string
    code?: string
    token?: string
    otp?: string
    nouveau_mot_de_passe?: string
    new_password?: string
    password?: string
    confirmation_mot_de_passe?: string
    confirm_password?: string
    mot_de_passe_confirmation?: string
  },
  options: ApiOptions = {}
): Promise<any> {
  const codeVal = payload.code || payload.token || payload.otp || ""
  const pwd = payload.new_password || payload.nouveau_mot_de_passe || payload.password || ""
  const confirmPwd =
    payload.confirm_password ||
    payload.confirmation_mot_de_passe ||
    payload.mot_de_passe_confirmation ||
    pwd

  const bodyData = {
    email: payload.email,
    code: codeVal,
    token: codeVal,
    otp: codeVal,
    new_password: pwd,
    password: pwd,
    nouveau_mot_de_passe: pwd,
    confirm_password: confirmPwd,
    confirmation_mot_de_passe: confirmPwd,
    mot_de_passe_confirmation: confirmPwd,
    ...payload,
  }

  try {
    return await fetchAPI<any>("/mot-de-passe/reinitialiser/", {
      ...options,
      method: "POST",
      body: JSON.stringify(bodyData),
      skipAuth: true,
    })
  } catch (err: any) {
    if (err?.message?.includes("404") || err?.status === 404) {
      return await fetchAPI<any>("/mot-de-passe/confirmer/", {
        ...options,
        method: "POST",
        body: JSON.stringify(bodyData),
        skipAuth: true,
      })
    }
    throw err
  }
}


