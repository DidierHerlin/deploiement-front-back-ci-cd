"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { creerContrat, CreerContratPayload } from "@/lib/api"
import ContratForm from "../components/ContratForm"
import { ArrowLeft, ClipboardList } from "lucide-react"

function AjouterContratContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <button className="agent-back" onClick={() => router.back()}>
        <ArrowLeft size={16} /> Retour aux contrats
      </button>

      {reservationId && (
        <div className="agent-info-box blue">
          <strong><ClipboardList size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />Contrat depuis la réservation #{reservationId}</strong>
          <div>Les informations ont été préremplies automatiquement.</div>
        </div>
      )}

      {error && (
        <div className="agent-info-box red" role="alert">
          {error}
        </div>
      )}

      <ContratForm
        title={reservationId ? "Nouveau contrat (depuis réservation)" : "Nouveau contrat"}
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
    <Suspense fallback={<div className="agent-loading">Chargement...</div>}>
      <AjouterContratContent />
    </Suspense>
  )
}
