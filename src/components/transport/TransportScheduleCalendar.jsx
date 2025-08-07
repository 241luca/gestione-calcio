import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaBus, FaPlus, FaClock, FaMapMarkerAlt, FaUsers, FaEdit, FaTrash } from 'react-icons/fa';
import transportService from '../../services/transportService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

function TransportScheduleCalendar() {
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    routeId: '',
    matchId: '',
    sessionId: '',
    pickupTime: '',
    returnTime: '',
    notes: ''
  });

  useEffect(() => {
    loadSchedules();
    loadRoutes();
  }, [selectedDate]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await transportService.getSchedules({ date: selectedDate });
      setSchedules(response.data || []);
    } catch (error) {
      toast.error('Errore nel caricamento delle programmazioni');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const response = await transportService.getRoutes({ isActive: true });
      setRoutes(response.data || []);
    } catch (error) {
      console.error('Errore nel caricamento dei percorsi:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.matchId && !formData.sessionId) {
      toast.error('Seleziona una partita o un allenamento');
      return;
    }

    try {
      await transportService.createSchedule(formData);
      toast.success('Viaggio programmato con successo');
      setShowForm(false);
      resetForm();
      loadSchedules();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Errore nella programmazione');
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      matchId: '',
      sessionId: '',
      pickupTime: '',
      returnTime: '',
      notes: ''
    });
  };

  const handleStatusUpdate = async (scheduleId, newStatus) => {
    try {
      await transportService.updateScheduleStatus(scheduleId, newStatus);
      toast.success('Stato aggiornato con successo');
      loadSchedules();
    } catch (error) {
      toast.error('Errore nell\'aggiornamento dello stato');
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa programmazione?')) {
      return;
    }

    try {
      await transportService.deleteSchedule(scheduleId);
      toast.success('Programmazione eliminata con successo');
      loadSchedules();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Errore nell\'eliminazione');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Programmato' },
      departed: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partito' },
      arrived: { bg: 'bg-green-100', text: 'text-green-700', label: 'Arrivato' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancellato' }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    
    return (
      <span className={`px-2 py-1 ${config.bg} ${config.text} text-xs rounded-full font-medium`}>
        {config.label}
      </span>
    );
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
          <h2 className="text-xl font-semibold text-gray-900">Programmazione Trasporti</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestisci i viaggi programmati per partite e allenamenti
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus />
            Programma Viaggio
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Nuovo Viaggio</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percorso *
                </label>
                <select
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleziona percorso...</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.capacity} posti)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Evento *
                </label>
                <select
                  value={formData.matchId ? 'match' : formData.sessionId ? 'training' : ''}
                  onChange={(e) => {
                    if (e.target.value === 'match') {
                      setFormData({ ...formData, matchId: 'match-1', sessionId: '' });
                    } else if (e.target.value === 'training') {
                      setFormData({ ...formData, sessionId: 'session-1', matchId: '' });
                    } else {
                      setFormData({ ...formData, matchId: '', sessionId: '' });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleziona tipo...</option>
                  <option value="match">Partita</option>
                  <option value="training">Allenamento</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orario Partenza *
                </label>
                <input
                  type="datetime-local"
                  value={formData.pickupTime}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orario Ritorno
                </label>
                <input
                  type="datetime-local"
                  value={formData.returnTime}
                  onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

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
                Programma Viaggio
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaCalendarAlt className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-600">Nessun viaggio programmato per questa data</p>
          <p className="text-sm text-gray-500 mt-2">
            Programma un nuovo viaggio per iniziare
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <FaBus className="text-blue-500 text-lg" />
                    <h3 className="font-semibold text-gray-900">
                      {schedule.route.name}
                    </h3>
                    {getStatusBadge(schedule.status)}
                    {schedule.isFull && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                        Completo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FaClock className="text-gray-400" />
                        <span className="text-gray-600">Partenza:</span>
                        <span className="font-medium">
                          {format(new Date(schedule.pickupTime), 'HH:mm', { locale: it })}
                        </span>
                      </div>
                      {schedule.returnTime && (
                        <div className="flex items-center gap-2">
                          <FaClock className="text-gray-400" />
                          <span className="text-gray-600">Ritorno:</span>
                          <span className="font-medium">
                            {format(new Date(schedule.returnTime), 'HH:mm', { locale: it })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <span className="text-gray-600">
                          {schedule.match ? 'Partita' : 'Allenamento'}
                        </span>
                      </div>
                      {schedule.match && (
                        <div className="mt-1 text-xs text-gray-500">
                          {schedule.match.homeTeam?.name} vs {schedule.match.awayTeam?.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-gray-400" />
                        <span className="text-gray-600">
                          {schedule._count?.bookings || 0}/{schedule.route.capacity} posti
                        </span>
                      </div>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${((schedule._count?.bookings || 0) / schedule.route.capacity) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {schedule.notes && (
                    <div className="mt-3 text-sm text-gray-600 italic">
                      📝 {schedule.notes}
                    </div>
                  )}
                </div>

                <div className="flex gap-1 ml-4">
                  {schedule.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(schedule.id, 'departed')}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                        title="Segna come partito"
                      >
                        Partito
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Elimina"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                  {schedule.status === 'departed' && (
                    <button
                      onClick={() => handleStatusUpdate(schedule.id, 'arrived')}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      title="Segna come arrivato"
                    >
                      Arrivato
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TransportScheduleCalendar;
