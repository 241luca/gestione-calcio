import React, { useState, useEffect } from 'react';
import { TrophyIcon, PlusIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

function CompetitionsPage() {
  const [competitions, setCompetitions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: 'CAMPIONATO',
    season: '2024/2025',
    startDate: '',
    endDate: '',
    teams: []
  });

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/competitions');
      if (response.data.success) {
        setCompetitions(response.data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento competizioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/v1/competitions', formData);
      if (response.data.success) {
        setCompetitions([...competitions, response.data.data]);
        setShowModal(false);
        setFormData({
          name: '',
          type: 'CAMPIONATO',
          season: '2024/2025',
          startDate: '',
          endDate: '',
          teams: []
        });
      }
    } catch (error) {
      console.error('Errore creazione competizione:', error);
      alert('Errore nella creazione della competizione');
    }
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
        <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded hover:bg-blue-100">
          Classifica
        </button>
        <button className="flex-1 px-3 py-2 bg-green-50 text-green-600 text-sm font-medium rounded hover:bg-green-100">
          Calendario
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nuova Competizione</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Competizione
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
    </div>
  );
}

export default CompetitionsPage;
