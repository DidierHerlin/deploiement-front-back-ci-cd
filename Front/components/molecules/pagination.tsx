import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          background: currentPage === 1 ? '#f8fafc' : '#fff',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          color: currentPage === 1 ? '#94a3b8' : '#334155'
        }}
        aria-label="Page précédente"
      >
        <ChevronLeft size={16} />
      </button>
      <span style={{ fontSize: '13px', color: '#64748b', margin: '0 4px' }}>
        Page {currentPage} sur {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          background: currentPage === totalPages ? '#f8fafc' : '#fff',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          color: currentPage === totalPages ? '#94a3b8' : '#334155'
        }}
        aria-label="Page suivante"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
