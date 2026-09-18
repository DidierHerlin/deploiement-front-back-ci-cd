export type Property = {
  id: number
  title: string
  address: string
  type: string
  surface: string
  rooms: string
  rent: string
  charges: string
  status: 'Loué' | 'Disponible' | 'Vendu' | string
  color: string
  proprietaire?: number
  photos?: string[]
  description?: string
}
