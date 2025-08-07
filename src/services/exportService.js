import toast from 'react-hot-toast';

/**
 * Servizio per esportare dati in vari formati
 */
export const exportService = {
  /**
   * Esporta dati in formato CSV/Excel
   */
  exportToCSV: (data, filename = 'export.csv') => {
    try {
      // Converti array di oggetti in CSV
      if (!data || data.length === 0) {
        toast.error('Nessun dato da esportare');
        return;
      }

      // Ottieni le intestazioni dalle chiavi del primo oggetto
      const headers = Object.keys(data[0]);
      
      // Crea le righe CSV
      const csvContent = [
        headers.join(','), // intestazioni
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Gestisci valori con virgole o a capo
            if (value && (value.toString().includes(',') || value.toString().includes('\n'))) {
              return `"${value.toString().replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // Crea il blob e scarica
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('File esportato con successo!');
    } catch (error) {
      console.error('Errore export CSV:', error);
      toast.error('Errore durante l\'esportazione');
    }
  },

  /**
   * Esporta atleti in formato CSV
   */
  exportAthletes: (athletes) => {
    const dataToExport = athletes.map(athlete => ({
      'Nome': athlete.firstName,
      'Cognome': athlete.lastName,
      'Data di Nascita': athlete.birthDate ? new Date(athlete.birthDate).toLocaleDateString('it-IT') : '',
      'Codice Fiscale': athlete.fiscalCode || '',
      'Email': athlete.email || '',
      'Telefono': athlete.phone || '',
      'Indirizzo': athlete.address || '',
      'Città': athlete.city || '',
      'Squadra': athlete.team?.name || '',
      'Ruolo': athlete.position?.name || '',
      'Stato': athlete.status === 'ACTIVE' ? 'Attivo' : athlete.status === 'INJURED' ? 'Infortunato' : 'Inattivo',
      'Nome Genitore': athlete.parentName || '',
      'Tel. Genitore': athlete.parentPhone || '',
      'Email Genitore': athlete.parentEmail || '',
      'Scadenza Certificato': athlete.medicalCertificateExpiry ? new Date(athlete.medicalCertificateExpiry).toLocaleDateString('it-IT') : '',
      'Note': athlete.notes || ''
    }));

    const filename = `atleti_${new Date().toISOString().split('T')[0]}.csv`;
    exportService.exportToCSV(dataToExport, filename);
  },

  /**
   * Genera PDF (versione semplificata - stampa della pagina)
   */
  exportToPDF: (title = 'Report') => {
    // Per ora usiamo la stampa del browser
    // In futuro si può integrare una libreria come jsPDF
    
    // Salva il titolo originale
    const originalTitle = document.title;
    
    // Imposta il titolo per la stampa
    document.title = title;
    
    // Apri la finestra di stampa
    window.print();
    
    // Ripristina il titolo originale
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  },

  /**
   * Prepara i dati per la condivisione via email
   */
  shareViaEmail: (subject, body, attachmentData = null) => {
    try {
      // Crea il link mailto
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Apri il client email
      window.location.href = mailtoLink;
      
      toast.success('Apertura client email...');
    } catch (error) {
      console.error('Errore condivisione:', error);
      toast.error('Errore durante la condivisione');
    }
  },

  /**
   * Condividi lista atleti via email
   */
  shareAthletes: (athletes) => {
    const subject = `Lista Atleti - ${new Date().toLocaleDateString('it-IT')}`;
    
    let body = 'Lista Atleti della Società:\n\n';
    
    athletes.forEach((athlete, index) => {
      body += `${index + 1}. ${athlete.firstName} ${athlete.lastName}\n`;
      body += `   Nato il: ${athlete.birthDate ? new Date(athlete.birthDate).toLocaleDateString('it-IT') : 'N/D'}\n`;
      body += `   Squadra: ${athlete.team?.name || 'Nessuna'}\n`;
      body += `   Stato: ${athlete.status === 'ACTIVE' ? 'Attivo' : 'Inattivo'}\n`;
      body += `   Contatto: ${athlete.phone || athlete.email || 'N/D'}\n\n`;
    });
    
    body += `\n\nTotale atleti: ${athletes.length}`;
    body += `\n\n---\nGenerato da Soccer Management System`;
    
    exportService.shareViaEmail(subject, body);
  },

  /**
   * Stampa dettaglio singolo atleta
   */
  printAthleteDetail: (athlete) => {
    // Crea un contenuto stampabile
    const printContent = `
      <html>
        <head>
          <title>Scheda Atleta - ${athlete.firstName} ${athlete.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            .section { margin: 20px 0; }
            .section h2 { color: #374151; font-size: 18px; margin-bottom: 10px; }
            .field { margin: 8px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; }
            .status { 
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 14px;
              font-weight: 500;
            }
            .status.active { background: #dcfce7; color: #166534; }
            .status.inactive { background: #f3f4f6; color: #374151; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Scheda Atleta</h1>
          
          <div class="section">
            <h2>Dati Anagrafici</h2>
            <div class="field">
              <span class="label">Nome:</span> 
              <span class="value">${athlete.firstName} ${athlete.lastName}</span>
            </div>
            <div class="field">
              <span class="label">Data di Nascita:</span> 
              <span class="value">${athlete.birthDate ? new Date(athlete.birthDate).toLocaleDateString('it-IT') : '-'}</span>
            </div>
            <div class="field">
              <span class="label">Codice Fiscale:</span> 
              <span class="value">${athlete.fiscalCode || '-'}</span>
            </div>
            <div class="field">
              <span class="label">Stato:</span> 
              <span class="status ${athlete.status === 'ACTIVE' ? 'active' : 'inactive'}">
                ${athlete.status === 'ACTIVE' ? 'Attivo' : 'Inattivo'}
              </span>
            </div>
          </div>
          
          <div class="section">
            <h2>Contatti</h2>
            <div class="field">
              <span class="label">Email:</span> 
              <span class="value">${athlete.email || '-'}</span>
            </div>
            <div class="field">
              <span class="label">Telefono:</span> 
              <span class="value">${athlete.phone || '-'}</span>
            </div>
            <div class="field">
              <span class="label">Indirizzo:</span> 
              <span class="value">${athlete.address || '-'} ${athlete.city || ''}</span>
            </div>
          </div>
          
          ${athlete.parentName ? `
          <div class="section">
            <h2>Genitore/Tutore</h2>
            <div class="field">
              <span class="label">Nome:</span> 
              <span class="value">${athlete.parentName}</span>
            </div>
            <div class="field">
              <span class="label">Telefono:</span> 
              <span class="value">${athlete.parentPhone || '-'}</span>
            </div>
            <div class="field">
              <span class="label">Email:</span> 
              <span class="value">${athlete.parentEmail || '-'}</span>
            </div>
          </div>
          ` : ''}
          
          <div class="section">
            <h2>Certificato Medico</h2>
            <div class="field">
              <span class="label">Data Rilascio:</span> 
              <span class="value">${athlete.medicalCertificateDate ? new Date(athlete.medicalCertificateDate).toLocaleDateString('it-IT') : '-'}</span>
            </div>
            <div class="field">
              <span class="label">Data Scadenza:</span> 
              <span class="value">${athlete.medicalCertificateExpiry ? new Date(athlete.medicalCertificateExpiry).toLocaleDateString('it-IT') : '-'}</span>
            </div>
          </div>
          
          ${athlete.notes ? `
          <div class="section">
            <h2>Note</h2>
            <div class="field">
              <span class="value">${athlete.notes}</span>
            </div>
          </div>
          ` : ''}
          
          <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            Stampato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}
            <br>Soccer Management System
          </div>
        </body>
      </html>
    `;

    // Apri una nuova finestra e stampa
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};
