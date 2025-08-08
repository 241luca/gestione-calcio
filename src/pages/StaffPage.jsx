import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'ALLENATORE',
    email: '',
    phone: '',
    qualification: '',
    teamId: '',
    startDate: '',
    contractEnd: '',
    salary: ''
  });
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    loadStaff();
    loadTeams();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/staff');
      if (response.data.success) {
        setStaff(response.data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento staff:', error);
      // Dati di esempio se l'API non è ancora pronta
      setStaff([
        {
          id: '1',
          firstName: 'Mario',
          lastName: 'Rossi',
          role: 'ALLENATORE',
          email: 'mario.rossi@team.com',
          phone: '+39 333 1234567',
          qualification: 'UEFA A',
          team: { name: 'Under 14' },
          startDate: '2024-01-01'
        },
        {
          id: '2',
          firstName: 'Luigi',
          lastName: 'Verdi',
          role: 'ASSISTENTE',
          email: 'luigi.verdi@team.com',
          phone: '+39 333 7654321',
          qualification: 'UEFA B',
          team: { name: 'Under 12' },
          startDate: '2024-02-01'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await api.get('/api/v1/teams');
      if (response.data.success) {
        setTeams(response.data.data || []);
      }
    } catch (error) {
      console.log('Teams non disponibili');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        const response = await api.put(`/api/v1/staff/${editingStaff.id}`, formData);
        if (response.data.success) {
          setStaff(staff.map(s => s.id === editingStaff.id ? response.data.data : s));
        }
      } else {
        const response = await api.post('/api/v1/staff', formData);
        if (response.data.success) {
          setStaff([...staff, response.data.data]);
        }
      }
      resetForm();
    } catch (error) {
      console.error('Errore salvataggio staff:', error);
      alert('Errore nel salvataggio');
    }
  };

  const handleEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      role: member.role,
      email: member.email || '',
      phone: member.phone || '',
      qualification: member.qualification || '',
      teamId: member.teamId || '',
      startDate: member.startDate ? format(new Date(member.startDate), 'yyyy-MM-dd') : '',
      contractEnd: member.contractEnd ? format(new Date(member.contractEnd), 'yyyy-MM-dd') : '',
      salary: member.salary || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo membro dello staff?')) return;
    
    try {
      await api.delete(`/api/v1/staff/${id}`);
      setStaff(staff.filter(s => s.id !== id));
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      role: 'ALLENATORE',
      email: '',
      phone: '',
      qualification: '',
      teamId: '',
      startDate: '',
      contractEnd: '',
      salary: ''
    });
    setEditingStaff(null);
    setShowModal(false);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ALLENATORE':
        return 'bg-blue-100 text-blue-800';
      case 'ASSISTENTE':
        return 'bg-green-100 text-green-800';
      case 'PREPARATORE':
        return 'bg-purple-100 text-purple-800';
      case 'MEDICO':
        return 'bg-red-100 text-red-800';
      case 'FISIOTERAPISTA':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Gestione Staff</h1>
          <p className="text-gray-600 mt-1">Gestisci allenatori, assistenti e staff tecnico</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Aggiungi Membro
        </button>
      </div>

      {/* Statistiche Staff */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Staff</p>
              <p className="text-2xl font-bold">{staff.length}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Allenatori</p>
              <p className="text-2xl font-bold">
                {staff.filter(s => s.role === 'ALLENATORE').length}
              </p>
            </div>
            <AcademicCapIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assistenti</p>
              <p className="text-2xl font-bold">
                {staff.filter(s => s.role === 'ASSISTENTE').length}
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Staff Medico</p>
              <p className="text-2xl font-bold">
                {staff.filter(s => ['MEDICO', 'FISIOTERAPISTA'].includes(s.role)).length}
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Lista Staff */}
      {staff.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun membro dello staff</h3>
          <p className="text-gray-500">Aggiungi il primo membro del tuo staff tecnico</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Aggiungi Membro
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Squadra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qualifica
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contatti
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </div>
                    {member.startDate && (
                      <div className="text-xs text-gray-500">
                        Dal {format(new Date(member.startDate), 'dd/MM/yyyy')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.team?.name || 'Non assegnato'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.qualification || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="text-gray-400 hover:text-gray-600">
                          <EnvelopeIcon className="h-5 w-5" />
                        </a>
                      )}
                      {member.phone && (
                        <a href={`tel:${member.phone}`} className="text-gray-400 hover:text-gray-600">
                          <PhoneIcon className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(member)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingStaff ? 'Modifica Membro Staff' : 'Nuovo Membro Staff'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cognome
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ruolo
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALLENATORE">Allenatore</option>
                    <option value="ASSISTENTE">Assistente Allenatore</option>
                    <option value="PREPARATORE">Preparatore Atletico</option>
                    <option value="PORTIERI">Allenatore Portieri</option>
                    <option value="MEDICO">Medico</option>
                    <option value="FISIOTERAPISTA">Fisioterapista</option>
                    <option value="DIRIGENTE">Dirigente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Squadra
                  </label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleziona squadra</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualifica
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Es. UEFA A, Laurea in Scienze Motorie"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compenso Mensile (€)
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

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
                    Scadenza Contratto
                  </label>
                  <input
                    type="date"
                    value={formData.contractEnd}
                    onChange={(e) => setFormData({...formData, contractEnd: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingStaff ? 'Salva Modifiche' : 'Aggiungi Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffPage;
