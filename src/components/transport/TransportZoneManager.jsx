import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaEdit, FaTrash, FaPlus, FaUsers } from 'react-icons/fa';
import transportService from '../../services/transportService';
import toast from 'react-hot-toast';

function TransportZoneManager() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coordinates: ''
  });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const response = await transportService.getZones();
      setZones(response.data || []);
    } catch (error) {
      toast.error('Errore nel caricamento delle zone');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingZone) {
        await transportService.updateZone(editingZone.id, formData);
        toast.success('Zona aggiornata con successo');
      } else {
        await transportService.createZone(formData);
        toast.success('Zona creata con successo');
      }
      
      setShowForm(false);
      setEditingZone(null);
      setFormData({ name: '', description: '', coordinates: '' });
      loadZones();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Errore nel salvataggio');
    }
  };

  const handleEdit = (zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      description: zone.description || '',
      coordinates: zone.coordinates || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la zona "${name}"?`)) {
      return;
    }

    try {
      await transportService.deleteZone(id);
      toast.success('Zona eliminata con successo');
      loadZones();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Errore nell\'eliminazione');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Zone di Trasporto</h2>
          <p className="text-sm text-gray-600 mt-1">
            Definisci le zone geografiche per organizzare i trasporti
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingZone(null);
            setFormData({ name: '', description: '', coordinates: '' });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus />
          Nuova Zona
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium mb-4">
            {editingZone ? 'Modifica Zona' : 'Nuova Zona'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Zona *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="es. Zona Nord"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coordinate (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.coordinates}
                  onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="es. 45.4642, 9.1900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Descrizione della zona..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingZone ? 'Aggiorna' : 'Crea'} Zona
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingZone(null);
                  setFormData({ name: '', description: '', coordinates: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Zone List */}
      {zones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaMapMarkerAlt className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-600">Nessuna zona di trasporto configurata</p>
          <p className="text-sm text-gray-500 mt-2">
            Crea la prima zona per iniziare a organizzare i trasporti
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-blue-500" />
                  <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(zone)}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Modifica"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(zone.id, zone.name)}
                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Elimina"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {zone.description && (
                <p className="text-sm text-gray-600 mb-3">{zone.description}</p>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaUsers />
                <span>{zone._count?.athletes || 0} atleti</span>
              </div>

              {zone.coordinates && (
                <div className="mt-2 text-xs text-gray-400">
                  📍 {zone.coordinates}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TransportZoneManager;
