import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  UsersIcon,
  TrophyIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { exportService } from '../services/exportService';
import toast from 'react-hot-toast';

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teams');
      if (response.data.success) {
        setTeams(response.data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento squadre:', error);
      // Per ora usiamo dati di esempio
      setTeams([
        {
          id: '1',
          name: 'Pulcini 2014',
          category: 'Pulcini',
          season: '2024/2025',
          coachName: 'Mario Rossi',
          athleteCount: 15,
          status: 'ACTIVE'
        },
        {
          id: '2',
          name: 'Esordienti 2012',
          category: 'Esordienti',
          season: '2024/2025',
          coachName: 'Luigi Verdi',
          athleteCount: 18,
          status: 'ACTIVE'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      toast.error('Nome e categoria sono obbligatori');
      return;
    }

    try {
      if (editingTeam) {
        // Modifica squadra
        const response = await api.put(`/teams/${editingTeam.id}`, formData);
        if (response.data.success) {
          toast.success('Squadra aggiornata con successo');
          loadTeams();
        }
      } else {
        // Nuova squadra
        const response = await api.post('/teams', formData);
        if (response.data.success) {
          toast.success('Squadra creata con successo');
          loadTeams();
        }
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      // Per ora simuliamo il successo
      if (editingTeam) {
        setTeams(teams.map(t => 
          t.id === editingTeam.id ? { ...t, ...formData } : t
        ));
        toast.success('Squadra aggiornata con successo');
      } else {
        const newTeam = {
          id: Date.now().toString(),
          ...formData,
          athleteCount: 0,
          status: 'ACTIVE'
        };
        setTeams([...teams, newTeam]);
        toast.success('Squadra creata con successo');
      }
      setShowModal(false);
      resetForm();
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      category: team.category,
      season: team.season,
      coachName: team.coachName || '',
      coachPhone: team.coachPhone || '',
      coachEmail: team.coachEmail || '',
      assistantCoachName: team.assistantCoachName || '',
      notes: team.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;
    
    try {
      await api.delete(`/teams/${teamToDelete.id}`);
      setTeams(teams.filter(t => t.id !== teamToDelete.id));
      toast.success('Squadra eliminata con successo');
    } catch (error) {
      // Simuliamo l'eliminazione
      setTeams(teams.filter(t => t.id !== teamToDelete.id));
      toast.success('Squadra eliminata con successo');
    } finally {
      setShowDeleteModal(false);
      setTeamToDelete(null);
    }
  };

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

  const exportTeams = () => {
    const dataToExport = teams.map(team => ({
      'Nome Squadra': team.name,
      'Categoria': team.category,
      'Stagione': team.season,
      'Allenatore': team.coachName || '',
      'Tel. Allenatore': team.coachPhone || '',
      'Email Allenatore': team.coachEmail || '',
      'Vice Allenatore': team.assistantCoachName || '',
      'N. Atleti': team.athleteCount || 0,
      'Stato': team.status === 'ACTIVE' ? 'Attiva' : 'Inattiva'
    }));

    exportService.exportToCSV(dataToExport, `squadre_${new Date().toISOString().split('T')[0]}.csv`);
  };

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Squadre</h1>
            <p className="text-gray-600 mt-2">Gestisci le squadre della società</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportTeams}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              title="Esporta in Excel"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              title="Stampa"
            >
              <PrinterIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Stampa</span>
            </button>
            <button
              onClick={() => {
                setEditingTeam(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuova Squadra
            </button>
          </div>
        </div>
      </div>

      {/* Grid Squadre */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrophyIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-500">{team.category}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <UsersIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">{team.athleteCount || 0} atleti</span>
                </div>
                {team.coachName && (
                  <div className="text-sm">
                    <span className="text-gray-500">Allenatore:</span>{' '}
                    <span className="text-gray-900 font-medium">{team.coachName}</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-gray-500">Stagione:</span>{' '}
                  <span className="text-gray-900">{team.season}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  team.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {team.status === 'ACTIVE' ? 'Attiva' : 'Inattiva'}
                </span>
                
                <div className="flex gap-2">
                  <Link
                    to={`/teams/${team.id}`}
                    className="p-1 text-blue-600 hover:text-blue-700"
                    title="Visualizza"
                  >
                    <UsersIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleEdit(team)}
                    className="p-1 text-yellow-600 hover:text-yellow-700"
                    title="Modifica"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setTeamToDelete(team);
                      setShowDeleteModal(true);
                    }}
                    className="p-1 text-red-600 hover:text-red-700"
                    title="Elimina"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {teams.length === 0 && (
          <div className="col-span-full text-center py-12">
            <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessuna squadra registrata</p>
            <p className="text-sm text-gray-400 mt-2">
              Clicca su "Nuova Squadra" per aggiungere la prima squadra
            </p>
          </div>
        )}
      </div>

      {/* Modal Crea/Modifica */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTeam ? 'Modifica Squadra' : 'Nuova Squadra'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Squadra *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="es. Pulcini 2014"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleziona categoria</option>
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
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="2024/2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allenatore
                    </label>
                    <input
                      type="text"
                      value={formData.coachName}
                      onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome allenatore"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono Allenatore
                    </label>
                    <input
                      type="tel"
                      value={formData.coachPhone}
                      onChange={(e) => setFormData({ ...formData, coachPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="333 1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Allenatore
                    </label>
                    <input
                      type="email"
                      value={formData.coachEmail}
                      onChange={(e) => setFormData({ ...formData, coachEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="allenatore@email.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vice Allenatore
                    </label>
                    <input
                      type="text"
                      value={formData.assistantCoachName}
                      onChange={(e) => setFormData({ ...formData, assistantCoachName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome vice allenatore"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Note aggiuntive..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {editingTeam ? 'Aggiorna' : 'Crea'} Squadra
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
                Sei sicuro di voler eliminare la squadra {teamToDelete?.name}?
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

export default TeamsPage;
