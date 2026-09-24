'use client'

import { useState } from 'react'
import { WalletCards, Calendar, User, FileText, Maximize2, CheckCircle2, XCircle } from 'lucide-react'
import { Paiement, validerPaiement, refuserPaiement } from '@/lib/api'
import { usePathname } from 'next/navigation'

interface AgentActionsProps {
  paiement: Paiement
  onStatusChange: (updated: Paiement) => void
}

export function AgentActions({ paiement, onStatusChange }: AgentActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showValidForm, setShowValidForm] = useState(false)
  const [mode, setMode] = useState('')
  const [ref, setRef] = useState('')
  const [error, setError] = useState('')

  if (paiement.statut !== 'EN_ATTENTE') return null

  const handleRefuser = async () => {
    if (!confirm('Êtes-vous sûr de vouloir refuser ce paiement ?')) return
    setLoading(true)
    try {
      const res = await refuserPaiement(paiement.id)
      onStatusChange(res)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleValiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mode) {
      setError('Veuillez choisir un moyen de paiement')
      return
    }
    const mobileModes = ['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY']
    if (mobileModes.includes(mode) && !ref.trim()) {
      setError('La référence est obligatoire pour le paiement mobile')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await validerPaiement(paiement.id, mode, ref)
      onStatusChange(res)
      setShowValidForm(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (showValidForm) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Valider le paiement</h2>
        <form onSubmit={handleValiderSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Moyen de paiement</label>
            <select 
              className="w-full text-sm p-2 rounded border border-blue-200 outline-none" 
              value={mode} 
              onChange={e => setMode(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Choisir --</option>
              <option value="ESPECE">Espèce</option>
              <option value="VIREMENT">Virement</option>
              <option value="CHEQUE">Chèque</option>
              <option value="MVOLA">Mvola</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="AIRTEL_MONEY">Airtel Money</option>
            </select>
          </div>
          {['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY'].includes(mode) && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Référence de transaction</label>
              <input 
                type="text" 
                className="w-full text-sm p-2 rounded border border-blue-200 outline-none" 
                value={ref} 
                onChange={e => setRef(e.target.value)}
                placeholder="Ex: 123456789"
                disabled={loading}
              />
            </div>
          )}
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded font-bold hover:bg-blue-700 transition">
              Confirmer
            </button>
            <button type="button" disabled={loading} onClick={() => setShowValidForm(false)} className="px-4 bg-gray-200 text-gray-700 text-sm rounded font-bold hover:bg-gray-300 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 p-4 border-t border-gray-100 bg-gray-50/80">
      <button 
        onClick={() => setShowValidForm(true)}
        className="flex-1 flex justify-center items-center gap-2 bg-green-100 text-green-700 py-2.5 rounded-lg font-bold text-sm hover:bg-green-200 transition"
      >
        <CheckCircle2 size={16} /> Valider
      </button>
      <button 
        onClick={handleRefuser}
        disabled={loading}
        className="flex-1 flex justify-center items-center gap-2 bg-red-100 text-red-700 py-2.5 rounded-lg font-bold text-sm hover:bg-red-200 transition"
      >
        <XCircle size={16} /> Refuser
      </button>
    </div>
  )
}



