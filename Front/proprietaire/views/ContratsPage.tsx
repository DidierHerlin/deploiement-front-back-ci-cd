'use client'

import { useState, useEffect } from 'react'
import { FileText, Download } from 'lucide-react'
import { getContrats, Contrat } from '@/lib/api'
import { ContratList } from "@/components/organisms/contrat_ContratList"

export function ContratsPage() {
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContrats = async () => {
    try {
      setLoading(true)
      const data = await getContrats()
      setContrats(data)
    } catch (err) {
      console.error("Erreur chargement contrats", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContrats()
  }, [])

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MES CONTRATS</p>
          <h1>Suivez <span>vos locations et ventes.</span></h1>
          <p className="subtitle">Consultez les contrats liés à l'ensemble de vos biens immobiliers.</p>
        </div>
      </div>

      <section className="panel mt-6">
        <div className="panel-header" style={{ marginBottom: '20px' }}>
          <div>
            <h2>Liste de vos contrats</h2>
            <p>Retrouvez tous les contrats actifs ou terminés associés à vos biens.</p>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-[#8993a3]">Chargement de vos contrats...</div>
        ) : (
          <ContratList contrats={contrats} />
        )}
      </section>
    </>
  )
}
