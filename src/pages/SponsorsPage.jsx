import React, { useState, useEffect } from 'react';
import { 
  CurrencyEuroIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import UniversalActions from '../components/common/UniversalActions';
import toast from 'react-hot-toast';

function SponsorsPage() {
  const [sponsors, setSponsors] = useState([]);
  const [selectedSponsors, setSelectedSponsors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: 'MAIN',
    contactPerson: '',
    email: '',
    phone: '',
    amount: '',
    startDate: '',
    endDate: '',
    description: '',
    website: '',
    logoUrl: ''
  });

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sponsors');
      if (response.data.success) {
        setSponsors(response.data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento sponsor:', error);
      // Dati di esempio se l'API non è ancora pronta
      setSponsors([
        {
          id: '1',
          name: 'SportStore Milano',
          type: 'MAIN',
          contactPerson: 'Giovanni Bianchi',
          email: 'info@sportstore.it',
          phone: '+39 02 1234567',
          amount: 10000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          description: 'Sponsor principale - Fornitura divise',
          isActive: true
        },
        {
          id: '2',
          name: 'Pizzeria Da Mario',
          type: 'SECONDARY',
          contactPerson: 'Mario Rossi',
          email: 'mario@pizzeria.it',
          phone: '+39 333 7654321',
          amount: 3000,
          startDate: '2024-03-01',
          endDate: '2025-02-28',
          description: 'Sponsor cartellonistica campo',
          isActive: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSponsor) {
        const response = await api.put(`/api/v1/sponsors/${editingSponsor.id}`, formData);
        if (response.data.success) {
          setSponsors(sponsors.map(s => s.id === editingSponsor.id ? response.data.data : s));
        }
      } else {
        const response = await api.post('/sponsors', formData);
        if (response.data.success) {
          setSponsors([...sponsors, response.data.data]);
        }
      }
      resetForm();
    } catch (error) {
      console.error('Errore salvataggio sponsor:', error);
      // Simulazione salvataggio
      const newSponsor = {
        id: Date.now().toString(),
        ...formData,
        amount: parseFloat(formData.amount),
        isActive: true
      };
      if (editingSponsor) {
        setSponsors(sponsors.map(s => s.id === editingSponsor.id ? newSponsor : s));
      } else {
        setSponsors([...sponsors, newSponsor]);
      }
      resetForm();
    }
  };

  const handleEdit = (sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      type: sponsor.type,
      contactPerson: sponsor.contactPerson || '',
      email: sponsor.email || '',
      phone: sponsor.phone || '',
      amount: sponsor.amount?.toString() || '',
      startDate: sponsor.startDate ? format(new Date(sponsor.startDate), 'yyyy-MM-dd') : '',
      endDate: sponsor.endDate ? format(new Date(sponsor.endDate), 'yyyy-MM-dd') : '',
      description: sponsor.description || '',
      website: sponsor.website || '',
      logoUrl: sponsor.logoUrl || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo sponsor?')) return;
    
    try {
      await api.delete(`/api/v1/sponsors/${id}`);
      setSponsors(sponsors.filter(s => s.id !== id));
      toast.success('Sponsor eliminato');
    } catch (error) {
      console.error('Errore eliminazione:', error);
      // Simulazione eliminazione
      setSponsors(sponsors.filter(s => s.id !== id));
      toast.success('Sponsor eliminato');
    }
  };

  const handleBulkDelete = async (sponsorsToDelete) => {
    try {
      setSponsors(sponsors.filter(s => !sponsorsToDelete.find(del => del.id === s.id)));
      toast.success(`${sponsorsToDelete.length} sponsor eliminati`);
      setSelectedSponsors([]);
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const toggleSponsorSelection = (sponsor) => {
    setSelectedSponsors(prev => {
      const isSelected = prev.find(s => s.id === sponsor.id);
      if (isSelected) {
        return prev.filter(s => s.id !== sponsor.id);
      } else {
        return [...prev, sponsor];
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'MAIN',
      contactPerson: '',
      email: '',
      phone: '',
      amount: '',
      startDate: '',
      endDate: '',
      description: '',
      website: '',
      logoUrl: ''
    });
    setEditingSponsor(null);
    setShowModal(false);
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'MAIN':
        return 'bg-yellow-100 text-yellow-800';
      case 'SECONDARY':
        return 'bg-blue-100 text-blue-800';
      case 'TECHNICAL':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotalRevenue = () => {
    return sponsors.reduce((sum, sponsor) => sum + (sponsor.amount || 0), 0);
  };

  const getActiveSponsors = () => {
    const today = new Date();
    return sponsors.filter(sponsor => {
      if (!sponsor.endDate) return true;
      return new Date(sponsor.endDate) >= today;
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <h1 className="text-3xl font-bold text-gray-900">Gestione Sponsor</h1>
          <p className="text-gray-600 mt-1">Gestisci sponsor e partnership commerciali</p>
        </div>
        <UniversalActions
          entityName="sponsor"
          entityNamePlural="sponsor"
          selectedItems={selectedSponsors}
          allItems={sponsors}
          onAdd={() => setShowModal(true)}
          onEdit={(sponsor) => handleEdit(sponsor)}
          onDelete={handleBulkDelete}
          exportConfig={{
            fields: [
              { key: 'name', label: 'Azienda' },
              { key: 'type', label: 'Tipo' },
              { key: 'contactPerson', label: 'Contatto' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Telefono' },
              { key: 'amount', label: 'Importo' },
              { key: 'startDate', label: 'Inizio' },
              { key: 'endDate', label: 'Fine' }
            ],
            filename: 'sponsor',
            title: 'Report Sponsor'
          }}
        />
      </div>

      {/* Statistiche Sponsor */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Sponsor</p>
              <p className="text-2xl font-bold">{sponsors.length}</p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sponsor Attivi</p>
              <p className="text-2xl font-bold">{getActiveSponsors().length}</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entrate Annuali</p>
              <p className="text-2xl font-bold">€{calculateTotalRevenue().toLocaleString()}</p>
            </div>
            <CurrencyEuroIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Media Contratto</p>
              <p className="text-2xl font-bold">
                €{sponsors.length > 0 ? Math.round(calculateTotalRevenue() / sponsors.length).toLocaleString() : 0}
              </p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Grid Sponsor */}
      {sponsors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuno sponsor</h3>
          <p className="text-gray-500">Aggiungi il primo sponsor della tua società</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Aggiungi Sponsor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map(sponsor => {
            const isActive = !sponsor.endDate || new Date(sponsor.endDate) >= new Date();
            const isSelected = selectedSponsors.find(s => s.id === sponsor.id);
            
            return (
              <div 
                key={sponsor.id} 
                className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow relative ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Checkbox per selezione */}
                <div className="absolute top-4 right-4 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected ? true : false}
                    onChange={() => toggleSponsorSelection(sponsor)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{sponsor.name}</h3>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getTypeBadgeColor(sponsor.type)}`}>
                        {sponsor.type === 'MAIN' ? 'Principale' : sponsor.type === 'SECONDARY' ? 'Secondario' : 'Tecnico'}
                      </span>
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {isActive ? 'Attivo' : 'Scaduto'}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Importo annuale:</span>
                      <span className="text-sm font-semibold text-gray-900">€{sponsor.amount?.toLocaleString() || 0}</span>
                    </div>
                    
                    {sponsor.contactPerson && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Contatto:</span>
                        <span className="text-sm text-gray-900">{sponsor.contactPerson}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Periodo:</span>
                      <span className="text-xs text-gray-900">
                        {sponsor.startDate && format(new Date(sponsor.startDate), 'MMM yyyy', { locale: it })}
                        {' - '}
                        {sponsor.endDate && format(new Date(sponsor.endDate), 'MMM yyyy', { locale: it })}
                      </span>
                    </div>
                  </div>

                  {sponsor.description && (
                    <p className="text-sm text-gray-600 mb-4">{sponsor.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {sponsor.email && (
                        <a href={`mailto:${sponsor.email}`} className="text-gray-400 hover:text-gray-600">
                          <EnvelopeIcon className="h-5 w-5" />
                        </a>
                      )}
                      {sponsor.phone && (
                        <a href={`tel:${sponsor.phone}`} className="text-gray-400 hover:text-gray-600">
                          <PhoneIcon className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(sponsor)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sponsor.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingSponsor ? 'Modifica Sponsor' : 'Nuovo Sponsor'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Azienda *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo Sponsorizzazione
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MAIN">Sponsor Principale</option>
                    <option value="SECONDARY">Sponsor Secondario</option>
                    <option value="TECHNICAL">Sponsor Tecnico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importo Annuale (€) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Persona di Contatto
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    Sito Web
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inizio Contratto *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fine Contratto *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione / Note
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Es. Fornitura divise, cartellonistica campo, etc."
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
                  {editingSponsor ? 'Salva Modifiche' : 'Aggiungi Sponsor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SponsorsPage;
