import React, { useState } from 'react';
import {
  PrinterIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PhotoIcon,
  EnvelopeIcon,
  LinkIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { exportService } from '../../services/exportService';

/**
 * Componente universale per azioni CRUD + Export/Share
 * Utilizzabile in tutte le pagine del sistema
 */
const UniversalActions = ({
  // Props per identificazione
  entityName = 'elemento',        // Nome entità (atleta, documento, etc.)
  entityNamePlural = 'elementi',  // Nome plurale
  
  // Props per dati
  selectedItems = [],             // Items selezionati per azioni bulk
  allItems = [],                  // Tutti gli items per export completo
  
  // Props per callbacks CRUD
  onAdd = null,                   // Callback per aggiungere
  onEdit = null,                  // Callback per modificare (riceve item)
  onDelete = null,                // Callback per eliminare (riceve items[])
  onView = null,                  // Callback per visualizzare dettagli
  
  // Props per personalizzazione
  showAdd = true,                 // Mostra bottone aggiungi
  showEdit = true,                // Mostra bottone modifica
  showDelete = true,              // Mostra bottone elimina
  showExport = true,              // Mostra opzioni export
  showShare = true,               // Mostra opzioni condivisione
  
  // Props per export personalizzato
  exportConfig = {
    fields: [],                   // Campi da esportare
    filename: entityNamePlural,   // Nome file export
    title: '',                    // Titolo report
  },
  
  // Props per stile
  variant = 'toolbar',           // 'toolbar', 'dropdown', 'fab'
  className = '',
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gestione selezione singola/multipla
  const hasSelection = selectedItems.length > 0;
  const singleSelection = selectedItems.length === 1;
  const multipleSelection = selectedItems.length > 1;

  // Handler per stampa
  const handlePrint = async () => {
    setExporting(true);
    try {
      // Prepara i dati per la stampa
      const dataToExport = hasSelection ? selectedItems : allItems;
      
      // Crea HTML per stampa
      const printWindow = window.open('', '_blank');
      const html = generatePrintHTML(dataToExport);
      
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      // Attendi caricamento e stampa
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      
      toast.success('Documento pronto per la stampa');
    } catch (error) {
      console.error('Errore stampa:', error);
      toast.error('Errore durante la stampa');
    } finally {
      setExporting(false);
    }
  };

  // Handler per export PDF
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const dataToExport = hasSelection ? selectedItems : allItems;
      
      const result = await exportService.exportToPDF({
        data: dataToExport,
        title: exportConfig.title || `Report ${entityNamePlural}`,
        fields: exportConfig.fields,
        filename: `${exportConfig.filename}_${new Date().toISOString().split('T')[0]}.pdf`
      });
      
      if (result.success) {
        toast.success('PDF generato con successo');
      }
    } catch (error) {
      console.error('Errore export PDF:', error);
      toast.error('Errore generazione PDF');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  // Handler per export Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const dataToExport = hasSelection ? selectedItems : allItems;
      
      const result = await exportService.exportToExcel({
        data: dataToExport,
        sheetName: entityNamePlural,
        filename: `${exportConfig.filename}_${new Date().toISOString().split('T')[0]}.xlsx`
      });
      
      if (result.success) {
        toast.success('Excel esportato con successo');
      }
    } catch (error) {
      console.error('Errore export Excel:', error);
      toast.error('Errore esportazione Excel');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  // Handler per export CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const dataToExport = hasSelection ? selectedItems : allItems;
      
      const result = await exportService.exportToCSV({
        data: dataToExport,
        filename: `${exportConfig.filename}_${new Date().toISOString().split('T')[0]}.csv`
      });
      
      if (result.success) {
        toast.success('CSV esportato con successo');
      }
    } catch (error) {
      console.error('Errore export CSV:', error);
      toast.error('Errore esportazione CSV');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  // Handler per condivisione email
  const handleShareEmail = async () => {
    const subject = `${exportConfig.title || entityNamePlural}`;
    const body = `Condivisione dati ${entityNamePlural}`;
    
    // Crea mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    
    toast.success('Preparazione email in corso...');
    setShowShareMenu(false);
  };

  // Handler per condivisione link
  const handleShareLink = async () => {
    try {
      // Genera link condivisibile (in produzione sarebbe un link reale)
      const shareableLink = `${window.location.origin}/shared/${entityNamePlural}/${Date.now()}`;
      
      // Copia negli appunti
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      
      toast.success('Link copiato negli appunti');
      
      setTimeout(() => {
        setCopied(false);
        setShowShareMenu(false);
      }, 2000);
    } catch (error) {
      console.error('Errore copia link:', error);
      toast.error('Errore nella copia del link');
    }
  };

  // Handler per condivisione WhatsApp
  const handleShareWhatsApp = () => {
    const text = `Condivisione ${entityNamePlural}`;
    const url = window.location.href;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Apertura WhatsApp...');
    setShowShareMenu(false);
  };

  // Genera HTML per stampa
  const generatePrintHTML = (data) => {
    const rows = data.map(item => {
      return `<tr>${Object.values(item).map(val => `<td>${val || '-'}</td>`).join('')}</tr>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${exportConfig.title || entityNamePlural}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${exportConfig.title || `Report ${entityNamePlural}`}</h1>
          <p>Data: ${new Date().toLocaleDateString('it-IT')}</p>
          <p>Totale record: ${data.length}</p>
          <table>
            <thead>
              <tr>${exportConfig.fields.map(f => `<th>${f.label}</th>`).join('')}</tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
  };

  // Render variante TOOLBAR
  if (variant === 'toolbar') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Bottoni CRUD */}
        {showAdd && onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Aggiungi {entityName}</span>
          </button>
        )}

        {showEdit && onEdit && (
          <button
            onClick={() => {
              if (!singleSelection) {
                toast.error('Seleziona un solo elemento per modificare');
                return;
              }
              onEdit(selectedItems[0]);
            }}
            disabled={!singleSelection}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              singleSelection 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={!hasSelection ? 'Seleziona un elemento da modificare' : multipleSelection ? 'Seleziona solo un elemento' : 'Modifica elemento selezionato'}
          >
            <PencilIcon className="h-5 w-5" />
            <span>Modifica</span>
          </button>
        )}

        {showDelete && onDelete && (
          <button
            onClick={() => {
              if (!hasSelection) {
                toast.error('Seleziona almeno un elemento da eliminare');
                return;
              }
              if (confirm(`Eliminare ${selectedItems.length} ${selectedItems.length === 1 ? entityName : entityNamePlural}?`)) {
                onDelete(selectedItems);
              }
            }}
            disabled={!hasSelection}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              hasSelection 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={!hasSelection ? 'Seleziona elementi da eliminare' : `Elimina ${selectedItems.length} ${selectedItems.length === 1 ? entityName : entityNamePlural}`}
          >
            <TrashIcon className="h-5 w-5" />
            <span>Elimina {hasSelection && `(${selectedItems.length})`}</span>
          </button>
        )}

        {/* Separatore */}
        {(showAdd || showEdit || showDelete) && (showExport || showShare) && (
          <div className="h-8 w-px bg-gray-300 mx-2" />
        )}

        {/* Bottone Stampa */}
        <button
          onClick={handlePrint}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Stampa"
        >
          <PrinterIcon className="h-5 w-5" />
          <span className="hidden md:inline">Stampa</span>
        </button>

        {/* Menu Export */}
        {showExport && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span className="hidden md:inline">Esporta</span>
            </button>

            {showExportMenu && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Esporta PDF</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <TableCellsIcon className="h-4 w-4" />
                  <span>Esporta Excel</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span>Esporta CSV</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Menu Condividi */}
        {showShare && (
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ShareIcon className="h-5 w-5" />
              <span className="hidden md:inline">Condividi</span>
            </button>

            {showShareMenu && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={handleShareEmail}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>Invia via Email</span>
                </button>
                <button
                  onClick={handleShareLink}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-4 w-4 text-green-600" />
                      <span>Link copiato!</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      <span>Copia link</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <PhotoIcon className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Indicatore selezione */}
        {hasSelection && (
          <div className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
            {selectedItems.length} selezionat{selectedItems.length === 1 ? 'o' : 'i'}
          </div>
        )}
      </div>
    );
  }

  // Render variante DROPDOWN (menu con tre puntini)
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          className="p-2 hover:bg-gray-100 rounded-lg"
          onClick={() => setShowExportMenu(!showExportMenu)}
        >
          <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
        </button>

        {showExportMenu && (
          <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* CRUD Actions */}
            {showAdd && onAdd && (
              <button
                onClick={() => {
                  onAdd();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Aggiungi {entityName}</span>
              </button>
            )}
            
            {showEdit && onEdit && singleSelection && (
              <button
                onClick={() => {
                  onEdit(selectedItems[0]);
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Modifica</span>
              </button>
            )}
            
            {showDelete && onDelete && hasSelection && (
              <button
                onClick={() => {
                  if (confirm(`Eliminare ${selectedItems.length} ${selectedItems.length === 1 ? entityName : entityNamePlural}?`)) {
                    onDelete(selectedItems);
                    setShowExportMenu(false);
                  }
                }}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-red-600"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Elimina</span>
              </button>
            )}

            {/* Separatore */}
            <hr className="my-2" />

            {/* Export/Share Actions */}
            <button
              onClick={() => {
                handlePrint();
                setShowExportMenu(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Stampa</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
            >
              <DocumentTextIcon className="h-4 w-4" />
              <span>Esporta PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
            >
              <TableCellsIcon className="h-4 w-4" />
              <span>Esporta Excel</span>
            </button>

            <button
              onClick={handleShareEmail}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
            >
              <EnvelopeIcon className="h-4 w-4" />
              <span>Condividi via Email</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default: ritorna null se variant non riconosciuta
  return null;
};

export default UniversalActions;
