'use client'

import { useState } from 'react'
import { Bien, deleteBien } from '@/lib/api'
import { X, Trash2 } from 'lucide-react'

interface DeleteBienModalProps {
  bien: Bien
  onClose: (refresh?: boolean) => void
}

export function DeleteBienModal({ bien, onClose }: DeleteBienModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      await deleteBien(bien.id)
      onClose(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Erreur lors de la suppression du bien.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" onClick={() => onClose()}><X size={20} /></button>
        <div className="modal-icon !bg-red-50 !text-red-600 mb-4 flex items-center justify-center rounded-full w-12 h-12">
          <Trash2 size={24} />
        </div>
        <h2 className="mb-2 text-lg font-bold text-gray-900">Supprimer ce bien ?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Êtes-vous sûr de vouloir supprimer le bien <strong>{bien.titre}</strong> ? Cette action est irréversible et toutes les données associées seront perdues.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-2">
          <button 
            type="button" 
            onClick={() => onClose()} 
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button 
            type="button" 
            onClick={handleDelete}
            disabled={loading} 
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            {loading ? 'Suppression...' : 'Oui, supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}
