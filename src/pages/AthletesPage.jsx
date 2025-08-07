import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PrinterIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { athleteService } from '../services/api';
import { exportService } from '../services/exportService';
import toast from 'react-hot-toast';

const AthletesPage = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);

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

  const handleDelete = async () => {
    if (!athleteToDelete) return;
    
    try {
      await athleteService.delete(athleteToDelete.id);
      setAthletes(athletes.filter(a => a.id !== athleteToDelete.id));
      setShowDeleteModal(false);
      setAthleteToDelete(null);
      toast.success('Atleta eliminato con successo');
    } catch (error) {
      toast.error('Errore nell\'eliminazione dell\'atleta');
    }
  };

  // Filtra gli atleti in base alla ricerca e allo stato
  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = 
      athlete.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (athlete.fiscalCode && athlete.fiscalCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && athlete.status === 'ACTIVE') ||
      (filterStatus === 'inactive' && athlete.status !== 'ACTIVE');
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'INJURED': 'bg-red-100 text-red-800',
      'SUSPENDED': 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      'ACTIVE': 'Attivo',
      'INACTIVE': 'Inattivo',
      'INJURED': 'Infortunato',
      'SUSPENDED': 'Sospeso'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${badges[status] || badges['INACTIVE']}`}>
        {labels[status] || status}
      </span>
    );
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
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
            <h1 className="text-3xl font-bold text-gray-900">Atleti</h1>
            <p className="text-gray-600 mt-2">Gestisci gli atleti della società</p>
          </div>
          <div className="flex gap-2">
            {/* Pulsanti Export */}
            <button
              onClick={() => exportService.exportAthletes(filteredAthletes)}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Esporta in Excel"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => {
                document.title = 'Lista Atleti - ' + new Date().toLocaleDateString('it-IT');
                window.print();
              }}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              title="Stampa"
            >
              <PrinterIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Stampa</span>
            </button>
            <button
              onClick={() => exportService.shareAthletes(filteredAthletes)}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              title="Condividi"
            >
              <ShareIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Condividi</span>
            </button>
            <Link
              to="/athletes/new"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuovo Atleta
            </Link>
          </div>
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome o codice fiscale..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="active">Solo attivi</option>
              <option value="inactive">Solo inattivi</option>
            </select>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Trovati {filteredAthletes.length} atleti su {athletes.length} totali
        </div>
      </div>

      {/* Tabella Atleti */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atleta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Età
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Squadra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruolo
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
              {filteredAthletes.length > 0 ? (
                filteredAthletes.map((athlete) => (
                  <tr key={athlete.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {athlete.firstName} {athlete.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {athlete.fiscalCode || 'CF non inserito'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateAge(athlete.birthDate)} anni
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {athlete.team?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {athlete.position?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(athlete.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/athletes/${athlete.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizza"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/athletes/${athlete.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Modifica"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => {
                            setAthleteToDelete(athlete);
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
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-2">Nessun atleta trovato</p>
                      <p className="text-sm">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'Prova a modificare i filtri di ricerca' 
                          : 'Clicca su "Nuovo Atleta" per aggiungere il primo atleta'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal di conferma eliminazione */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Conferma eliminazione
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Sei sicuro di voler eliminare l'atleta {athleteToDelete?.firstName} {athleteToDelete?.lastName}?
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

export default AthletesPage;
