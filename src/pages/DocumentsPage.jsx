import React, { useState } from 'react';
import { 
  DocumentTextIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useApiData, useApiMutation } from '../hooks/useApiData';
import UniversalActions from '../components/common/UniversalActions';
import toast from 'react-hot-toast';

const DocumentsPage = () => {
  // Usa i nuovi hooks per caricare i dati
  const { data: documentsData, loading: loadingDocs, error: errorDocs, refetch: refetchDocs } = useApiData('/documents');
  const { data: athletesData, loading: loadingAthletes } = useApiData('/athletes');
  const { mutate } = useApiMutation();
  
  // Estrai gli array dal formato restituito dal backend
  // IMPORTANTE: Se c'è paginazione, i dati sono in 'items'
  const documents = Array.isArray(documentsData) 
    ? documentsData 
    : (documentsData?.items || documentsData?.documents || []);
  const athletes = Array.isArray(athletesData) 
    ? athletesData 
    : (athletesData?.items || athletesData?.athletes || []);
  
  // Stati per UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [uploadForm, setUploadForm] = useState({
    athleteId: '',
    documentType: '',
    file: null,
    expiryDate: '',
    notes: ''
  });

  // Tipi di documento disponibili
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

  // Handler upload documento
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.athleteId || !uploadForm.documentType) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('athleteId', uploadForm.athleteId);
    formData.append('typeId', uploadForm.documentType);
    if (uploadForm.expiryDate) {
      formData.append('expiryDate', uploadForm.expiryDate);
    }
    if (uploadForm.notes) {
      formData.append('notes', uploadForm.notes);
    }

    try {
      await mutate('post', '/documents', formData, 'Documento caricato con successo');
      setShowUploadModal(false);
      setUploadForm({
        athleteId: '',
        documentType: '',
        file: null,
        expiryDate: '',
        notes: ''
      });
      refetchDocs();
    } catch (error) {
      console.error('Errore upload:', error);
    }
  };

  // Handler elimina documento
  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await mutate('delete', `/documents/${documentToDelete.id}`, null, 'Documento eliminato con successo');
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      refetchDocs();
    } catch (error) {
      console.error('Errore eliminazione:', error);
    }
  };

  // Handler elimina multipli
  const handleDeleteMultiple = async () => {
    if (selectedDocuments.length === 0) return;

    if (!window.confirm(`Sei sicuro di voler eliminare ${selectedDocuments.length} document${selectedDocuments.length === 1 ? 'o' : 'i'}?`)) {
      return;
    }

    try {
      for (const doc of selectedDocuments) {
        await mutate('delete', `/documents/${doc.id}`, null, null);
      }
      toast.success(`${selectedDocuments.length} document${selectedDocuments.length === 1 ? 'o eliminato' : 'i eliminati'}`);
      setSelectedDocuments([]);
      refetchDocs();
    } catch (error) {
      console.error('Errore eliminazione multipla:', error);
    }
  };

  // Filtra documenti - documents è già garantito essere un array
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.athlete?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.athlete?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesType = filterType === 'all' || doc.type?.id === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Toggle selezione
  const toggleSelection = (doc) => {
    if (selectedDocuments.find(d => d.id === doc.id)) {
      setSelectedDocuments(selectedDocuments.filter(d => d.id !== doc.id));
    } else {
      setSelectedDocuments([...selectedDocuments, doc]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments([...filteredDocuments]);
    }
  };

  const isSelected = (doc) => {
    return selectedDocuments.some(d => d.id === doc.id);
  };

  // Statistiche
  const stats = {
    total: documents?.length || 0,
    valid: documents?.filter(d => d.status === 'VALID').length || 0,
    expiring: documents?.filter(d => d.status === 'EXPIRING').length || 0,
    expired: documents?.filter(d => d.status === 'EXPIRED').length || 0
  };

  // Configurazione export
  const exportConfig = {
    fields: [
      { key: 'athlete', label: 'Atleta', formatter: (a) => a ? `${a.firstName} ${a.lastName}` : '' },
      { key: 'type', label: 'Tipo', formatter: (t) => t?.name || '' },
      { key: 'fileName', label: 'Nome File' },
      { key: 'uploadDate', label: 'Data Caricamento' },
      { key: 'expiryDate', label: 'Data Scadenza' },
      { key: 'status', label: 'Stato' }
    ],
    filename: 'documenti_export',
    title: 'Report Documenti - Sistema Gestione Calcio'
  };

  // Mostra loading
  if (loadingDocs) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento documenti...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostra errore
  if (errorDocs) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Errore nel caricamento</h3>
          <p className="text-red-700 mb-4">{errorDocs}</p>
          <button
            onClick={refetchDocs}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Documenti</h1>
        <p className="text-gray-600">Gestisci i documenti degli atleti</p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-10 w-10 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Totale</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-10 w-10 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Validi</p>
              <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-10 w-10 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">In Scadenza</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Scaduti</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controlli */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Ricerca */}
          <div className="flex-1 w-full lg:max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per atleta, tipo o nome file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtri */}
          <div className="flex items-center gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="VALID">Validi</option>
              <option value="EXPIRING">In Scadenza</option>
              <option value="EXPIRED">Scaduti</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti i tipi</option>
              {documentTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>

            {selectedDocuments.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedDocuments.length} selezionat{selectedDocuments.length === 1 ? 'o' : 'i'}
              </span>
            )}
          </div>

          {/* Azioni */}
          <UniversalActions
            onAdd={() => setShowUploadModal(true)}
            onDelete={selectedDocuments.length > 0 ? handleDeleteMultiple : null}
            onExport={() => console.log('Export')}
            exportData={filteredDocuments}
            exportConfig={exportConfig}
            addLabel="Carica Documento"
            addIcon={<ArrowUpTrayIcon className="h-5 w-5" />}
            entityName="documenti"
            selectedCount={selectedDocuments.length}
          />
        </div>
      </div>

      {/* Tabella o messaggio vuoto */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun documento trovato
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Prova a modificare i filtri di ricerca' 
              : 'Inizia caricando il primo documento'}
          </p>
          {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Carica Primo Documento
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atleta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scadenza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr 
                  key={doc.id}
                  className={`hover:bg-gray-50 ${isSelected(doc) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected(doc)}
                      onChange={() => toggleSelection(doc)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {doc.athlete ? `${doc.athlete.firstName} ${doc.athlete.lastName}` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {doc.athlete?.fiscalCode || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {doc.type?.name || doc.documentType || 'Altro'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {doc.fileName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.expiryDate ? (
                      <div className="text-sm text-gray-900">
                        {new Date(doc.expiryDate).toLocaleDateString('it-IT')}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doc.status === 'VALID' ? 'bg-green-100 text-green-800' :
                      doc.status === 'EXPIRING' ? 'bg-yellow-100 text-yellow-800' :
                      doc.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {doc.status === 'VALID' ? 'Valido' :
                       doc.status === 'EXPIRING' ? 'In Scadenza' :
                       doc.status === 'EXPIRED' ? 'Scaduto' :
                       'Sconosciuto'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Visualizza"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </a>
                      )}
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          download={doc.fileName}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Scarica"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setDocumentToDelete(doc);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Elimina"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Upload Documento */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Carica Documento</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Atleta *
                  </label>
                  <select
                    value={uploadForm.athleteId}
                    onChange={(e) => setUploadForm({...uploadForm, athleteId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loadingAthletes}
                  >
                    <option value="">Seleziona atleta...</option>
                    {(athletes || []).map(athlete => (
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
                    onChange={(e) => setUploadForm({...uploadForm, documentType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona tipo...</option>
                    {documentTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formati accettati: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
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
                      onChange={(e) => setUploadForm({...uploadForm, expiryDate: e.target.value})}
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
                    onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Note aggiuntive (opzionale)"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Carica Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione */}
      {showDeleteModal && documentToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Conferma Eliminazione</h3>
            <p className="text-gray-500 mb-6">
              Sei sicuro di voler eliminare il documento "{documentToDelete.fileName}"?
              Questa azione non può essere annullata.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDocumentToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;