import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ShareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { documentService } from '../services/documentService';
import { athleteService } from '../services/api';
import { exportService } from '../services/exportService';
import toast from 'react-hot-toast';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    athleteId: '',
    documentType: '',
    file: null,
    expiryDate: '',
    notes: ''
  });

  const documentTypes = [
    { id: 'medical', name: 'Certificato Medico', hasExpiry: true },
    { id: 'identity', name: 'Carta d\'Identità', hasExpiry: true },
    { id: 'fiscal', name: 'Codice Fiscale', hasExpiry: false },
    { id: 'photo', name: 'Foto Tessera', hasExpiry: false },
    { id: 'privacy', name: 'Privacy Firmata', hasExpiry: false },
    { id: 'registration', name: 'Modulo Iscrizione', hasExpiry: false },
    { id: 'payment', name: 'Ricevuta Pagamento', hasExpiry: false },
    { id: 'other', name: 'Altro', hasExpiry: false }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carica atleti per il dropdown
      const athletesResponse = await athleteService.getAll();
      if (athletesResponse.success) {
        setAthletes(athletesResponse.data.athletes || []);
      }

      // Per ora usiamo dati di esempio per i documenti
      const mockDocuments = [
        {
          id: '1',
          athleteId: '1',
          athleteName: 'Mario Rossi',
          type: 'Certificato Medico',
          fileName: 'certificato_medico_rossi.pdf',
          uploadDate: '2024-01-15',
          expiryDate: '2025-01-15',
          status: 'valid',
          fileSize: '2.5 MB',
          uploadedBy: 'Admin'
        },
        {
          id: '2',
          athleteId: '2',
          athleteName: 'Luigi Verdi',
          type: 'Carta d\'Identità',
          fileName: 'carta_identita_verdi.jpg',
          uploadDate: '2024-02-20',
          expiryDate: '2029-02-20',
          status: 'valid',
          fileSize: '1.2 MB',
          uploadedBy: 'Admin'
        },
        {
          id: '3',
          athleteId: '3',
          athleteName: 'Giovanni Bianchi',
          type: 'Certificato Medico',
          fileName: 'certificato_bianchi.pdf',
          uploadDate: '2024-11-01',
          expiryDate: '2024-12-01',
          status: 'expiring',
          fileSize: '3.1 MB',
          uploadedBy: 'Segreteria'
        },
        {
          id: '4',
          athleteId: '4',
          athleteName: 'Paolo Neri',
          type: 'Certificato Medico',
          fileName: 'certificato_neri.pdf',
          uploadDate: '2023-10-01',
          expiryDate: '2024-10-01',
          status: 'expired',
          fileSize: '2.8 MB',
          uploadedBy: 'Admin'
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
      toast.error('Errore nel caricamento dei documenti');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verifica dimensione file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Il file è troppo grande. Massimo 10MB');
        return;
      }
      
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.athleteId || !uploadForm.documentType || !uploadForm.file) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('athleteId', uploadForm.athleteId);
      formData.append('documentType', uploadForm.documentType);
      formData.append('expiryDate', uploadForm.expiryDate);
      formData.append('notes', uploadForm.notes);

      // Simuliamo il caricamento
      toast.success('Documento caricato con successo!');
      
      // Aggiungi documento alla lista
      const newDoc = {
        id: Date.now().toString(),
        athleteId: uploadForm.athleteId,
        athleteName: athletes.find(a => a.id === uploadForm.athleteId)?.firstName + ' ' + 
                     athletes.find(a => a.id === uploadForm.athleteId)?.lastName,
        type: documentTypes.find(t => t.id === uploadForm.documentType)?.name,
        fileName: uploadForm.file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        expiryDate: uploadForm.expiryDate,
        status: 'valid',
        fileSize: (uploadForm.file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadedBy: 'Admin'
      };
      
      setDocuments([newDoc, ...documents]);
      setShowUploadModal(false);
      resetUploadForm();
    } catch (error) {
      toast.error('Errore nel caricamento del documento');
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      // Simuliamo l'eliminazione
      setDocuments(documents.filter(d => d.id !== documentToDelete.id));
      toast.success('Documento eliminato con successo');
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    } catch (error) {
      toast.error('Errore nell\'eliminazione del documento');
    }
  };

  const handleDownload = (document) => {
    // Simuliamo il download
    toast.success(`Download di ${document.fileName} avviato`);
  };

  const resetUploadForm = () => {
    setUploadForm({
      athleteId: '',
      documentType: '',
      file: null,
      expiryDate: '',
      notes: ''
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'valid': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Valido' },
      'expiring': { color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon, text: 'In scadenza' },
      'expired': { color: 'bg-red-100 text-red-800', icon: XMarkIcon, text: 'Scaduto' }
    };
    
    const badge = badges[status] || badges['valid'];
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${badge.color}`}>
        <badge.icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('it-IT');
  };

  const calculateDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filtra documenti
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || doc.status === filterStatus;
    
    const matchesType = 
      filterType === 'all' || doc.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Statistiche documenti
  const stats = {
    total: documents.length,
    valid: documents.filter(d => d.status === 'valid').length,
    expiring: documents.filter(d => d.status === 'expiring').length,
    expired: documents.filter(d => d.status === 'expired').length
  };

  const exportDocuments = () => {
    const dataToExport = filteredDocuments.map(doc => ({
      'Atleta': doc.athleteName,
      'Tipo Documento': doc.type,
      'Nome File': doc.fileName,
      'Data Caricamento': formatDate(doc.uploadDate),
      'Data Scadenza': formatDate(doc.expiryDate),
      'Stato': doc.status === 'valid' ? 'Valido' : doc.status === 'expiring' ? 'In scadenza' : 'Scaduto',
      'Giorni alla scadenza': doc.expiryDate ? calculateDaysUntilExpiry(doc.expiryDate) : '-',
      'Caricato da': doc.uploadedBy
    }));

    exportService.exportToCSV(dataToExport, `documenti_${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documenti</h1>
            <p className="text-gray-600 mt-2">Gestisci i documenti degli atleti</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportDocuments}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <PrinterIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Stampa</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              Carica Documento
            </button>
          </div>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totali</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Validi</p>
              <p className="text-2xl font-semibold text-green-600">{stats.valid}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In scadenza</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.expiring}</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scaduti</p>
              <p className="text-2xl font-semibold text-red-600">{stats.expired}</p>
            </div>
            <XMarkIcon className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per atleta, file o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="valid">Solo validi</option>
              <option value="expiring">In scadenza</option>
              <option value="expired">Scaduti</option>
            </select>
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti i tipi</option>
              <option value="Certificato Medico">Certificato Medico</option>
              <option value="Carta d'Identità">Carta d'Identità</option>
              <option value="Codice Fiscale">Codice Fiscale</option>
              <option value="Altri">Altri</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabella Documenti */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atleta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caricato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scadenza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => {
                  const daysUntilExpiry = calculateDaysUntilExpiry(doc.expiryDate);
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {doc.athleteName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doc.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doc.fileName}</div>
                        <div className="text-xs text-gray-500">{doc.fileSize}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(doc.uploadDate)}</div>
                        <div className="text-xs text-gray-500">{doc.uploadedBy}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(doc.expiryDate)}</div>
                        {daysUntilExpiry !== null && (
                          <div className={`text-xs ${
                            daysUntilExpiry < 0 ? 'text-red-600' :
                            daysUntilExpiry <= 30 ? 'text-yellow-600' :
                            'text-gray-500'
                          }`}>
                            {daysUntilExpiry < 0 
                              ? `Scaduto da ${Math.abs(daysUntilExpiry)} giorni`
                              : `${daysUntilExpiry} giorni`
                            }
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Scarica"
                          >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setDocumentToDelete(doc);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Elimina"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nessun documento trovato</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Clicca su "Carica Documento" per aggiungere un documento
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowUploadModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Carica Documento
              </h3>
              
              <form onSubmit={handleUpload}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Atleta *
                    </label>
                    <select
                      value={uploadForm.athleteId}
                      onChange={(e) => setUploadForm({ ...uploadForm, athleteId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleziona atleta</option>
                      {athletes.map(athlete => (
                        <option key={athlete.id} value={athlete.id}>
                          {athlete.firstName} {athlete.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Documento *
                    </label>
                    <select
                      value={uploadForm.documentType}
                      onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleziona tipo</option>
                      {documentTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File *
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formati accettati: PDF, JPG, PNG, DOC. Max 10MB
                    </p>
                  </div>

                  {uploadForm.documentType && 
                   documentTypes.find(t => t.id === uploadForm.documentType)?.hasExpiry && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Scadenza
                      </label>
                      <input
                        type="date"
                        value={uploadForm.expiryDate}
                        onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note
                    </label>
                    <textarea
                      value={uploadForm.notes}
                      onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Note aggiuntive..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      resetUploadForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Carica Documento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Conferma eliminazione
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Sei sicuro di voler eliminare il documento "{documentToDelete?.fileName}"?
                Questa azione non può essere annullata.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annulla
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
