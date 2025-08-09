import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  PlusIcon, 
  ClockIcon, 
  MapPinIcon,
  UserGroupIcon,
  XMarkIcon,
  FunnelIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { exportService } from '../services/exportService';
import { useApiData, useApiMutation } from '../hooks/useApiData';

const CalendarPage = () => {
  // Hook per recuperare dati dal backend
  const { data: matches = [], loading: loadingMatches, error: errorMatches, refetch: refetchMatches } = useApiData('/matches');
  const { data: trainings = [], loading: loadingTrainings, error: errorTrainings, refetch: refetchTrainings } = useApiData('/training-sessions');
  const { data: teams = [], loading: loadingTeams, error: errorTeams } = useApiData('/teams');
  const { mutate } = useApiMutation();

  // Stati locali per UI
  const [view, setView] = useState('month'); // month, week, list
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventType, setEventType] = useState('match'); // match, training
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    team: 'all',
    type: 'all'
  });

  // Debug: verifica i dati ricevuti
  console.log('🏃 Trainings ricevuti:', trainings.length);
  console.log('⚽ Matches ricevuti:', matches.length);
  
  // Combina partite e allenamenti in un unico array di eventi
  const events = [
    ...matches.map(match => ({
      ...match,
      type: 'match',
      title: `Partita vs ${match.opponent || 'TBD'}`,
      color: 'bg-blue-500',
      time: match.time || '00:00',
      team: teams.find(t => t.id === match.teamId)?.name || 'N/A',
      location: typeof match.venue === 'object' ? match.venue.name : (match.venue || match.location || 'Campo')
    })),
    ...trainings.map(training => {
      // Estrai l'ora da startTime
      const startTime = training.startTime ? new Date(training.startTime) : null;
      const timeStr = startTime ? 
        `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}` : 
        '00:00';
      
      return {
        ...training,
        type: 'training',
        title: training.type || 'Allenamento',
        color: 'bg-green-500',
        time: timeStr,
        team: teams.find(t => t.id === training.teamId)?.name || 'N/A',
        location: training.location || 'Campo'
      };
    })
  ];

  // Ordina eventi per data
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Loading state
  const loading = loadingMatches || loadingTrainings || loadingTeams;
  const error = errorMatches || errorTrainings || errorTeams;

  // Funzione per formattare la data
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Funzione per ottenere i giorni del mese
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Aggiungi giorni vuoti all'inizio se necessario (Lunedì = 1, Domenica = 0)
    const startDay = firstDay.getDay();
    const emptyDays = startDay === 0 ? 6 : startDay - 1; // Converti per iniziare da Lunedì
    
    for (let i = 0; i < emptyDays; i++) {
      days.push(null);
    }
    
    // Aggiungi tutti i giorni del mese
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Funzione per ottenere gli eventi di un giorno specifico
  const getEventsForDay = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      if (filters.type !== 'all' && event.type !== filters.type) return false;
      if (filters.team !== 'all' && event.teamId !== filters.team && event.teamId !== parseInt(filters.team)) return false;
      // Gestisci date in formati diversi
      let eventDate;
      if (event.date) {
        // Se event.date è già una stringa ISO, usala direttamente
        eventDate = event.date.split('T')[0];
      } else {
        return false;
      }
      return eventDate === dateStr;
    });
  };

  // Funzione per navigare tra i mesi
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Form per nuovo evento
  const [formData, setFormData] = useState({
    title: '',
    type: 'match',
    date: '',
    time: '',
    startTime: '',
    endTime: '',
    teamId: '',
    location: '',
    opponent: '',
    competition: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time || !formData.teamId) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    try {
      if (formData.type === 'match') {
        // Crea una nuova partita
        await mutate('post', '/matches', {
          date: formData.date,
          time: formData.time,
          teamId: formData.teamId,
          opponent: formData.opponent,
          venue: formData.location,
          competition: formData.competition,
          notes: formData.notes,
          homeTeamId: formData.teamId,
          awayTeamId: null, // Partita in trasferta
          status: 'SCHEDULED'
        }, 'Partita aggiunta con successo');
        refetchMatches();
      } else {
        // Crea un nuovo allenamento
        // Calcola startTime e endTime basandosi su time
        const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1, endDateTime.getMinutes() + 30); // 1h 30min di durata
        
        await mutate('post', '/training-sessions', {
          date: formData.date,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          teamId: formData.teamId,
          location: formData.location,
          notes: formData.notes,
          type: formData.notes || 'Allenamento'
        }, 'Allenamento aggiunto con successo');
        refetchTrainings();
      }
      
      setShowEventModal(false);
      resetForm();
    } catch (error) {
      // Errore già gestito da mutate
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'match',
      date: '',
      time: '',
      startTime: '',
      endTime: '',
      teamId: '',
      location: '',
      opponent: '',
      competition: '',
      notes: ''
    });
  };

  // Funzione per eliminare un evento
  const handleDeleteEvent = async (event) => {
    if (!window.confirm(`Sei sicuro di voler eliminare questo ${event.type === 'match' ? 'match' : 'allenamento'}?`)) {
      return;
    }

    try {
      if (event.type === 'match') {
        await mutate('delete', `/matches/${event.id}`, null, 'Partita eliminata con successo');
        refetchMatches();
      } else {
        await mutate('delete', `/training-sessions/${event.id}`, null, 'Allenamento eliminato con successo');
        refetchTrainings();
      }
      setSelectedEvent(null);
    } catch (error) {
      // Errore già gestito da mutate
    }
  };

  // Funzione per esportare calendario
  const handleExport = async () => {
    try {
      await exportService.exportCalendar(events, currentDate);
      toast.success('Calendario esportato con successo');
    } catch (error) {
      toast.error('Errore durante l\'esportazione');
    }
  };

  // Funzione per stampare
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg">
        <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
        Si è verificato un errore nel caricamento dei dati
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Calendario</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FunnelIcon className="h-5 w-5 inline mr-2" />
            Filtri
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <PrinterIcon className="h-5 w-5 inline mr-2" />
            Stampa
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-5 w-5 inline mr-2" />
            Esporta
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Aggiungi Evento
          </button>
        </div>
      </div>

      {/* Filtri */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Squadra
              </label>
              <select
                value={filters.team}
                onChange={(e) => setFilters({...filters, team: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tutte le squadre</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tutti gli eventi</option>
                <option value="match">Solo partite</option>
                <option value="training">Solo allenamenti</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ team: 'all', type: 'all' })}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Resetta filtri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controlli vista */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-lg ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <CalendarDaysIcon className="h-5 w-5 inline mr-2" />
            Mese
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <ListBulletIcon className="h-5 w-5 inline mr-2" />
            Lista
          </button>
        </div>

        {view === 'month' && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-medium">
              {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Vista Mese */}
      {view === 'month' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
              <div key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {getDaysInMonth().map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day && day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border-r border-b ${!day ? 'bg-gray-50' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            onClick={() => setSelectedEvent(event)}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${event.color} text-white truncate`}
                          >
                            {event.time} - {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 3} altri
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista Lista */}
      {view === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Squadra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Luogo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEvents
                  .filter(event => {
                    if (filters.type !== 'all' && event.type !== filters.type) return false;
                    if (filters.team !== 'all' && event.teamId !== filters.team && event.teamId !== parseInt(filters.team)) return false;
                    return true;
                  })
                  .map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatShortDate(event.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded text-white ${event.color}`}>
                          {event.type === 'match' ? 'Partita' : 'Allenamento'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.team}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Dettagli
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                {sortedEvents.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      Nessun evento trovato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal per nuovo evento */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowEventModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Nuovo Evento
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Tipo evento */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo di evento
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'match'})}
                      className={`p-3 border rounded-lg ${formData.type === 'match' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    >
                      Partita
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'training'})}
                      className={`p-3 border rounded-lg ${formData.type === 'training' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    >
                      Allenamento
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Ora */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ora *
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Squadra */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Squadra *
                    </label>
                    <select
                      value={formData.teamId}
                      onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleziona squadra</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Campo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Campo/Luogo *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="es. Campo Comunale"
                      required
                    />
                  </div>

                  {/* Campi solo per partite */}
                  {formData.type === 'match' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Avversario
                        </label>
                        <input
                          type="text"
                          value={formData.opponent}
                          onChange={(e) => setFormData({...formData, opponent: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="es. Roma FC"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Competizione
                        </label>
                        <input
                          type="text"
                          value={formData.competition}
                          onChange={(e) => setFormData({...formData, competition: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="es. Campionato"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Note */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Aggiungi eventuali note..."
                  />
                </div>

                {/* Pulsanti */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Salva Evento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal dettaglio evento */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" onClick={() => setSelectedEvent(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Dettagli Evento
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className={`px-2 py-1 text-xs rounded text-white ${selectedEvent.color}`}>
                    {selectedEvent.type === 'match' ? 'Partita' : 'Allenamento'}
                  </span>
                </div>
                
                <h4 className="text-xl font-semibold">{selectedEvent.title}</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <span>{formatDate(selectedEvent.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <span>{selectedEvent.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    <span>{selectedEvent.team}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <span>{selectedEvent.location}</span>
                  </div>
                </div>

                {selectedEvent.opponent && (
                  <div className="pt-3 border-t">
                    <p className="text-sm"><strong>Avversario:</strong> {selectedEvent.opponent}</p>
                    {selectedEvent.competition && (
                      <p className="text-sm mt-1"><strong>Competizione:</strong> {selectedEvent.competition}</p>
                    )}
                  </div>
                )}

                {selectedEvent.notes && (
                  <div className="pt-3 border-t">
                    <p className="text-sm"><strong>Note:</strong></p>
                    <p className="text-sm text-gray-600 mt-1">{selectedEvent.notes}</p>
                  </div>
                )}

                <div className="pt-4 flex justify-end space-x-2">
                  {selectedEvent.type === 'match' && (
                    <button
                      onClick={() => {
                        toast.success('Convocazioni in arrivo (funzione da completare)');
                        setSelectedEvent(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Convocazioni
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Elimina
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
