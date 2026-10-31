'use client'

import { useState, useEffect, useMemo } from 'react'
import { FileX, ArrowLeft, Receipt } from 'lucide-react'
import { getPaiements, getContrats, getDemandesPaiement, Paiement, Contrat } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { PaiementStats } from "@/components/molecules/paiement_PaiementStats"
import { PaiementSearch } from "@/components/organisms/PaiementSearch"
import { PaiementFilters } from "@/components/organisms/PaiementFilters"
import { PaiementTable } from "@/components/organisms/PaiementTable"
import { PaiementForm } from "@/components/organisms/PaiementForm"
import { PaiementDetails } from "@/components/organisms/PaiementDetails"
import { ValidationDemandeModal } from "@/components/organisms/ValidationDemandeModal"
import { isMobileMoneyPending, getMobileMoneyOperator } from '@/lib/mobile-money'

type ActiveTab = 'actifs' | 'mobile_money' | 'resilies'

export default function PaiementPage() {
  const { t } = useTranslation()
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Onglet principal / mode d'affichage
  const [activeTab, setActiveTab] = useState<ActiveTab>('actifs')
  const showResilies = activeTab === 'resilies'

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
      const [data, dataContrats, dataDemandes] = await Promise.all([
        getPaiements(),
        getContrats().catch(() => []),
        getDemandesPaiement().catch(() => []),
      ])
      const cList = dataContrats || []
      setContrats(cList)
      const cMap = new Map<number, string>(cList.map(c => [c.id, c.statut]))

      // Associer les demandes de paiement en attente
      const pendingDemandesMap = new Map<number, any>()
      for (const d of (dataDemandes || [])) {
        if (d.statut === 'EN_ATTENTE' && d.facture) {
          pendingDemandesMap.set(d.facture, d)
        }
      }

      const enriched = (data || []).map(p => {
        const directCStatut = (p as any).contrat_statut || (typeof p.contrat === 'object' && p.contrat !== null ? (p.contrat as any).statut : undefined)
        const resolvedStatut = directCStatut || (typeof p.contrat === 'number' ? cMap.get(p.contrat) : undefined)
        const item: Paiement = resolvedStatut ? { ...p, contrat_statut: resolvedStatut } : { ...p }

        const pendingDemande = pendingDemandesMap.get(item.id)
        if (pendingDemande && !item.demande_en_cours) {
          item.demande_en_cours = {
            id: pendingDemande.id,
            statut: pendingDemande.statut,
            moyen_paiement: pendingDemande.moyen_paiement,
            date_demande: pendingDemande.date_demande,
            montant: String(pendingDemande.montant),
            telephone: pendingDemande.telephone,
            reference: pendingDemande.reference,
          }
        }
        if (pendingDemande && !item.mode_paiement) {
          item.mode_paiement = pendingDemande.moyen_paiement
        }
        if (pendingDemande?.reference && !item.reference) {
          item.reference = pendingDemande.reference
        }

        return item
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

  // Compteur dynamique fiable des demandes Mobile Money en attente de validation
  const mobileMoneyPendingCount = useMemo(() => {
    return paiementsNonResilies.filter(p => isMobileMoneyPending(p, isContratResilie)).length
  }, [paiementsNonResilies])

  // Derived state pour les demandes Mobile Money (onglet dédié)
  const filteredPaiementsMobileMoney = useMemo(() => {
    return paiementsNonResilies.filter(p => {
      if (!isMobileMoneyPending(p, isContratResilie)) return false

      const effectiveMode = p.demande_en_cours?.moyen_paiement || p.mode_paiement || ''
      const effectiveRef = p.demande_en_cours?.reference || p.reference || ''
      const searchStr = `${p.id} ${p.bien_titre} ${p.locataire_nom} ${effectiveRef}`.toLowerCase()
      const matchQuery = searchStr.includes(query.toLowerCase())

      const op = getMobileMoneyOperator(effectiveMode)
      const matchMode =
        modeFilter === 'Tous' ||
        (op && op === modeFilter) ||
        effectiveMode.toUpperCase() === modeFilter.toUpperCase()

      return matchQuery && matchMode
    })
  }, [paiementsNonResilies, query, modeFilter])

  // Derived state pour les paiements actifs (tableau principal)
  const filteredPaiementsActifs = useMemo(() => {
    return paiementsNonResilies.filter(p => {
      if (onlyMobileMoneyPending && !isMobileMoneyPending(p, isContratResilie)) {
        return false
      }
      const effectiveMode = p.demande_en_cours?.moyen_paiement || p.mode_paiement
      const effectiveRef = p.demande_en_cours?.reference || p.reference || ''
      const searchStr = `${p.id} ${p.bien_titre} ${p.locataire_nom} ${effectiveRef}`.toLowerCase()
      const matchQuery = searchStr.includes(query.toLowerCase())
      const matchStatut = onlyMobileMoneyPending ? true : (statutFilter === 'Tous' || p.statut === statutFilter)
      const matchMode = onlyMobileMoneyPending
        ? true
        : (modeFilter === 'Tous' || (effectiveMode === modeFilter) || (!effectiveMode && modeFilter === 'Tous'))
      
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

      {/* Onglets principaux : Paiements actifs vs Demandes Mobile Money vs Factures résiliées */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2.5">
        <div className="flex gap-2 flex-wrap items-center">
          {/* Onglet 1 : Paiements & Loyers actifs */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('actifs')
              setQuery('')
              setOnlyMobileMoneyPending(false)
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border transition-all ${
              activeTab === 'actifs'
                ? 'bg-blue-50 border-blue-600 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/50'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt size={15} />
            {t('admin.paiements.tab_active', 'Paiements & Loyers actifs')} ({paiementsNonResilies.length})
          </button>

          {/* Onglet 2 : Demandes Mobile Money avec badge de compteur dynamique */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('mobile_money')
              setQuery('')
              setModeFilter('Tous')
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border transition-all ${
              activeTab === 'mobile_money'
                ? 'bg-amber-50 border-amber-500 text-amber-950 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-600/60 shadow-xs'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
            title={t('admin.paiements.tab_mobile_money_title', 'Demandes Mobile Money à valider')}
          >
            <span> Demandes Mobile Money ({mobileMoneyPendingCount})</span>
            {mobileMoneyPendingCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  activeTab === 'mobile_money'
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-900'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                }`}
              >
                {mobileMoneyPendingCount}
              </span>
            )}
          </button>

          {/* Onglet 3 : Factures résiliées */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('resilies')
              setQuery('')
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border transition-all ${
              activeTab === 'resilies'
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
                  activeTab === 'resilies'
                    ? 'bg-red-600 text-white dark:bg-rose-500 dark:text-white'
                    : 'bg-red-100 text-red-700 dark:bg-rose-950/60 dark:text-rose-400'
                }`}
              >
                {paiementsResilies.length}
              </span>
            )}
          </button>
        </div>

        {activeTab !== 'actifs' && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('actifs')
              setQuery('')
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border bg-white border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft size={14} /> {t('admin.paiements.back_to_active', 'Retour aux paiements actifs')}
          </button>
        )}
      </div>

      <section className="panel user-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'resilies' ? (
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
        ) : activeTab === 'mobile_money' ? (
          <>
            {/* Bannière d'en-tête pour l'onglet dédié Mobile Money */}
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-2.5 flex-wrap">
              <div>
                <strong className="text-sm font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                  {t('admin.paiements.tab_mobile_money_title', 'Demandes Mobile Money à valider')} ({mobileMoneyPendingCount})
                </strong>
                <p className="m-0 mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                  {t('admin.paiements.mobile_money_banner_desc', 'Ces échéances comportent une demande de règlement par Mobile Money (MVola, Orange Money, Airtel Money) soumise par les locataires. Vérifiez la référence de transaction avant de valider l\'encaissement.')}
                </p>
              </div>
            </div>

            <div className="user-toolbar" style={{ paddingTop: '16px' }}>
              <PaiementSearch query={query} onQueryChange={setQuery} />
              <div className="flex gap-2 items-center">
                <select
                  className="filter-select px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                >
                  <option value="Tous">{t('admin.paiements.filter_all_operators', 'Tous les opérateurs Mobile Money')}</option>
                  <option value="MVOLA">MVola (Telma)</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                </select>
              </div>
            </div>

            <PaiementTable 
              paiements={filteredPaiementsMobileMoney}
              contrats={contrats}
              loading={loading}
              error={error}
              allowResilie={false}
              emptyMessage={t('admin.paiements.empty_mobile_money', 'Aucune demande Mobile Money en attente de validation.')}
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
