import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  UsersIcon,
  TrophyIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useApiData, useApiMutation } from '../hooks/useApiData';
import UniversalActions from '../components/common/UniversalActions';
import toast from 'react-hot-toast';

const TeamsPage = () => {
  // Usa il nuovo hook per caricare i dati
  const { data: teams, loading, error, refetch } = useApiData('/teams');
  const { mutate } = useApiMutation();
  
  // Stati per UI
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    season: '2024/2025',
    coachName: '',
    coachPhone: '',
    coachEmail: '',
    assistantCoachName: '',
    notes: ''
  });
  const [editingTeam, setEditingTeam] = useState(null);

  // Categorie disponibili
  const categories = [
    'Piccoli Amici',
    'Primi Calci',
    'Pulcini',
    'Esordienti',
    'Giovanissimi',
    'Allievi',
    'Juniores',
    'Prima Squadra'
  ];

  // Handler per salvare squadra
  const handleSaveTeam = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTeam) {
        await mutate('put', `/teams/${editingTeam.id}`, formData, 'Squadra aggiornata con successo');
      } else {
        await mutate('post', '/teams', formData, 'Squadra creata con successo');
      }
      
      setShowModal(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Errore salvataggio squadra:', error);
    }
  };

  // Handler per eliminare squadra
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    try {
      await mutate('delete', `/teams/${teamToDelete.id}`, null, 'Squadra eliminata con successo');
      setShowDeleteModal(false);
      setTeamToDelete(null);
      refetch();
    } catch (error) {
      console.error('Errore eliminazione squadra:', error);
    }
  };

  // Handler per eliminazione multipla
  const handleDeleteMultiple = async () => {
    if (selectedTeams.length === 0) return;
    
    if (!window.confirm(`Sei sicuro di voler eliminare ${selectedTeams.length} squadr${selectedTeams.length === 1 ? 'a' : 'e'}?`)) {
      return;
    }
    
    try {
      for (const team of selectedTeams) {
        await mutate('delete', `/teams/${team.id}`, null, null);
      }
      toast.success(`${selectedTeams.length} squadr${selectedTeams.length === 1 ? 'a eliminata' : 'e eliminate'}`);
      setSelectedTeams([]);
      refetch();
    } catch (error) {
      console.error('Errore eliminazione multipla:', error);
    }
  };

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      season: '2024/2025',
      coachName: '',
      coachPhone: '',
      coachEmail: '',
      assistantCoachName: '',
      notes: ''
    });
    setEditingTeam(null);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name || '',
      category: team.category || '',
      season: team.season || '2024/2025',
      coachName: team.coachName || '',
      coachPhone: team.coachPhone || '',
      coachEmail: team.coachEmail || '',
      assistantCoachName: team.assistantCoachName || '',
      notes: team.notes || ''
    });
    setShowModal(true);
  };

  const toggleSelection = (team) => {
    if (selectedTeams.find(t => t.id === team.id)) {
      setSelectedTeams(selectedTeams.filter(t => t.id !== team.id));
    } else {
      setSelectedTeams([...selectedTeams, team]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedTeams.length === teams.length) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams([...teams]);
    }
  };

  const isSelected = (team) => {
    return selectedTeams.some(t => t.id === team.id);
  };

  // Configurazione export
  const exportConfig = {
    fields: [
      { key: 'name', label: 'Nome Squadra' },
      { key: 'category', label: 'Categoria' },
      { key: 'season', label: 'Stagione' },
      { key: 'coachName', label: 'Allenatore' },
      { key: 'coachEmail', label: 'Email Allenatore' },
      { key: 'coachPhone', label: 'Telefono Allenatore' },
      { key: '_count', label: 'N° Atleti', formatter: (c) => c?.athletes || 0 }
    ],
    filename: 'squadre_export',
    title: 'Report Squadre - Sistema Gestione Calcio'
  };

  // Mostra loading
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento squadre...</p>
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
          <UsersIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Squadre</h1>
        <p className="text-gray-600">Gestisci le squadre della società</p>
      </div>

      {/* Controlli */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedTeams.length > 0 && (
              <>
                <input
                  type="checkbox"
                  checked={selectedTeams.length === teams.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {selectedTeams.length} selezionat{selectedTeams.length === 1 ? 'a' : 'e'}
                </span>
              </>
            )}
          </div>
          
          <UniversalActions
            onAdd={() => {
              resetForm();
              setShowModal(true);
            }}
            onDelete={selectedTeams.length > 0 ? handleDeleteMultiple : null}
            onExport={() => console.log('Export')}
            exportData={teams || []}
            exportConfig={exportConfig}
            addLabel="Nuova Squadra"
            entityName="squadre"
            selectedCount={selectedTeams.length}
          />
        </div>
      </div>

      {/* Griglia squadre */}
      {!teams || teams.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessuna squadra presente
          </h3>
          <p className="text-gray-500 mb-4">
            Inizia creando la prima squadra della società
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Crea Prima Squadra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(teams || []).map((team) => (
            <div 
              key={team.id} 
              className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                isSelected(team) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Header card */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">{team.name}</h3>
                    <p className="text-blue-100">{team.category}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected(team)}
                    onChange={() => toggleSelection(team)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Body card */}
              <div className="p-4">
                <div className="space-y-3">
                  {/* Stagione */}
                  <div className="flex items-center text-sm">
                    <TrophyIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Stagione:</span>
                    <span className="ml-2 font-medium">{team.season || '2024/2025'}</span>
                  </div>

                  {/* Allenatore */}
                  {team.coachName && (
                    <div className="text-sm">
                      <p className="text-gray-600">Allenatore:</p>
                      <p className="font-medium">{team.coachName}</p>
                      {team.coachPhone && (
                        <p className="text-gray-500">{team.coachPhone}</p>
                      )}
                    </div>
                  )}

                  {/* Numero atleti */}
                  <div className="flex items-center text-sm">
                    <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Atleti:</span>
                    <span className="ml-2 font-medium">{team._count?.athletes || 0}</span>
                  </div>
                </div>

                {/* Azioni */}
                <div className="mt-4 pt-4 border-t flex justify-between">
                  <Link
                    to={`/teams/${team.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Visualizza Dettagli
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(team)}
                      className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                      title="Modifica"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setTeamToDelete(team);
                        setShowDeleteModal(true);
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Elimina"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crea/Modifica Squadra */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTeam ? 'Modifica Squadra' : 'Nuova Squadra'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Squadra *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona categoria...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stagione
                  </label>
                  <input
                    type="text"
                    value={formData.season}
                    onChange={(e) => setFormData({...formData, season: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="es. 2024/2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Allenatore
                  </label>
                  <input
                    type="text"
                    value={formData.coachName}
                    onChange={(e) => setFormData({...formData, coachName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Allenatore
                  </label>
                  <input
                    type="email"
                    value={formData.coachEmail}
                    onChange={(e) => setFormData({...formData, coachEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono Allenatore
                  </label>
                  <input
                    type="tel"
                    value={formData.coachPhone}
                    onChange={(e) => setFormData({...formData, coachPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vice Allenatore
                  </label>
                  <input
                    type="text"
                    value={formData.assistantCoachName}
                    onChange={(e) => setFormData({...formData, assistantCoachName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTeam ? 'Aggiorna' : 'Crea'} Squadra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione */}
      {showDeleteModal && teamToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Conferma Eliminazione</h3>
            <p className="text-gray-500 mb-6">
              Sei sicuro di voler eliminare la squadra "{teamToDelete.name}"?
              {teamToDelete._count?.athletes > 0 && (
                <span className="block mt-2 text-red-600">
                  Attenzione: questa squadra ha {teamToDelete._count.athletes} atlet{teamToDelete._count.athletes === 1 ? 'a' : 'i'} associat{teamToDelete._count.athletes === 1 ? 'o' : 'i'}.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTeamToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={handleDeleteTeam}
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

export default TeamsPage;