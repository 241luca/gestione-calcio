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
  ExclamationTriangleIcon
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

  // Combina partite e allenamenti in un unico array di eventi
  const events = [
    ...matches.map(match => ({
      ...match,
      type: 'match',
      title: `Partita vs ${match.opponent || 'TBD'}`,
      color: 'bg-blue-500',
      time: match.time || '00:00',
      team: teams.find(t => t.id === match.teamId)?.name || 'N/A',
      location: match.venue || match.location || 'Campo'
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
        title: 'Allenamento',
        color: 'bg-green-500',
        time: timeStr,
        team: teams.find(t => t.id === training.teamId)?.name || 'N/A',
        location: training.location || 'Campo'
      };
    })
  ];

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

  // Funzione per ottenere i giorni del mese
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Aggiungi giorni vuoti all'inizio se necessario
    const startDay = firstDay.getDay() || 7; // Converti domenica da 0 a 7
    for (let i = 1; i < startDay; i++) {
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
      if (filters.team !== 'all' && event.teamId !== parseInt(filters.team)) return false;
      return event.date === dateStr;
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
        const [hours, minutes] = formData.time.split(':');
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

  // Funzione per esportare il calendario
  const handleExport = () => {
    const exportData = events.map(event => ({
      Data: event.date,
      Ora: event.time,
      Tipo: event.type === 'match' ? 'Partita' : 'Allenamento',
      Squadra: event.team,
      Luogo: event.location,
      Avversario: event.opponent || '-',
      Competizione: event.competition || '-',
      Note: event.notes || '-'
    }));

    exportService.exportToCSV(exportData, 'calendario');
    toast.success('Calendario esportato');
  };

  // Funzione per stampare
  const handlePrint = () => {
    window.print();
    toast.success('Preparazione stampa...');
  };

  // Funzione per ricaricare tutti i dati
  const refetchAll = () => {
    refetchMatches();
    refetchTrainings();
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento calendario...</p>
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
            onClick={refetchAll} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
              <p className="text-gray-600">Gestisci partite e allenamenti</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filtri</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <PrinterIcon className="h-5 w-5" />
              <span>Stampa</span>
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>Esporta</span>
            </button>
            <button
              onClick={() => setShowEventModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Nuovo Evento</span>
            </button>
          </div>
        </div>

        {/* Filtri */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Squadra</label>
              <select
                value={filters.team}
                onChange={(e) => setFilters({...filters, team: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tutte le squadre</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tutti gli eventi</option>
                <option value="match">Solo partite</option>
                <option value="training">Solo allenamenti</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Vista selezione */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Vista Mensile
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Vista Lista
            </button>
          </div>

          {/* Navigazione mese */}
          {view === 'month' && (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <h2 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* Vista calendario mensile */}
        {view === 'month' && (
          <div className="grid grid-cols-7 gap-1">
            {/* Header giorni */}
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
              <div key={day} className="p-2 text-center font-semibold text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}
            
            {/* Giorni del mese */}
            {getDaysInMonth().map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day && day.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={index} 
                  className={`min-h-[100px] p-2 border ${day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {day && (
                    <>
                      <div className="font-semibold text-sm mb-1">
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded text-white ${event.color} cursor-pointer hover:opacity-80`}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className="font-semibold">{event.time}</div>
                            <div className="truncate">{event.title}</div>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} altri
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Vista lista */}
        {view === 'list' && (
          <div className="space-y-4">
            {events
              .filter(event => {
                if (filters.type !== 'all' && event.type !== filters.type) return false;
                if (filters.team !== 'all' && event.teamId !== parseInt(filters.team)) return false;
                return true;
              })
              .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
              .map(event => (
                <div 
                  key={`${event.type}-${event.id}`} 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded text-white ${event.color}`}>
                          {event.type === 'match' ? 'Partita' : 'Allenamento'}
                        </span>
                        <span className="font-semibold">{event.title}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <UserGroupIcon className="h-4 w-4" />
                          <span>{event.team}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      {event.opponent && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Avversario:</span> {event.opponent}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            
            {events.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nessun evento trovato
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal nuovo evento */}
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
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="match"
                        checked={formData.type === 'match'}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="mr-2"
                      />
                      <span>Partita</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="training"
                        checked={formData.type === 'training'}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="mr-2"
                      />
                      <span>Allenamento</span>
                    </label>
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