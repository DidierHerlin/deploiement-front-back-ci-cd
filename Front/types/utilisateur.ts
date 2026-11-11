export interface UserProfil {
  id: number
  email: string
  nom: string
  prenoms: string
  role: string
  is_active: boolean
  date_creation: string
  photo_url?: string | null
  photo_profil?: string | null
  telephone?: string | null
}

export interface Locataire {
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
  iban?: string
  contact?: string
}
