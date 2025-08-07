import React, { useState, useEffect } from 'react';
import { FaTicketAlt, FaUser, FaBus, FaCalendar, FaMapMarkerAlt, FaTrash, FaSearch, FaPhone, FaPlus } from 'react-icons/fa';
import transportService from '../../services/transportService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

function TransportBookingList() {
  const [bookings, setBookings] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    athleteId: '',
    pickupPoint: '',
    dropoffPoint: '',
    notes: ''
  });

  useEffect(() => {
    loadUpcomingSchedules();
  }, []);

  useEffect(() => {
    if (selectedSchedule) {
      loadBookings(selectedSchedule);
    }
  }, [selectedSchedule]);

  const loadUpcomingSchedules = async () => {
    try {
      setLoading(true);
      const response = await transportService.getUpcomingSchedules(30);
      setSchedules(response.data || []);
      
      // Seleziona automaticamente il primo schedule se disponibile
      if (response.data && response.data.length > 0) {
        setSelectedSchedule(response.data[0].id);
      }
    } catch (error) {
      toast.error('Errore nel caricamento delle programmazioni');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async (scheduleId) => {
    try {
      setLoading(true);
      const response = await transportService.getScheduleBookings(scheduleId);
      setBookings(response.data || []);
    } catch (error) {
      toast.error('Errore nel caricamento delle prenotazioni');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId, athleteName) => {
    const reason = window.prompt(`Motivo della cancellazione per ${athleteName}:`);
    if (reason === null) return; // Utente ha annullato

    try {
      await transportService.cancelBooking(bookingId, reason);
      toast.success('Prenotazione cancellata con successo');
      loadBookings(selectedSchedule);
    } catch (error) {
      toast.error('Errore nella cancellazione della prenotazione');
      console.error(error);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    
    try {
      await transportService.createBooking(
        bookingForm.athleteId,
        selectedSchedule,
        {
          pickupPoint: bookingForm.pickupPoint,
          dropoffPoint: bookingForm.dropoffPoint,
          notes: bookingForm.notes
        }
      );
      toast.success('Prenotazione creata con successo');
      setShowBookingForm(false);
      setBookingForm({
        athleteId: '',
        pickupPoint: '',
        dropoffPoint: '',
        notes: ''
      });
      loadBookings(selectedSchedule);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Errore nella creazione della prenotazione');
    }
  };

  const selectedScheduleData = schedules.find(s => s.id === selectedSchedule);
  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${booking.athlete.firstName} ${booking.athlete.lastName}`.toLowerCase();
    return fullName.includes(searchLower);
  });

  if (loading && schedules.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gestione Prenotazioni</h2>
        <p className="text-sm text-gray-600 mt-1">
          Visualizza e gestisci le prenotazioni per i viaggi programmati
        </p>
      </div>

      {/* Schedule Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleziona Viaggio
            </label>
            <select
              value={selectedSchedule}
              onChange={(e) => setSelectedSchedule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleziona un viaggio --</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {format(new Date(schedule.pickupTime), 'dd/MM/yyyy HH:mm', { locale: it })} - 
                  {' '}{schedule.route.name} - 
                  {' '}{schedule.match ? 'Partita' : 'Allenamento'}
                  {' '}({schedule._count?.bookings || 0}/{schedule.route.capacity})
                </option>
              ))}
            </select>
          </div>

          {selectedSchedule && (
            <div className="flex gap-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cerca atleta..."
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {selectedScheduleData && !selectedScheduleData.isFull && (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus />
                  Nuova Prenotazione
                </button>
              )}
            </div>
          )}
        </div>

        {/* Schedule Info */}
        {selectedScheduleData && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Percorso:</span>
                <p className="font-medium">{selectedScheduleData.route.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Partenza:</span>
                <p className="font-medium">{selectedScheduleData.route.startLocation}</p>
              </div>
              <div>
                <span className="text-gray-600">Arrivo:</span>
                <p className="font-medium">{selectedScheduleData.route.endLocation}</p>
              </div>
              <div>
                <span className="text-gray-600">Posti Disponibili:</span>
                <p className="font-medium">
                  {selectedScheduleData.availableSeats} su {selectedScheduleData.route.capacity}
                </p>
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${((selectedScheduleData._count?.bookings || 0) / selectedScheduleData.route.capacity) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Form */}
      {showBookingForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Nuova Prenotazione</h3>
          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atleta ID * (temporaneo)
                </label>
                <input
                  type="text"
                  value={bookingForm.athleteId}
                  onChange={(e) => setBookingForm({ ...bookingForm, athleteId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ID atleta..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Punto di Salita
                </label>
                <input
                  type="text"
                  value={bookingForm.pickupPoint}
                  onChange={(e) => setBookingForm({ ...bookingForm, pickupPoint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="es. Piazza Garibaldi"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Punto di Discesa
                </label>
                <input
                  type="text"
                  value={bookingForm.dropoffPoint}
                  onChange={(e) => setBookingForm({ ...bookingForm, dropoffPoint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="es. Campo Sportivo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Note aggiuntive..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crea Prenotazione
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBookingForm(false);
                  setBookingForm({
                    athleteId: '',
                    pickupPoint: '',
                    dropoffPoint: '',
                    notes: ''
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bookings List */}
      {selectedSchedule && (
        <>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FaTicketAlt className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Nessuna prenotazione trovata con questi criteri' 
                  : 'Nessuna prenotazione per questo viaggio'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-gray-500 mt-2">
                  Clicca su "Nuova Prenotazione" per aggiungere atleti
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atleta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Punto Salita
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Punto Discesa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contatto
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
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.athlete.firstName} {booking.athlete.lastName}
                            </div>
                            {booking.athlete.transportZone && (
                              <div className="text-xs text-gray-500">
                                Zona: {booking.athlete.transportZone.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FaMapMarkerAlt className="text-green-500 mr-2" />
                          {booking.pickupPoint}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FaMapMarkerAlt className="text-red-500 mr-2" />
                          {booking.dropoffPoint}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.athlete.phone && (
                            <div className="flex items-center gap-1">
                              <FaPhone className="text-gray-400 text-xs" />
                              {booking.athlete.phone}
                            </div>
                          )}
                          {booking.athlete.parentPhone && (
                            <div className="text-xs text-gray-500">
                              Genitore: {booking.athlete.parentPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {booking.status === 'confirmed' ? 'Confermata' : 'Cancellata'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(
                              booking.id,
                              `${booking.athlete.firstName} ${booking.athlete.lastName}`
                            )}
                            className="text-red-600 hover:text-red-900"
                            title="Cancella prenotazione"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TransportBookingList;
