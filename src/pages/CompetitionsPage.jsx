import React, { useState } from 'react';
import { 
  TrophyIcon, 
  PlusIcon, 
  CalendarIcon, 
  UsersIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useApiData, useApiMutation } from '../hooks/useApiData';
import { toast } from 'react-hot-toast';

function CompetitionsPage() {
  // Hook per recuperare dati dal backend
  const { data: competitions = [], loading, error, refetch } = useApiData('/competitions');
  const { mutate } = useApiMutation();

  // Stati locali per UI
  const [showModal, setShowModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'CAMPIONATO',
    season: '2024/2025',
    startDate: '',
    endDate: '',
    teams: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await mutate('post', '/competitions', formData, 'Competizione creata con successo');
      refetch();
      setShowModal(false);
      resetForm();
    } catch (error) {
      // Errore già gestito da mutate
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa competizione?')) {
      return;
    }

    try {
      await mutate('delete', `/competitions/${id}`, null, 'Competizione eliminata con successo');
      refetch();
    } catch (error) {
      // Errore già gestito da mutate
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await mutate('put', `/competitions/${id}`, data, 'Competizione aggiornata con successo');
      refetch();
      setSelectedCompetition(null);
    } catch (error) {
      // Errore già gestito da mutate
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'CAMPIONATO',
      season: '2024/2025',
      startDate: '',
      endDate: '',
      teams: []
    });
  };

  const CompetitionCard = ({ competition }) => (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{competition.name}</h3>
          <p className="text-sm text-gray-500">{competition.type} - {competition.season}</p>
        </div>
        <TrophyIcon className="h-6 w-6 text-yellow-500" />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <span>
            {competition.startDate && format(new Date(competition.startDate), 'dd MMM yyyy', { locale: it })}
            {' - '}
            {competition.endDate && format(new Date(competition.endDate), 'dd MMM yyyy', { locale: it })}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <UsersIcon className="h-4 w-4 mr-2" />
          <span>{competition.teams?.length || 0} squadre</span>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <button 
          onClick={() => setSelectedCompetition(competition)}
          className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded hover:bg-blue-100"
        >
          Dettagli
        </button>
        <button 
          onClick={() => handleDelete(competition.id)}
          className="px-3 py-2 bg-red-50 text-red-600 text-sm font-medium rounded hover:bg-red-100"
        >
          Elimina
        </button>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento competizioni...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Competizioni</h1>
          <p className="text-gray-600 mt-1">Gestisci campionati, tornei e coppe</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuova Competizione
        </button>
      </div>

      {competitions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna competizione</h3>
          <p className="text-gray-500">Crea la tua prima competizione per iniziare</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Crea Competizione
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map(comp => (
            <CompetitionCard key={comp.id} competition={comp} />
          ))}
        </div>
      )}

      {/* Modal Creazione Competizione */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nuova Competizione</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Competizione *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Es. Campionato Primavera"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CAMPIONATO">Campionato</option>
                    <option value="COPPA">Coppa</option>
                    <option value="TORNEO">Torneo</option>
                    <option value="AMICHEVOLE">Amichevoli</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2024/2025"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Inizio
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Fine
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crea Competizione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dettaglio Competizione */}
      {selectedCompetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Dettagli Competizione</h2>
              <button
                onClick={() => setSelectedCompetition(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{selectedCompetition.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <span className="ml-2 font-medium">{selectedCompetition.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Stagione:</span>
                    <span className="ml-2 font-medium">{selectedCompetition.season}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Inizio:</span>
                    <span className="ml-2 font-medium">
                      {selectedCompetition.startDate && 
                        format(new Date(selectedCompetition.startDate), 'dd MMM yyyy', { locale: it })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fine:</span>
                    <span className="ml-2 font-medium">
                      {selectedCompetition.endDate && 
                        format(new Date(selectedCompetition.endDate), 'dd MMM yyyy', { locale: it })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Squadre Partecipanti ({selectedCompetition.teams?.length || 0})</h4>
                {selectedCompetition.teams && selectedCompetition.teams.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCompetition.teams.map((team, index) => (
                      <div key={index} className="bg-white border rounded p-2 text-sm">
                        {team.name || team}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nessuna squadra registrata</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    toast.success('Funzione classifica in sviluppo');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Classifica
                </button>
                <button
                  onClick={() => {
                    toast.success('Funzione calendario in sviluppo');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Calendario
                </button>
                <button
                  onClick={() => setSelectedCompetition(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetitionsPage;