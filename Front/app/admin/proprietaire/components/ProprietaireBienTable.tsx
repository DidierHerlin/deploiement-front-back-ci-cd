import { useState } from 'react'
import { Bien } from '@/lib/api'
import { Plus, X } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'

type ProprietaireBienTableProps = {
  biens: Bien[]
  onClose: () => void
  onAssignClick: () => void
}

export function ProprietaireBienTable({ biens, onClose, onAssignClick }: ProprietaireBienTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(biens.length / ITEMS_PER_PAGE);
  const paginatedData = biens.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const formatStatut = (statut: string) => {
    switch(statut) {
      case 'DISPONIBLE': return <span className="status paid"><i />Disponible</span>
      case 'RESERVE': return <span className="status pending"><i />Réservé</span>
      case 'LOUE': return <span className="status paid" style={{ background: '#e0e7ff', color: '#4f46e5' }}><i style={{ background: '#4f46e5' }} />Loué</span>
      case 'VENDU': return <span className="status disabled"><i />Vendu</span>
      case 'EN_TRAVAUX': return <span className="status pending" style={{ background: '#fff0f1', color: '#ef6a76' }}><i style={{ background: '#ef6a76' }} />En travaux</span>
      default: return <span className="status disabled"><i />{statut}</span>
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" style={{ maxWidth: '800px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        <h2>Biens immobiliers associés</h2>
        
        <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="primary-button" onClick={onAssignClick}><Plus size={16} /> Associer un bien existant</button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>RÉF</th>
                <th>TITRE</th>
                <th>TYPE / OPÉRATION</th>
                <th>STATUT</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? paginatedData.map(bien => (
                <tr key={bien.id}>
                  <td>#{bien.id}</td>
                  <td>
                    <strong>{bien.titre}</strong>
                    <small style={{ display: 'block', color: '#666' }}>{bien.adresse}</small>
                  </td>
                  <td>{bien.type} • {bien.mode_transaction}</td>
                  <td>{formatStatut(bien.statut)}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>Aucun bien associé à ce propriétaire.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="outline-button" onClick={onClose}>Fermer</button>
        </div>
      </section>
    </div>
  )
}
