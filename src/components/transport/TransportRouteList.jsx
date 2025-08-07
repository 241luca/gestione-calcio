import React, { useState, useEffect } from 'react';
import { FaBus, FaRoute, FaEdit, FaTrash, FaPlus, FaUserTie, FaPhone, FaClock } from 'react-icons/fa';
import transportService from '../../services/transportService';
import toast from 'react-hot-toast';

function TransportRouteList() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startLocation: '',
    endLocation: '',
    stops: [],
    estimatedDuration: 30,
    capacity: 50,
    vehicleType: 'bus',
    driverName: '',
    driverPhone: '',
    notes: '',
    isActive: true
  });
  const [newStop, setNewStop] = useState('');

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const response = await transportService.getRoutes();
      setRoutes(response.data || []);
    } catch (error) {
      toast.error('Errore nel caricamento dei percorsi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRoute) {
        await transportService.updateRoute(editingRoute.id, formData);
        toast.success('Percorso aggiornato con successo');
      } else {
        await transportService.createRoute(formData);
        toast.success('Percorso creato con successo');
      }
      
      resetForm();
      loadRoutes();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Errore nel salvataggio');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRoute(null);
    setFormData({
      name: '',
      description: '',
      startLocation: '',
      endLocation: '',
      stops: [],
      estimatedDuration: 30,
      capacity: 50,
      vehicleType: 'bus',
      driverName: '',
      driverPhone: '',
      notes: '',
      isActive: true
    });
    setNewStop('');
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      description: route.description || '',
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      stops: route.stops || [],
      estimatedDuration: route.estimatedDuration || 30,
      capacity: route.capacity || 50,
      vehicleType: route.vehicleType || 'bus',
      driverName: route.driverName || '',
      driverPhone: route.driverPhone || '',
      notes: route.notes || '',
      isActive: route.isActive !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il percorso "${name}"?`)) {
      return;
    }

    try {
      await transportService.deleteRoute(id);
      toast.success('Percorso eliminato con successo');
      loadRoutes();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Errore nell\'eliminazione');
    }
  };

  const addStop = () => {
    if (newStop.trim()) {
      setFormData({
        ...formData,
        stops: [...formData.stops, newStop.trim()]
      });
      setNewStop('');
    }
  };

  const removeStop = (index) => {
    setFormData({
      ...formData,
      stops: formData.stops.filter((_, i) => i !== index)
    });
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
          <h2 className="text-xl font-semibold text-gray-900">Percorsi di Trasporto</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configura i percorsi per i mezzi di trasporto
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingRoute(null);
            resetForm();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus />
          Nuovo Percorso
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium mb-4">
            {editingRoute ? 'Modifica Percorso' : 'Nuovo Percorso'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome e Descrizione */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Percorso *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="es. Linea 1 - Centro"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Veicolo
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bus">Autobus</option>
                  <option value="minibus">Minibus</option>
                  <option value="van">Furgone</option>
                  <option value="car">Auto</option>
                </select>
              </div>
            </div>

            {/* Partenza e Arrivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Punto di Partenza *
                </label>
                <input
                  type="text"
                  value={formData.startLocation}
                  onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="es. Piazza Garibaldi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Punto di Arrivo *
                </label>
                <input
                  type="text"
                  value={formData.endLocation}
                  onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="es. Campo Sportivo"
                  required
                />
              </div>
            </div>

            {/* Fermate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fermate Intermedie
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newStop}
                  onChange={(e) => setNewStop(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStop())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Aggiungi fermata..."
                />
                <button
                  type="button"
                  onClick={addStop}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Aggiungi
                </button>
              </div>
              {formData.stops.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.stops.map((stop, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {stop}
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Durata e Capacità */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durata Stimata (minuti)
                </label>
                <input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacità (posti)
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Percorso Attivo
                </label>
              </div>
            </div>

            {/* Autista */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Autista
                </label>
                <input
                  type="text"
                  value={formData.driverName}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="es. Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefono Autista
                </label>
                <input
                  type="tel"
                  value={formData.driverPhone}
                  onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="es. +39 333 1234567"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Note aggiuntive..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingRoute ? 'Aggiorna' : 'Crea'} Percorso
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Routes List */}
      {routes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaRoute className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-600">Nessun percorso configurato</p>
          <p className="text-sm text-gray-500 mt-2">
            Crea il primo percorso per iniziare a programmare i viaggi
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className={`bg-white border rounded-lg p-4 ${
                route.isActive ? 'border-gray-200' : 'border-gray-100 opacity-75'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FaBus className={route.isActive ? 'text-blue-500' : 'text-gray-400'} />
                    <h3 className="font-semibold text-gray-900">{route.name}</h3>
                    {!route.isActive && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Inattivo
                      </span>
                    )}
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {route.vehicleType === 'bus' ? 'Autobus' :
                       route.vehicleType === 'minibus' ? 'Minibus' :
                       route.vehicleType === 'van' ? 'Furgone' : 'Auto'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-green-600">📍</span>
                        <div>
                          <span className="text-gray-600">Da:</span>
                          <span className="ml-1 font-medium">{route.startLocation}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-600">📍</span>
                        <div>
                          <span className="text-gray-600">A:</span>
                          <span className="ml-1 font-medium">{route.endLocation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-gray-400" />
                        <span className="text-gray-600">
                          Durata: {route.estimatedDuration} minuti
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-gray-400" />
                        <span className="text-gray-600">
                          Capacità: {route.capacity} posti
                        </span>
                      </div>
                    </div>
                  </div>

                  {route.stops && route.stops.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Fermate:</span>
                      <div className="flex flex-wrap gap-1">
                        {route.stops.map((stop, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {stop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {route.driverName && (
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <FaUserTie className="text-gray-400" />
                        <span className="text-gray-600">Autista:</span>
                        <span className="font-medium">{route.driverName}</span>
                      </div>
                      {route.driverPhone && (
                        <div className="flex items-center gap-2">
                          <FaPhone className="text-gray-400" />
                          <span className="text-gray-600">{route.driverPhone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {route._count?.schedules > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      {route._count.schedules} viaggi programmati
                    </div>
                  )}
                </div>

                <div className="flex gap-1 ml-4">
                  <button
                    onClick={() => handleEdit(route)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Modifica"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(route.id, route.name)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Elimina"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FaUsers() {
  return <span>👥</span>;
}

export default TransportRouteList;
