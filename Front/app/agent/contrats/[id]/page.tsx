"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { getContrat, getBienDetail, getLocataireDetail, Contrat, Bien, Locataire } from "@/lib/api"
import { ArrowLeft, Calendar, FileText, Home, User, Edit } from "lucide-react"

export default function ContratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = parseInt(resolvedParams.id, 10)

  const [contrat, setContrat] = useState<Contrat | null>(null)
  const [bien, setBien] = useState<Bien | null>(null)
  const [locataire, setLocataire] = useState<Locataire | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getContrat(id)
      .then(async (data) => {
        setContrat(data)
        try {
          const [bienData, locData] = await Promise.all([
            getBienDetail(data.bien),
            getLocataireDetail(data.locataire)
          ])
          setBien(bienData)
          setLocataire(locData)
        } catch (e) {
          console.error("Erreur lors de la récupération des détails liés:", e)
        }
      })
      .catch(err => setError(err.message || "Erreur de chargement du contrat"))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return <div className="agent-loading">Chargement du contrat...</div>
  if (error) return (
    <div className="agent-empty">
      <h2>Chargement impossible</h2>
      <p>{error}</p>
      <button className="agent-btn agent-btn-primary" onClick={() => router.back()}>Retour</button>
    </div>
  )
  if (!contrat) return <div className="agent-empty"><h2>Contrat introuvable</h2></div>

  const isLocation = contrat.type_contrat === 'LOCATION'

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="agent-head">
        <button className="agent-back" onClick={() => router.back()} style={{ marginBottom: 0 }}>
          <ArrowLeft size={16} /> Retour aux contrats
        </button>
        <div className="agent-head-actions">
          <button className="agent-btn agent-btn-ghost" onClick={() => router.push(`/agent/contrats/${id}/modifier`)}>
            <Edit size={14} /> Modifier
          </button>
        </div>
      </div>

      <article className="panel">
        <div className="agent-panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <p className="eyebrow">CONTRAT #{contrat.id}</p>
          <h2 style={{ fontSize: 24, fontWeight: 750, margin: '6px 0 10px', letterSpacing: '-0.5px' }}>
            {isLocation ? 'Bail de location' : 'Contrat de vente'}
          </h2>
          <span className={`agent-badge ${contrat.statut === 'ACTIF' ? 'actif' : 'neutre'}`}>
            {contrat.statut || 'N/A'}
          </span>
        </div>

        <div className="agent-detail-grid">
          <div className="agent-detail-block">
            <div>
              <div className="agent-detail-label"><Home size={15} /> Bien concerné</div>
              <div className="agent-detail-value">{bien ? bien.titre : `Bien #${contrat.bien}`}</div>
              {bien && <div className="agent-detail-sub">{bien.adresse} (ID: #{bien.id})</div>}
            </div>

            <div>
              <div className="agent-detail-label"><User size={15} /> Locataire</div>
              <div className="agent-detail-value">
                {locataire ? `${locataire.user.prenoms} ${locataire.user.nom}` : `Locataire #${contrat.locataire}`}
              </div>
              {locataire && <div className="agent-detail-sub">{locataire.user.email} (ID: #{locataire.id})</div>}
            </div>

            <div>
              <div className="agent-detail-label"><Calendar size={15} /> Dates importantes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5 }}>
                <span><b>Créé le :</b> {new Date(contrat.date_creation).toLocaleDateString('fr-FR')}</span>
                <span><b>Début :</b> {contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString('fr-FR') : '—'}</span>
                {isLocation && (
                  <span><b>Fin :</b> {contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString('fr-FR') : 'Indéterminée'}</span>
                )}
                {contrat.date_paiement && (
                  <span><b>Date de paiement :</b> le {contrat.date_paiement} du mois</span>
                )}
              </div>
            </div>
          </div>

          <div className="agent-detail-block">
            <div>
              <div className="agent-detail-label"><FileText size={15} /> Données financières</div>
              {isLocation ? (
                <>
                  <div className="agent-money-row">
                    <span>Loyer mensuel</span>
                    <strong>{contrat.loyer ? `${Number(contrat.loyer).toLocaleString('fr-FR')} Ar` : 'N/A'}</strong>
                  </div>
                  <div className="agent-money-row">
                    <span>Dépôt de garantie</span>
                    <strong>{contrat.depot_garantie ? `${Number(contrat.depot_garantie).toLocaleString('fr-FR')} Ar` : 'N/A'}</strong>
                  </div>
                </>
              ) : (
                <div className="agent-money-row">
                  <span>Prix de vente</span>
                  <strong>{contrat.prix ? `${Number(contrat.prix).toLocaleString('fr-FR')} Ar` : 'N/A'}</strong>
                </div>
              )}
            </div>

            {contrat.document_pdf && (
              <div>
                <div className="agent-detail-label"><FileText size={15} /> Document joint</div>
                <a
                  className="agent-btn agent-btn-ghost"
                  href={contrat.document_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText size={15} /> Télécharger le PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
