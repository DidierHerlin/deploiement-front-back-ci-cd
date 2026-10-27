'use client'

import { useState, useEffect, useMemo } from 'react'
import { FileX, ArrowLeft, Receipt } from 'lucide-react'
import { getPaiements, getContrats, Paiement, Contrat } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { PaiementStats } from "@/components/molecules/paiement_PaiementStats"
import { PaiementSearch } from "@/components/organisms/PaiementSearch"
import { PaiementFilters } from "@/components/organisms/PaiementFilters"
import { PaiementTable } from "@/components/organisms/PaiementTable"
import { PaiementForm } from "@/components/organisms/PaiementForm"
import { PaiementDetails } from "@/components/organisms/PaiementDetails"
import { ValidationDemandeModal } from "@/components/organisms/ValidationDemandeModal"

export default function PaiementPage() {
  const { t } = useTranslation()
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Onglet / mode d'affichage (Paiements actifs vs Factures résiliées)
  const [showResilies, setShowResilies] = useState(false)

  // Search & Filters
  const [query, setQuery] = useState('')
  const [statutFilter, setStatutFilter] = useState('Tous')
  const [modeFilter, setModeFilter] = useState('Tous')
  const [onlyMobileMoneyPending, setOnlyMobileMoneyPending] = useState(false)
  
  // Modals state
  const [viewPaiement, setViewPaiement] = useState<Paiement | null>(null)
  const [editPaiement, setEditPaiement] = useState<Paiement | null>(null)
  const [validationPaiement, setValidationPaiement] = useState<Paiement | null>(null)
  const [validationAction, setValidationAction] = useState<'valider' | 'refuser'>('valider')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [data, dataContrats] = await Promise.all([
        getPaiements(),
        getContrats().catch(() => [])
      ])
      const cList = dataContrats || []
      setContrats(cList)
      const cMap = new Map<number, string>(cList.map(c => [c.id, c.statut]))
      const enriched = (data || []).map(p => {
        const directCStatut = (p as any).contrat_statut || (typeof p.contrat === 'object' && p.contrat !== null ? (p.contrat as any).statut : undefined)
        const resolvedStatut = directCStatut || (typeof p.contrat === 'number' ? cMap.get(p.contrat) : undefined)
        return resolvedStatut ? { ...p, contrat_statut: resolvedStatut } : p
      })
      setPaiements(enriched)
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Une erreur est survenue lors du chargement des données.")
    } finally {
      setLoading(false)
    }
  }

  const isContratResilie = (p: Paiement): boolean => {
    const directStatut = (p as any).contrat_statut
    if (typeof directStatut === 'string') {
      const s = directStatut.trim().toUpperCase()
      if (s === 'RESILIE' || s === 'RÉSILIÉ') return true
    }
    if (typeof p.contrat === 'object' && p.contrat !== null) {
      const s = (p.contrat as any).statut
      if (typeof s === 'string') {
        const sUpper = s.trim().toUpperCase()
        if (sUpper === 'RESILIE' || sUpper === 'RÉSILIÉ') return true
      }
    }
    const contratId = typeof p.contrat === 'object' && p.contrat !== null ? (p.contrat as any).id : p.contrat
    if (contratId && contrats && contrats.length > 0) {
      const c = contrats.find(contrat => contrat.id === contratId)
      if (c?.statut) {
        const sUpper = c.statut.trim().toUpperCase()
        if (sUpper === 'RESILIE' || sUpper === 'RÉSILIÉ') return true
      }
    }
    if (p.statut === 'RESILIE' || p.statut === 'RÉSILIÉ') return true
    return false
  }

  const paiementsNonResilies = useMemo(() => {
    return paiements.filter(p => !isContratResilie(p))
  }, [paiements, contrats])

  const paiementsResilies = useMemo(() => {
    return paiements.filter(p => isContratResilie(p))
  }, [paiements, contrats])

  const isMobileMoneyPending = (p: Paiement) =>
    p.statut === 'EN_ATTENTE' &&
    (['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY'].includes(p.demande_en_cours?.moyen_paiement || p.mode_paiement || '') || !!p.demande_en_cours)

  const mobileMoneyPendingCount = useMemo(() => {
    return paiementsNonResilies.filter(isMobileMoneyPending).length
  }, [paiementsNonResilies])

  // Derived state pour les paiements actifs (tableau principal)
  const filteredPaiementsActifs = useMemo(() => {
    return paiementsNonResilies.filter(p => {
      if (onlyMobileMoneyPending && !isMobileMoneyPending(p)) {
        return false
      }
      const effectiveMode = p.demande_en_cours?.moyen_paiement || p.mode_paiement
      const effectiveRef = p.demande_en_cours?.reference || p.reference || ''
      const searchStr = `${p.id} ${p.bien_titre} ${p.locataire_nom} ${effectiveRef}`.toLowerCase()
      const matchQuery = searchStr.includes(query.toLowerCase())
      const matchStatut = onlyMobileMoneyPending ? true : (statutFilter === 'Tous' || p.statut === statutFilter)
      const matchMode = onlyMobileMoneyPending ? true : (modeFilter === 'Tous' || (effectiveMode === modeFilter) || (!effectiveMode && modeFilter === 'Tous'))
      
      return matchQuery && matchStatut && matchMode
    })
  }, [paiementsNonResilies, query, statutFilter, modeFilter, onlyMobileMoneyPending])

  // Derived state pour les factures résiliées (autre tableau)
  const filteredPaiementsResilies = useMemo(() => {
    return paiementsResilies.filter(p => {
      const effectiveMode = p.demande_en_cours?.moyen_paiement || p.mode_paiement
      const effectiveRef = p.demande_en_cours?.reference || p.reference || ''
      const searchStr = `${p.id} ${p.bien_titre} ${p.locataire_nom} ${effectiveRef}`.toLowerCase()
      return searchStr.includes(query.toLowerCase())
    })
  }, [paiementsResilies, query])

  return (
    <>
      <div className="welcome-row mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            {t('admin.paiements.title_prefix', 'Gestion des')}{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{t('admin.paiements.title_span', 'Paiements')}</span>
          </h1>
          <p className="subtitle text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('admin.paiements.subtitle', "Supervisez l'ensemble des paiements, validez les demandes Mobile Money et générez les quittances.")}
          </p>
        </div>
      </div>

      <PaiementStats paiements={paiementsNonResilies} />

      {/* Onglets / Sélecteur de vue : Paiements actifs vs Factures résiliées */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowResilies(false)
              setQuery('')
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border transition-all ${
              !showResilies
                ? 'bg-blue-50 border-blue-600 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/50'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt size={15} />
            {t('admin.paiements.tab_active', 'Paiements & Loyers actifs')} ({paiementsNonResilies.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setShowResilies(true)
              setQuery('')
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border transition-all ${
              showResilies
                ? 'bg-red-50 border-red-600 text-red-600 dark:bg-red-950/40 dark:text-rose-400 dark:border-rose-500/50'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
            title={t('admin.paiements.tab_cancelled', 'Afficher les factures résiliées')}
          >
            <FileX size={15} />
            {t('admin.paiements.tab_cancelled', 'Afficher les factures résiliées')}
            {paiementsResilies.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  showResilies
                    ? 'bg-red-600 text-white dark:bg-rose-500 dark:text-white'
                    : 'bg-red-100 text-red-700 dark:bg-rose-950/60 dark:text-rose-400'
                }`}
              >
                {paiementsResilies.length}
              </span>
            )}
          </button>
        </div>

        {showResilies && (
          <button
            type="button"
            onClick={() => {
              setShowResilies(false)
              setQuery('')
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border bg-white border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft size={14} /> {t('admin.paiements.back_to_active', 'Retour aux paiements actifs')}
          </button>
        )}
      </div>

      <section className="panel user-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showResilies ? (
          <>
            {/* Bannière d'en-tête pour le tableau des factures résiliées */}
            <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/50 flex items-center justify-between gap-2.5 flex-wrap">
              <div>
                <strong className="text-sm font-bold text-red-900 dark:text-red-300">
                  {t('admin.paiements.tab_cancelled_table_title', 'Tableau des factures résiliées')}
                </strong>
                <p className="m-0 mt-0.5 text-xs text-red-700 dark:text-red-400">
                  {t('admin.paiements.cancelled_banner_desc', 'Ces paiements et échéances correspondent à des contrats résiliés ({count} facture(s)). Ils ne sont pas comptabilisés dans les paiements actifs.', { count: paiementsResilies.length })}
                </p>
              </div>
            </div>

            <div className="user-toolbar" style={{ paddingTop: '16px' }}>
              <PaiementSearch query={query} onQueryChange={setQuery} />
            </div>

            <PaiementTable 
              paiements={filteredPaiementsResilies}
              contrats={contrats}
              loading={loading}
              error={error}
              allowResilie={true}
              emptyMessage={t('admin.paiements.empty_cancelled', 'Aucune facture résiliée trouvée.')}
              onView={setViewPaiement}
              onEdit={setEditPaiement}
            />
          </>
        ) : (
          <>
            <div className="user-toolbar">
              <PaiementSearch query={query} onQueryChange={setQuery} />
              <PaiementFilters 
                statutFilter={statutFilter} setStatutFilter={setStatutFilter}
                modeFilter={modeFilter} setModeFilter={setModeFilter}
                onlyMobileMoneyPending={onlyMobileMoneyPending}
                setOnlyMobileMoneyPending={setOnlyMobileMoneyPending}
                mobileMoneyPendingCount={mobileMoneyPendingCount}
              />
            </div>

            <PaiementTable 
              paiements={filteredPaiementsActifs}
              contrats={contrats}
              loading={loading}
              error={error}
              allowResilie={false}
              emptyMessage={t('admin.paiements.empty_active', 'Aucun paiement trouvé.')}
              onView={setViewPaiement}
              onEdit={setEditPaiement}
              onValiderDemande={(p) => {
                setValidationPaiement(p)
                setValidationAction('valider')
              }}
              onRefuserDemande={(p) => {
                setValidationPaiement(p)
                setValidationAction('refuser')
              }}
            />
          </>
        )}
      </section>

      {editPaiement && (
        <PaiementForm 
          paiement={editPaiement}
          onClose={() => setEditPaiement(null)}
          onSuccess={() => {
            setEditPaiement(null)
            fetchData()
          }}
        />
      )}

      {viewPaiement && (
        <PaiementDetails 
          paiement={viewPaiement}
          onClose={() => setViewPaiement(null)}
          onValiderDemande={(p) => {
            setViewPaiement(null)
            setValidationPaiement(p)
            setValidationAction('valider')
          }}
          onRefuserDemande={(p) => {
            setViewPaiement(null)
            setValidationPaiement(p)
            setValidationAction('refuser')
          }}
        />
      )}

      {validationPaiement && (
        <ValidationDemandeModal
          paiement={validationPaiement}
          isOpen={!!validationPaiement}
          initialAction={validationAction}
          onClose={() => setValidationPaiement(null)}
          onSuccess={() => {
            setValidationPaiement(null)
            fetchData()
          }}
        />
      )}
    </>
  )
}
