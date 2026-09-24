import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText } from 'lucide-react';
import { ReportingData } from '../hooks/useReporting';

export function ExportReports({ data }: { data: ReportingData }) {
  
  const exportPDF = () => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [30, 58, 138]; // #1e3a8a
    const secondaryColor: [number, number, number] = [107, 114, 128]; // gray-500
    
    // En-tête
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text('RAPPORT D\'ACTIVITÉ IMMOBILIÈRE', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Généré le ${dateStr}`, 14, 30);
    
    // Ligne de séparation
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(14, 45, 196, 45);
    
    // Stats générales
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Indicateurs Généraux', 14, 55);
    
    const loues = data.biens.filter(b => b.statut === 'LOUE').length;
    const dispos = data.biens.filter(b => b.statut === 'DISPONIBLE').length;
    const actifs = data.contrats.filter(c => c.statut === 'ACTIF').length;
    
    // "Cartes" pour les stats
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 60, 85, 30, 2, 2, 'FD');
    doc.roundedRect(110, 60, 85, 30, 2, 2, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.text('Parc Immobilier', 18, 68);
    doc.text('Activité & Finances', 114, 68);
    
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.text(`Total des biens : ${data.biens.length}`, 18, 76);
    doc.text(`Contrats actifs : ${actifs}`, 114, 76);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Loués : ${loues} | Disponibles : ${dispos}`, 18, 84);
    doc.text(`Paiements en retard : ${data.impayes.length}`, 114, 84);

    // Section Impayés
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Détail des Impayés et Retards', 14, 105);
    
    if (data.impayes.length > 0) {
      const impayesBody = data.impayes.map(p => [
        p.bien_titre || `Contrat #${p.contrat}`,
        p.locataire_nom || 'Inconnu',
        p.date_echeance ? new Date(p.date_echeance).toLocaleDateString('fr-FR') : '-',
        `${Number(p.montant_restant || p.montant || 0).toLocaleString('fr-FR')} Ar`,
        p.statut === 'EN_RETARD' ? 'En retard' : p.statut
      ]);
      
      autoTable(doc, {
        startY: 110,
        head: [['Bien', 'Locataire', 'Échéance', 'Reste à payer', 'Statut']],
        body: impayesBody,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });
    } else {
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...secondaryColor);
      doc.text('Aucun impayé à signaler à ce jour.', 14, 115);
    }
    
    // Pagination (footer)
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${i} sur ${pageCount} - Logiciel Horizon`, 105, 290, { align: 'center' });
    }

    doc.save(`Rapport_Horizon_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportCSV = () => {
    const separator = ';';
    const rows: string[] = [];
    
    rows.push('RAPPORT D\'ACTIVITE IMMOBILIERE');
    rows.push(`Date d'exportation : ${new Date().toLocaleDateString('fr-FR')}`);
    rows.push('');
    
    rows.push('--- SYNTHESE GLOBALE ---');
    rows.push(`Indicateur${separator}Valeur`);
    rows.push(`Total des biens${separator}${data.biens.length}`);
    rows.push(`Biens loués${separator}${data.biens.filter(b => b.statut === 'LOUE').length}`);
    rows.push(`Biens disponibles${separator}${data.biens.filter(b => b.statut === 'DISPONIBLE').length}`);
    rows.push(`Contrats actifs${separator}${data.contrats.filter(c => c.statut === 'ACTIF').length}`);
    rows.push(`Paiements en retard${separator}${data.impayes.length}`);
    rows.push('');
    
    rows.push('--- DETAILS DES BIENS ---');
    rows.push(['Référence/ID', 'Titre', 'Type', 'Statut', 'Prix/Loyer (Ariary)', 'Adresse'].join(separator));
    data.biens.forEach(b => {
       const loyer = b.loyer_mensuel || b.prix || 0;
       rows.push([b.id, `"${b.titre || ''}"`, b.type, b.statut, loyer, `"${b.adresse || ''}"`].join(separator));
    });
    rows.push('');
    
    rows.push('--- DETAILS DES IMPAYES ---');
    rows.push(['Contrat', 'Bien', 'Locataire', 'Statut', 'Reste à payer (Ariary)', 'Date d\'échéance'].join(separator));
    data.impayes.forEach(p => {
       const montant = p.montant_restant || p.montant || 0;
       const dateEcheance = p.date_echeance ? new Date(p.date_echeance).toLocaleDateString('fr-FR') : '';
       rows.push([p.contrat, `"${p.bien_titre || ''}"`, `"${p.locataire_nom || ''}"`, p.statut, montant, dateEcheance].join(separator));
    });
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const csvContent = rows.join('\n');
    
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Rapport_Horizon_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex space-x-4 mb-8">
      <button 
        onClick={exportPDF}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm font-medium"
      >
        <FileText className="w-5 h-5 mr-2" />
        Exporter en PDF
      </button>
      <button 
        onClick={exportCSV}
        className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition shadow-sm font-medium"
      >
        <Download className="w-5 h-5 mr-2" />
        Exporter en CSV
      </button>
    </div>
  );
}
