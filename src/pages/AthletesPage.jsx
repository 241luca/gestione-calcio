import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { athleteService } from '../services/api';
import toast from 'react-hot-toast';
import UniversalActions from '../components/common/UniversalActions';
import { SelectionCheckbox, QuickSelection, useSelection } from '../components/common/SelectionHelpers';

const AthletesPage = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);

  // Usa il custom hook per gestire la selezione
  const {
    selectedItems,
    setSelectedItems,
    selectAll,
    selectNone,
    toggleItem,
    isSelected,
    hasSelection,
    selectionCount
  } = useSelection(athletes);

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      setLoading(true);
      const response = await athleteService.getAll();
      if (response.success && response.data) {
        setAthletes(response.data.athletes || []);
      }
    } catch (error) {
      toast.error('Errore nel caricamento degli atleti');
    } finally {
      setLoading(false);
    }
  };

  // Handler CRUD
  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleEdit = (athlete) => {
    setEditingAthlete(athlete);
    setShowEditModal(true);
  };

  const handleDelete = async (athletesToDelete) => {
    try {
      for (const athlete of athletesToDelete) {
        await athleteService.delete(athlete.id);
      }
      
      setAthletes(athletes.filter(a => !athletesToDelete.includes(a)));
      selectNone();
      
      toast.success(`${athletesToDelete.length} atlet${athletesToDelete.length === 1 ? 'a' : 'i'} eliminat${athletesToDelete.length === 1 ? 'o' : 'i'}`);
      loadAthletes(); // Ricarica lista
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
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
      { key: 'team', label: 'Squadra' },
      { key: 'status', label: 'Stato' }
    ],
    filename: 'atleti_export',
    title: 'Report Atleti - ASD Juventus Academy Milano'
  };

  // Filtra atleti
  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = searchTerm === '' || 
      `${athlete.firstName} ${athlete.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.fiscalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || athlete.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-lg shadow">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="p-4 border-b">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestione Atleti</h1>
            <p className="text-gray-600 mt-1">
              {athletes.length} atleti totali • {filteredAthletes.length} visualizzati
            </p>
          </div>
          
          {/* Statistiche rapide */}
          <div className="flex gap-4">
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              <span className="text-green-800 font-medium">
                {athletes.filter(a => a.status === 'ACTIVE').length} Attivi
              </span>
            </div>
            <div className="bg-red-50 px-4 py-2 rounded-lg">
              <span className="text-red-800 font-medium">
                {athletes.filter(a => a.status === 'INJURED').length} Infortunati
              </span>
            </div>
          </div>
        </div>

        {/* Barra azioni principale con UniversalActions */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            {/* Selezione rapida */}
            <QuickSelection
              items={filteredAthletes}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
            />
            
            {/* Azioni universali */}
            <UniversalActions
              entityName="atleta"
              entityNamePlural="atleti"
              selectedItems={selectedItems}
              allItems={filteredAthletes}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              exportConfig={exportConfig}
              variant="toolbar"
            />
          </div>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-4">
            {/* Ricerca */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome, codice fiscale o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro stato */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="ACTIVE">Attivi</option>
              <option value="INJURED">Infortunati</option>
              <option value="SUSPENDED">Sospesi</option>
              <option value="INACTIVE">Inattivi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabella Atleti */}
      {filteredAthletes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'Nessun atleta trovato' : 'Nessun atleta registrato'}
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
                  <SelectionCheckbox
                    items={filteredAthletes}
                    selectedItems={selectedItems}
                    onSelectionChange={setSelectedItems}
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
                  Documenti
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
                  className={`hover:bg-gray-50 ${isSelected(athlete) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected(athlete)}
                      onChange={() => toggleItem(athlete)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/athletes/${athlete.id}`}
                      className="flex items-center hover:text-blue-600"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {athlete.firstName} {athlete.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {athlete.fiscalCode || 'CF non inserito'}
                        </div>
                      </div>
                    </Link>
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
                      <Link
                        to={`/athletes/${athlete.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Dettagli
                      </Link>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleEdit(athlete)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Modifica
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TODO: Modals per Add/Edit andrebbero implementati */}
    </div>
  );
};

export default AthletesPage;
