import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText } from 'lucide-react';
import { ReportingData } from '../hooks/useReporting';

export function ExportReports({ data }: { data: ReportingData }) {
  
  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(20);
    doc.text('Rapport d\'activité immobilière', 14, 22);
    
    // Stats générales
    doc.setFontSize(14);
    doc.text('Indicateurs Généraux', 14, 35);
    
    doc.setFontSize(10);
    doc.text(`Total des biens : ${data.biens.length}`, 14, 45);
    doc.text(`Biens loués : ${data.biens.filter(b => b.statut === 'LOUE').length}`, 14, 52);
    doc.text(`Biens disponibles : ${data.biens.filter(b => b.statut === 'DISPONIBLE').length}`, 14, 59);
    
    doc.text(`Contrats actifs : ${data.contrats.filter(c => c.statut === 'ACTIF').length}`, 100, 45);
    doc.text(`Paiements en retard : ${data.impayes.length}`, 100, 52);

    // Impayés Table
    doc.setFontSize(14);
    doc.text('Impayés et Retards', 14, 75);
    
    if (data.impayes.length > 0) {
      const impayesBody = data.impayes.map(p => [
        p.contrat.toString(),
        p.date_echeance || '-',
        p.montant_restant ? p.montant_restant.toString() : p.montant.toString(),
        p.statut
      ]);
      
      autoTable(doc, {
        startY: 80,
        head: [['Contrat ID', 'Echéance', 'Reste à payer', 'Statut']],
        body: impayesBody,
      });
    } else {
      doc.setFontSize(10);
      doc.text('Aucun impayé.', 14, 85);
    }

    doc.save('rapport_immobilier.pdf');
  };

  const exportCSV = () => {
    const headers = ['Type', 'ID', 'Statut', 'Montant'];
    const rows: string[] = [];
    
    data.biens.forEach(b => rows.push(`Bien,${b.id},${b.statut},${b.loyer_mensuel || b.prix || 0}`));
    data.impayes.forEach(p => rows.push(`Impaye,${p.contrat},${p.statut},${p.montant_restant || p.montant}`));
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n' 
      + rows.join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "rapport_donnees.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex space-x-4 mb-8">
      <button 
        onClick={exportPDF}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        <FileText className="w-4 h-4 mr-2" />
        Exporter PDF
      </button>
      <button 
        onClick={exportCSV}
        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 border rounded-md hover:bg-gray-200 transition"
      >
        <Download className="w-4 h-4 mr-2" />
        Exporter CSV
      </button>
    </div>
  );
}
