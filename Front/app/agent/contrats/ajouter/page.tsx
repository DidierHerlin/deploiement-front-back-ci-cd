"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { creerContrat, CreerContratPayload } from "@/lib/api"
import ContratForm from "../components/ContratForm"
import { ArrowLeft } from "lucide-react"

function AjouterContratContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Préremplissage depuis une réservation
  const bienParam = searchParams.get("bien")
  const locataireParam = searchParams.get("locataire")
  const typeContratParam = searchParams.get("type_contrat")
  const reservationId = searchParams.get("reservation_id")

  const initialData: Partial<CreerContratPayload> = {}
  if (bienParam) initialData.bien = Number(bienParam)
  if (locataireParam) initialData.locataire = Number(locataireParam)
  if (typeContratParam) initialData.type_contrat = typeContratParam as "LOCATION" | "ACHAT"

  const handleSubmit = async (data: CreerContratPayload) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await creerContrat(data)
      router.push("/agent/contrats")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du contrat")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '24px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <button 
        onClick={() => router.back()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', marginBottom: 24, fontSize: 13, fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Retour aux contrats
      </button>

      {reservationId && (
        <div style={{ padding: 12, background: '#dbeafe', color: '#1e40af', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          📋 Ce contrat est créé à partir de la réservation #{reservationId}. Les informations ont été préremplies automatiquement.
        </div>
      )}

      {error && (
        <div style={{ padding: 16, background: 'var(--destructive)', color: 'white', borderRadius: 8, marginBottom: 24, fontSize: 13 }}>
          {error}
        </div>
      )}

      <ContratForm 
        title={reservationId ? "Nouveau Contrat (depuis réservation)" : "Nouveau Contrat"}
        initialData={Object.keys(initialData).length > 0 ? initialData : undefined}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

export default function AjouterContratPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}>Chargement...</div>}>
      <AjouterContratContent />
    </Suspense>
  )
}
