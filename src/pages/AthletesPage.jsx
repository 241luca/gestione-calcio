import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useApiData, useApiMutation } from '../hooks/useApiData';
import toast from 'react-hot-toast';
import UniversalActions from '../components/common/UniversalActions';

const AthletesPage = () => {
  const navigate = useNavigate();
  
  // Usa il nuovo hook per caricare i dati
  const { data: athletesData, loading, error, refetch } = useApiData('/athletes');
  const { mutate } = useApiMutation();
  
  // Estrai l'array di atleti dal formato restituito dal backend
  // IMPORTANTE: Se c'è paginazione, i dati sono in 'items'
  const athletes = Array.isArray(athletesData) 
    ? athletesData 
    : (athletesData?.items || athletesData?.athletes || []);
  
  console.log('🔍 DEBUG AthletesPage:');
  console.log('  - athletesData raw:', athletesData);
  console.log('  - athletes estratti:', athletes);
  console.log('  - athletes.length:', athletes.length);
  console.log('  - Array.isArray(athletes):', Array.isArray(athletes));
  
  // Stati locali per UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAthletes, setSelectedAthletes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estrai info paginazione
  const pagination = athletesData?.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const hasNext = pagination.hasNext || false;
  const hasPrev = pagination.hasPrev || false;

  // Handler CRUD
  const handleAdd = () => {
    navigate('/athletes/new');
  };

  const handleEdit = (athlete) => {
    navigate(`/athletes/${athlete.id}/edit`);
  };

  const handleView = (athlete) => {
    navigate(`/athletes/${athlete.id}`);
  };

  const handleDelete = async (athletesToDelete) => {
    if (!window.confirm(`Sei sicuro di voler eliminare ${athletesToDelete.length} atlet${athletesToDelete.length === 1 ? 'a' : 'i'}?`)) {
      return;
    }

    try {
      // Elimina tutti gli atleti selezionati
      for (const athlete of athletesToDelete) {
        await mutate('delete', `/athletes/${athlete.id}`, null, null);
      }
      
      // Pulisci la selezione
      setSelectedAthletes([]);
      
      // Ricarica i dati
      await refetch();
      
      toast.success(`${athletesToDelete.length} atlet${athletesToDelete.length === 1 ? 'a eliminato' : 'i eliminati'} con successo`);
    } catch (error) {
      console.error('Errore eliminazione:', error);
    }
  };

  // Configurazione export
  const exportConfig = {
    fields: [
      { key: 'firstName', label: 'Nome' },
      { key: 'lastName', label: 'Cognome' },
      { key: 'fiscalCode', label: 'Codice Fiscale' },
      { key: 'birthDate', label: 'Data Nascita' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telefono' },
      { key: 'team', label: 'Squadra', formatter: (team) => team?.name || 'Non assegnato' },
      { key: 'status', label: 'Stato' }
    ],
    filename: 'atleti_export',
    title: 'Report Atleti - Sistema Gestione Calcio'
  };

  // Filtra atleti - athletes è già garantito essere un array
  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = searchTerm === '' || 
      `${athlete.firstName} ${athlete.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.fiscalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || athlete.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Toggle selezione
  const toggleSelection = (athlete) => {
    if (selectedAthletes.find(a => a.id === athlete.id)) {
      setSelectedAthletes(selectedAthletes.filter(a => a.id !== athlete.id));
    } else {
      setSelectedAthletes([...selectedAthletes, athlete]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedAthletes.length === filteredAthletes.length) {
      setSelectedAthletes([]);
    } else {
      setSelectedAthletes([...filteredAthletes]);
    }
  };

  const isSelected = (athlete) => {
    return selectedAthletes.some(a => a.id === athlete.id);
  };

  // Stati derivati
  const stats = {
    total: athletes?.length || 0,
    active: athletes?.filter(a => a.status === 'ACTIVE').length || 0,
    injured: athletes?.filter(a => a.status === 'INJURED').length || 0,
    suspended: athletes?.filter(a => a.status === 'SUSPENDED').length || 0
  };

  // Mostra loading
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento atleti...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostra errore
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Errore nel caricamento</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={refetch}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Atleti</h1>
        <p className="text-gray-600">Gestisci l'anagrafica degli atleti della società</p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <UserGroupIcon className="h-10 w-10 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Totale</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-green-600 font-bold">{stats.active}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Attivi</p>
              <p className="text-xl font-semibold">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-red-600 font-bold">{stats.injured}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Infortunati</p>
              <p className="text-xl font-semibold">{stats.injured}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-yellow-600 font-bold">{stats.suspended}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sospesi</p>
              <p className="text-xl font-semibold">{stats.suspended}</p>
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
                placeholder="Cerca per nome, cognome, CF o email..."
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutti gli stati</option>
              <option value="ACTIVE">Attivi</option>
              <option value="INJURED">Infortunati</option>
              <option value="SUSPENDED">Sospesi</option>
              <option value="INACTIVE">Inattivi</option>
            </select>

            {selectedAthletes.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedAthletes.length} selezionat{selectedAthletes.length === 1 ? 'o' : 'i'}
              </span>
            )}
          </div>

          {/* Azioni */}
          <UniversalActions
            onAdd={handleAdd}
            onDelete={selectedAthletes.length > 0 ? () => handleDelete(selectedAthletes) : null}
            onExport={() => console.log('Export')}
            onImport={() => console.log('Import')}
            exportData={filteredAthletes}
            exportConfig={exportConfig}
            addLabel="Nuovo Atleta"
            entityName="atleti"
            selectedCount={selectedAthletes.length}
          />
        </div>
      </div>

      {/* Tabella o messaggio vuoto */}
      {filteredAthletes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun atleta trovato
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Prova a modificare i filtri di ricerca' 
              : 'Inizia aggiungendo il primo atleta'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aggiungi Primo Atleta
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
                    checked={selectedAthletes.length === filteredAthletes.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atleta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Squadra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contatti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doc
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAthletes.map((athlete) => (
                <tr 
                  key={athlete.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    isSelected(athlete) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected(athlete)}
                      onChange={() => toggleSelection(athlete)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleView(athlete)}>
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {athlete.firstName} {athlete.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {athlete.fiscalCode || 'CF non inserito'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {athlete.team?.name || 'Non assegnato'}
                    </div>
                    {athlete.jerseyNumber && (
                      <div className="text-sm text-gray-500">
                        Maglia #{athlete.jerseyNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {athlete.email || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {athlete.phone || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      athlete.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      athlete.status === 'INJURED' ? 'bg-red-100 text-red-800' :
                      athlete.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {athlete.status === 'ACTIVE' ? 'Attivo' :
                       athlete.status === 'INJURED' ? 'Infortunato' :
                       athlete.status === 'SUSPENDED' ? 'Sospeso' :
                       'Inattivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {athlete._count?.documents > 0 ? (
                      <span className="text-green-600 font-medium">
                        {athlete._count.documents}
                      </span>
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(athlete);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Visualizza"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(athlete);
                        }}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Modifica"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete([athlete]);
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
    </div>
  );
};

export default AthletesPage;