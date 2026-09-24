import { getAccessToken, rafraichirToken, marquerDeconnecte, getRefreshToken, isTokenValid } from "./auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"

// -- CACHE SYSTEM --
const apiCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL_MS = 60 * 1000 // 1 minute

function getCacheKey(path: string, options: RequestInit) {
  return `${options.method || 'GET'}:${path}`
}

export function invalidateCache() {
  apiCache.clear()
}
// -----------------
// Types métier

export interface Bien {
  id: number
  titre: string
  type: string
  mode_transaction: "LOCATION" | "VENTE"
  adresse: string
  surface: number
  nombre_pieces: number | null
  loyer_mensuel: string | null
  prix: string | null
  statut: "DISPONIBLE" | "LOUE" | "VENDU" | "EN_TRAVAUX"
  photos: string[]
  proprietaire: {
    id: number
    user: { id: number; email: string; nom: string; prenoms: string }
  }
}

export interface BienListItem {
  id: number
  titre: string
  type: string
  mode_transaction: "LOCATION" | "VENTE"
  adresse: string
  surface?: number | null
  nombre_pieces?: number | null
  loyer_mensuel: string | null
  prix: string | null
  statut: string
  photos?: string[] | null
  proprietaire: { id: number; user: { id?: number; nom: string; prenoms: string } }
}

export interface Locataire {
  id: number
  user: { id: number; email: string; nom: string; prenoms: string; telephone?: string; is_active?: boolean }
}

export interface Contrat {
  id: number
  bien: number
  bien_titre?: string
  bien_type?: string
  locataire: number
  locataire_nom?: string
  locataire_prenoms?: string
  type_contrat: "LOCATION" | "ACHAT"
  type_paiement_achat: "TOTALITE" | "PARTIEL" | null
  date_debut: string | null
  date_fin: string | null
  date_paiement: string | null
  loyer: string | null
  depot_garantie: string | null
  prix: string | null
  statut: string
  document_pdf: string | null
  date_creation: string
}

export interface CreerContratPayload {
  bien: number
  locataire: number
  type_contrat: "LOCATION" | "ACHAT"
  type_paiement_achat?: "TOTALITE" | "PARTIEL" | null
  date_debut?: string | null
  date_fin?: string | null
  loyer?: string | null
  depot_garantie?: string | null
  prix?: string | null
}

// Fetch authentifié — avec retry sur token expiré

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
  options: RequestInit = {}
): Promise<T> {
  let token = getAccessToken()
  const method = (options.method || 'GET').toUpperCase()

  // -- VÉRIFICATION DU CACHE --
  if (method === 'GET') {
    const cacheKey = getCacheKey(path, options)
    const cached = apiCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data as T
    }
  }

  // -- VÉRIFICATION ET RAFRAÎCHISSEMENT DU TOKEN AVANT REQUÊTE --
  if (!path.startsWith("/auth/") && !path.includes("login") && !path.includes("register")) {
    if (!isTokenValid(token)) {
      const refresh = getRefreshToken()
      if (!isTokenValid(refresh)) {
        gererExpirationSession()
        throw new Error("Session expirée — veuillez vous reconnecter.")
      }
      token = await rafraichirToken()
      if (!token) {
        gererExpirationSession()
        throw new Error("Session expirée — veuillez vous reconnecter.")
      }
    }
  }

  const buildHeaders = (t: string | null): HeadersInit => ({
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  })

  const TIMEOUT_MS = 30_000  // 30 secondes pour les tableaux de bord chargés
  const MAX_RETRIES = 1      // 1 retry en cas d'erreur réseau transitoire

  async function doFetch(tokenValue: string | null): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${API_URL}${path}`, {
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

  // Retry avec backoff exponentiel pour les erreurs réseau / timeout
  let lastError: any = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let res = await doFetch(token)

      // Tentative de refresh si 401
      if (res.status === 401) {
        token = await rafraichirToken()
        if (!token) {
          gererExpirationSession()
          throw new Error("Session expirée — veuillez vous reconnecter.")
        }
        res = await doFetch(token)

        if (res.status === 401) {
          gererExpirationSession()
          throw new Error("Session expirée — veuillez vous reconnecter.")
        }
      }

      if (!res.ok) {
        let detail = `Erreur ${res.status}`
        try {
          const body = await res.json()
          detail = JSON.stringify(body)
        } catch {
          // Impossible de parser le body — on garde le code HTTP
        }
        throw new Error(`Erreur API (${res.status}) sur ${path} : ${detail}`)
      }

      // 204 No Content
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
        // Attendre avant de réessayer (backoff exponentiel : 1s, 2s)
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

  // Dernier recours — ne devrait jamais arriver
  throw lastError ?? new Error("Erreur réseau inattendue.")
}

// API — Biens

export async function getBiens(): Promise<Bien[]> {
  const res = await fetchAPI<{
    success: boolean
    count: number
    results: Bien[]
  }>("/biens/")
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


// Récupère la liste des biens disponibles.

export async function getBiensDisponibles(): Promise<BienListItem[]> {
  const res = await fetchAPI<{
    success: boolean
    count: number
    results: BienListItem[]
  }>("/biens/disponible/")
  return res.results
}


// Récupère le détail d'un bien par son id.

// Pour télécharger un fichier (PDF quittance, etc.)
export async function fetchBlob(
  path: string,
  options: RequestInit = {}
): Promise<Blob> {
  let token = getAccessToken()

  if (!isTokenValid(token)) {
    const refresh = getRefreshToken()
    if (!isTokenValid(refresh)) {
      gererExpirationSession()
      throw new Error("Session expirée — veuillez vous reconnecter.")
    }
    token = await rafraichirToken()
    if (!token) {
      gererExpirationSession()
      throw new Error("Session expirée — veuillez vous reconnecter.")
    }
  }

  const buildHeaders = (t: string | null): HeadersInit => ({
    Accept: "application/pdf, application/octet-stream, */*",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  })

  const TIMEOUT_MS = 60_000  // 60 secondes (les PDF peuvent être longs à générer)
  const MAX_RETRIES = 0      // 0 retry pour éviter plusieurs popups IDM (Internet Download Manager)

  async function doFetch(tokenValue: string | null): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${API_URL}${path}`, {
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

      // Tentative de refresh si 401
      if (res.status === 401) {
        token = await rafraichirToken()
        if (!token) {
          gererExpirationSession()
          throw new Error("Session expirée — veuillez vous reconnecter.")
        }
        res = await doFetch(token)

        if (res.status === 401) {
          gererExpirationSession()
          throw new Error("Session expirée — veuillez vous reconnecter.")
        }
      }

      if (!res.ok) {
        // Tenter de lire le message d'erreur JSON du backend
        let detail = `Erreur HTTP ${res.status}`
        try {
          const errorBody = await res.json()
          detail = errorBody.error || errorBody.detail || JSON.stringify(errorBody)
        } catch {
          // Le body n'est pas du JSON — on garde le code HTTP
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


// Création contrat 

export interface BienInfo {
  loyer_mensuel: string | null
  prix: string | null
  mode_transaction: "LOCATION" | "VENTE"
  type: string
  surface: number
  adresse: string
  titre: string
}

export async function getBienInfo(bienId: number): Promise<BienInfo> {
  return fetchAPI<BienInfo>(`/contrats/bien-info/?bien_id=${bienId}`)
}


//  API — Locataires

export interface Proprietaire {
  id: number
  user: {
    id: number
    email: string
    nom: string
    prenoms: string
    telephone?: string
    is_active?: boolean
  }
}

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

// API — Contrats

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

// API — Paiements

export interface Paiement {
  id: number
  contrat: number
  num_echeance: number
  date_echeance: string
  date_paiement_prevue: string | null
  date_paiement: string | null
  date_versement_partiel: string | null
  montant_attendu: string | null
  montant: string | null
  montant_paye: string | null
  montant_restant: string | null
  mode_paiement: string | null
  reference: string | null
  statut: string
  est_partiel: boolean
  date_creation: string
  locataire_nom: string
  bien_titre: string
  loyer_contrat: string
  est_en_retard: boolean
  message_mois: string
  part_proprietaire: number | null
  commission_agent: number | null
}

export async function getPaiements(): Promise<Paiement[]> {
  const PAGE_SIZE = 500

  const res = await fetchAPI<{
    count: number
    next: string | null
    results: Paiement[]
  }>(`/paiements/?page_size=${PAGE_SIZE}`)

  let paiements: Paiement[] = res.results ?? (res as any)

  if (!Array.isArray(paiements)) return []

  // S'il y a plus de résultats que la première page, récupérer les pages restantes en parallèle
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
      return 2; // PARTIEL, EN_RETARD, etc.
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

export async function downloadQuittance(id: number, reference: string = "quittance"): Promise<void> {
  const token = localStorage.getItem("token")
  const headers: Record<string, string> = {}
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  try {
    const response = await fetch(`${API_URL}/paiements/${id}/quittance/`, { headers })
    
    if (!response.ok) {
      const rawText = await response.text()
      let errorMsg = "Erreur lors du téléchargement de la quittance."
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

// API — Profil

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

export interface UserProfil {
  id: number
  email: string
  nom: string
  prenoms: string
  role: string
  is_active: boolean
  date_creation: string
  photo_url: string | null
  photo_profil?: string | null
  telephone?: string | null
}

// Construit une URL image affichable : accepte URL absolue (backend),
// blob:, data:, ou chemin relatif /media/... (préfixé par le host backend).
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url
  const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"
  return `${base}${url.startsWith("/") ? url : `/${url}`}`
}

// Raccourci : extrait la photo affichable depuis un user/profil
// (le backend renvoie `photo_url`, `photo_profil` étant write-only).
export function getUserPhotoSrc(user: { photo_url?: string | null; photo_profil?: string | null } | null | undefined): string | null {
  if (!user) return null
  return resolveMediaUrl(user.photo_url ?? user.photo_profil)
}

export async function getProfil(): Promise<UserProfil> {
  const res = await fetchAPI<{ success: boolean; user: UserProfil }>("/profil/")
  return res.user
}

export async function updateProfil(payload: FormData): Promise<UserProfil> {
  // fetchAPI forces Content-Type: application/json by default.
  let token = getAccessToken()

  if (!isTokenValid(token)) {
    const refresh = getRefreshToken()
    if (!isTokenValid(refresh)) {
      gererExpirationSession()
      throw new Error("Session expirée — veuillez vous reconnecter.")
    }
    token = await rafraichirToken()
    if (!token) {
      gererExpirationSession()
      throw new Error("Session expirée — veuillez vous reconnecter.")
    }
  }

  const options: RequestInit = {
    method: "PUT",
    body: payload,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  let res = await fetch(`${API_URL}/profil/`, options)

  if (res.status === 401) {
    const { rafraichirToken } = await import("./auth")
    token = await rafraichirToken()
    if (!token) {
      gererExpirationSession()
      throw new Error("Session expirée — veuillez vous reconnecter.")
    }
    options.headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    res = await fetch(`${API_URL}/profil/`, options)
    
    if (res.status === 401) {
      gererExpirationSession()
      throw new Error("Session expirée — veuillez vous reconnecter.")
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

// API — Réservations

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

