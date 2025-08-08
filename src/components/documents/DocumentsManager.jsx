import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { FiUpload, FiFile, FiAlertCircle, FiCheck, FiX, FiDownload, FiEye } from 'react-icons/fi';
import DocumentUpload from './DocumentUpload';
import DocumentsList from './DocumentsList';
import DocumentFilters from './DocumentFilters';
import { documentsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

function DocumentsManager() {
  const [activeTab, setActiveTab] = useState('all'); // all, expiring, expired
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [filters, setFilters] = useState({
    athleteId: '',
    typeId: '',
    status: '',
    search: ''
  });

  const queryClient = useQueryClient();

  // Recupera documenti con filtri
  const { data: documentsData, isLoading, error } = useQuery(
    ['documents', filters, activeTab],
    () => documentsAPI.getDocuments({ ...filters, status: activeTab === 'all' ? '' : activeTab }),
    {
      keepPreviousData: true
    }
  );

  // Recupera statistiche documenti
  const { data: stats } = useQuery(
    'documents-stats',
    documentsAPI.getStats
  );

  // Mutation per verificare documento
  const verifyMutation = useMutation(
    (documentId) => documentsAPI.verifyDocument(documentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        queryClient.invalidateQueries('documents-stats');
        toast.success('Documento verificato con successo!');
      },
      onError: () => {
        toast.error('Errore nella verifica del documento');
      }
    }
  );

  // Mutation per eliminare documento
  const deleteMutation = useMutation(
    (documentId) => documentsAPI.deleteDocument(documentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        queryClient.invalidateQueries('documents-stats');
        toast.success('Documento eliminato!');
      },
      onError: () => {
        toast.error('Errore nell\'eliminazione del documento');
      }
    }
  );

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    queryClient.invalidateQueries('documents');
    queryClient.invalidateQueries('documents-stats');
    toast.success('Documento caricato con successo!');
  };

  const getStatusBadge = (status) => {
    const badges = {
      VALID: { color: 'bg-green-100 text-green-800', icon: FiCheck, text: 'Valido' },
      EXPIRING: { color: 'bg-yellow-100 text-yellow-800', icon: FiAlertCircle, text: 'In scadenza' },
      EXPIRED: { color: 'bg-red-100 text-red-800', icon: FiX, text: 'Scaduto' }
    };
    
    const badge = badges[status] || badges.VALID;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="mr-1 h-3 w-3" />
        {badge.text}
      </span>
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-4">Errore nel caricamento documenti</div>;

  const documents = documentsData?.data || [];

  return (
    <div className="p-6">
      {/* Header con statistiche */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Gestione Documenti</h1>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FiUpload className="mr-2" />
            Carica Documento
          </button>
        </div>

        {/* Cards statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totali</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <FiFile className="text-gray-400 text-3xl" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Validi</p>
                <p className="text-2xl font-bold text-green-700">{stats?.valid || 0}</p>
              </div>
              <FiCheck className="text-green-500 text-3xl" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">In Scadenza</p>
                <p className="text-2xl font-bold text-yellow-700">{stats?.expiring || 0}</p>
              </div>
              <FiAlertCircle className="text-yellow-500 text-3xl" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Scaduti</p>
                <p className="text-2xl font-bold text-red-700">{stats?.expired || 0}</p>
              </div>
              <FiX className="text-red-500 text-3xl" />
            </div>
          </div>
        </div>

        {/* Tabs per filtrare */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tutti i documenti
            </button>
            <button
              onClick={() => setActiveTab('EXPIRING')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'EXPIRING'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              In scadenza ({stats?.expiring || 0})
            </button>
            <button
              onClick={() => setActiveTab('EXPIRED')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'EXPIRED'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scaduti ({stats?.expired || 0})
            </button>
          </nav>
        </div>
      </div>

      {/* Filtri */}
      <DocumentFilters filters={filters} onFiltersChange={setFilters} />

      {/* Lista documenti */}
      <DocumentsList
        documents={documents}
        onVerify={(doc) => verifyMutation.mutate(doc.id)}
        onDelete={(doc) => {
          if (confirm('Sei sicuro di voler eliminare questo documento?')) {
            deleteMutation.mutate(doc.id);
          }
        }}
        getStatusBadge={getStatusBadge}
      />

      {/* Modal upload */}
      {showUploadModal && (
        <DocumentUpload
          athleteId={selectedAthlete}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

export default DocumentsManager;