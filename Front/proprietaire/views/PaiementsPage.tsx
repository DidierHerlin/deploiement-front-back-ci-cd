'use client'

import { useState, useEffect } from 'react'
import { WalletCards } from 'lucide-react'
import { getPaiements, Paiement } from '@/lib/api'
import { PaiementList } from "@/components/organisms/paiements_PaiementList"
import { useTranslation } from '@/lib/i18n'

export function PaiementsPage() {
  const { t } = useTranslation()
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<string>('')

  const fetchPaiements = async () => {
    try {
      setLoading(true)
      const data = await getPaiements()
      setPaiements(data)
    } catch (err) {
      console.error("Erreur chargement paiements", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaiements()
  }, [])

  // Le propriétaire ne doit voir que les paiements validés (PAYE) ou en retard (EN_RETARD)
  const paiementsFiltresBase = paiements.filter(
    p => p.statut === 'PAYE' || p.statut === 'EN_RETARD'
  )

  const uniqueStatuts = Array.from(new Set(paiementsFiltresBase.map(p => p.statut))).sort()

  const filteredPaiements = paiementsFiltresBase.filter(paiement => {
    if (filterStatut && paiement.statut !== filterStatut) return false
    return true
  })

  const formatStatut = (s: string) => {
    switch (s) {
      case 'EN_ATTENTE': return t("dashboard.common.status_en_attente", "En attente")
      case 'PAYE': return t("dashboard.common.status_paye", "Payé")
      case 'EN_RETARD': return t("dashboard.common.status_en_retard", "En retard")
      case 'ECHOUE': return t("dashboard.common.status_echoue", "Échoué")
      case 'REMBOURSE': return t("dashboard.common.status_rembourse", "Remboursé")
      default: return s
    }
  }

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{t("proprietaire_pages.paiements.eyebrow", "MES PAIEMENTS")}</p>
          <h1>{t("proprietaire_pages.paiements.title_main", "Suivez")} <span>{t("proprietaire_pages.paiements.title_highlight", "vos revenus.")}</span></h1>
          <p className="subtitle">{t("proprietaire_pages.paiements.subtitle", "Consultez l'historique et le statut des paiements liés à vos biens.")}</p>
        </div>
      </div>

      <section className="panel mt-6">
        <div className="panel-header flex-col md:flex-row gap-4" style={{ marginBottom: '20px' }}>
          <div>
            <h2>{t("proprietaire_pages.paiements.list_title", "Historique des paiements")}</h2>
            <p>{t("proprietaire_pages.paiements.list_sub", "Retrouvez tous les versements, loyers et achats associés à vos contrats.")}</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={filterStatut} 
              onChange={(e) => setFilterStatut(e.target.value)}
              className="border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-600 bg-white"
            >
              <option value="">{t("proprietaire_pages.paiements.filter_status", "Tous les statuts")}</option>
              {uniqueStatuts.map(s => <option key={s} value={s}>{formatStatut(s)}</option>)}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-[#8993a3]">{t("proprietaire_pages.paiements.loading", "Chargement de vos paiements...")}</div>
        ) : (
          <PaiementList paiements={filteredPaiements} onUpdate={() => fetchPaiements()} />
        )}
      </section>
    </>
  )
}
