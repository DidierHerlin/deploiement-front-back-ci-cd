"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { getContrat, updateContrat, CreerContratPayload } from "@/lib/api"
import ContratForm from "../../components/ContratForm"
import { ArrowLeft } from "lucide-react"

export default function ModifierContratPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = parseInt(resolvedParams.id, 10)
  
  const [initialData, setInitialData] = useState<Partial<CreerContratPayload> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getContrat(id)
      .then(data => {
        setInitialData({
          bien: data.bien,
          locataire: data.locataire,
          type_contrat: data.type_contrat,
          date_debut: data.date_debut,
          date_fin: data.date_fin,
          loyer: data.loyer,
          depot_garantie: data.depot_garantie,
          prix: data.prix,
        })
      })
      .catch(err => setError(err.message || "Erreur de chargement du contrat"))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleSubmit = async (data: CreerContratPayload) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await updateContrat(id, data)
      router.push("/agent/contrats")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erreur lors de la modification")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="p-12 text-center text-gray-500">Chargement...</div>

  return (
    <div style={{ padding: '24px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <button 
        onClick={() => router.back()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', marginBottom: 24, fontSize: 13, fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Retour aux contrats
      </button>

      {error && (
        <div style={{ padding: 16, background: 'var(--destructive)', color: 'white', borderRadius: 8, marginBottom: 24, fontSize: 13 }}>
          {error}
        </div>
      )}

      {initialData && (
        <ContratForm 
          title="Modifier le contrat"
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
