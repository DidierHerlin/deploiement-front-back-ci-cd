import React from 'react';
import { FileText, Download, CalendarDays, Loader2, Search } from 'lucide-react';
import { Paiement, Contrat } from '@/lib/api';

interface QuittanceListProps {
  paiements: Paiement[];
  contrats: Contrat[];
  loading: boolean;
}

export function QuittanceList({ paiements, contrats, loading }: QuittanceListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleDownloadQuittance = async (paiementId: number) => {
    try {
      const { fetchBlob } = await import('@/lib/api');
      const blob = await fetchBlob(`/paiements/${paiementId}/quittance/`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Quittance_Loyer_${paiementId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors du téléchargement", error);
      alert("Impossible de télécharger la quittance.");
    }
  };

  const getContratTitre = (contratId: number) => {
    const c = contrats.find(c => c.id === contratId);
    return c ? c.bien_titre : 'Contrat inconnu';
  };

  // Filtrer uniquement les paiements validés qui ont une quittance théoriquement disponible
  let quittancesDisponibles = paiements.filter(p => p.statut === 'PAYE' || p.statut === 'VALIDE');

  if (searchTerm) {
    quittancesDisponibles = quittancesDisponibles.filter(p => {
      const periode = new Date(p.date_echeance).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return periode.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }

  // Trier par date la plus récente
  quittancesDisponibles.sort((a, b) => new Date(b.date_echeance).getTime() - new Date(a.date_echeance).getTime());

  if (loading) {
    return (
      <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Mes Quittances de Loyer</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Téléchargez les reçus officiels de vos paiements validés.</p>
        </div>
        <div style={{ position: 'relative', width: '250px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Rechercher une période..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #ddd', borderRadius: '6px' }}
          />
        </div>
      </div>

      {quittancesDisponibles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #ccc' }}>
          <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          <h3>Aucune quittance disponible</h3>
          <p>Les quittances s'affichent ici une fois vos paiements de loyer validés.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {quittancesDisponibles.map(paiement => {
            const periode = new Date(paiement.date_echeance).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
            const datePaiement = paiement.date_paiement ? new Date(paiement.date_paiement).toLocaleDateString('fr-FR') : '-';
            const contratTitre = getContratTitre(paiement.contrat);
            
            // Calcul du montant (Règle : contrat.loyer)
            const c = contrats.find(c => c.id === paiement.contrat);
            const montantEffectif = c ? parseFloat(c.loyer || '0') : parseFloat(paiement.montant_paye || '0');
            const montantFormat = `${montantEffectif.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ar`;

            return (
              <div key={paiement.id} style={{ border: '1px solid #eaeaea', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#fff', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column' }} className="hover-shadow">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                    <FileText size={20} />
                    <span style={{ fontWeight: 600 }}>Quittance {periode}</span>
                  </div>
                  <span style={{ fontSize: '11px', backgroundColor: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    N° {paiement.id.toString().padStart(4, '0')}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bien concerné:</span>
                    <strong style={{ color: 'var(--text)' }}>{contratTitre}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Montant réglé:</span>
                    <strong style={{ color: 'var(--text)' }}>{montantFormat}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date de règlement:</span>
                    <strong style={{ color: 'var(--text)' }}>{datePaiement}</strong>
                  </div>
                </div>

                <button 
                  onClick={() => handleDownloadQuittance(paiement.id)}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                >
                  <Download size={16} />
                  Télécharger le PDF
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
