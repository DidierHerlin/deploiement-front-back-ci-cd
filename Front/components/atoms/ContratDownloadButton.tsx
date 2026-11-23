'use client'

import React, { useState } from 'react'
import { FileDown, Loader2, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export type ContratButtonVariant = 'primary' | 'emerald' | 'outline' | 'ghost' | 'icon'
export type ContratButtonSize = 'sm' | 'md' | 'lg'

interface ContratDownloadButtonProps {
  contratId: number
  typeContrat?: string
  clientName?: string
  bienTitle?: string
  variant?: ContratButtonVariant
  size?: ContratButtonSize
  className?: string
  style?: React.CSSProperties
  label?: string
  iconOnly?: boolean
  showBadge?: boolean
}

export function ContratDownloadButton({ 
  contratId, 
  typeContrat, 
  clientName,
  bienTitle,
  variant = 'emerald',
  size = 'md',
  className = '',
  style,
  label,
  iconOnly = false,
  showBadge = false
}: ContratDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLocation = typeContrat === 'LOCATION'

  const defaultLabel = label || (isLocation ? 'Télécharger le bail' : "Télécharger le contrat")
  const buttonTitle = isLocation 
    ? `Télécharger le contrat de bail (PDF) #${contratId}` 
    : `Télécharger le contrat de vente immobilière (PDF) #${contratId}`

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const { fetchBlob } = await import('@/lib/api')
      const blob = await fetchBlob(`/contrats/${contratId}/telecharger/`)

      // Construire un nom de fichier explicite et propre
      const prefix = isLocation ? 'Contrat_Bail' : 'Contrat_Vente'
      const sanitizedClient = clientName ? clientName.replace(/\s+/g, '_') : ''
      const sanitizedBien = bienTitle ? bienTitle.replace(/\s+/g, '_') : ''
      const detailsPart = [sanitizedClient, sanitizedBien].filter(Boolean).join('_')
      const filename = detailsPart ? `${prefix}_${detailsPart}_#${contratId}.pdf` : `${prefix}_#${contratId}.pdf`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      // Nettoyage mémoire
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 150)

      setSuccess(true)
      toast.success(
        isLocation 
          ? `Bail de location #${contratId} téléchargé avec succès !` 
          : `Contrat de vente #${contratId} téléchargé avec succès !`
      )

      setTimeout(() => {
        setSuccess(false)
      }, 2500)
    } catch (err: any) {
      const errMsg = err.message || 'Impossible de générer le document PDF.'
      setError(errMsg)
      toast.error(`Erreur téléchargement contrat #${contratId}: ${errMsg}`)
    } finally {
      setLoading(false) 
    }
  }

  // Configuration des tailles
  const sizeClasses: Record<ContratButtonSize, string> = {
    sm: iconOnly ? 'p-1.5 text-xs' : 'px-2.5 py-1.5 text-xs gap-1.5',
    md: iconOnly ? 'p-2 text-xs' : 'px-3.5 py-2 text-xs gap-2',
    lg: iconOnly ? 'p-2.5 text-sm' : 'px-4 py-2.5 text-sm gap-2.5'
  }

  const iconSizes: Record<ContratButtonSize, number> = {
    sm: 13,
    md: 15,
    lg: 17
  }

  // Configuration des variantes graphiques
  const variantClasses: Record<ContratButtonVariant, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow transition-all focus-visible:ring-blue-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow transition-all focus-visible:ring-emerald-500',
    outline: 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition-all focus-visible:ring-slate-400',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors focus-visible:ring-slate-400',
    icon: 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors rounded-lg'
  }

  // État de succès
  const currentVariantClass = success 
    ? 'bg-emerald-700 text-white shadow-sm'
    : (variantClasses[variant] || variantClasses.emerald)

  const isIconOnly = iconOnly || variant === 'icon'

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button 
        type="button"
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-all select-none cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${sizeClasses[size]} ${currentVariantClass} ${className}`}
        onClick={handleDownload}
        disabled={loading}
        title={buttonTitle}
        aria-label={buttonTitle}
        style={style}
      >
        {loading ? (
          <Loader2 size={iconSizes[size]} className="animate-spin text-current" />
        ) : success ? (
          <Check size={iconSizes[size]} className="text-current animate-in zoom-in-75 duration-200" />
        ) : (
          <FileDown size={iconSizes[size]} className="text-current transition-transform group-hover:translate-y-0.5" />
        )}

        {!isIconOnly && (
          <span className="font-semibold tracking-wide">
            {loading ? 'Génération...' : success ? 'Téléchargé !' : defaultLabel}
          </span>
        )}

        {showBadge && !loading && !success && (
          <span className="ml-1 text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-black/15 text-white/90">
            PDF
          </span>
        )}
      </button>

      {error && !iconOnly && (
        <span className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
          <AlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  )
}
