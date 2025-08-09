import React, { useState } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
  ShareIcon,
  UserPlusIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const EventDetailModal = ({ event, onClose, onEdit, onDelete, teams = [] }) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({
    date: event.date,
    time: event.time,
    teamId: event.teamId,
    location: event.location,
    opponent: event.opponent || '',
    competition: event.competition || '',
    notes: event.notes || '',
    type: event.type
  });

  if (!event) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
    toast.success('Stampa in corso...');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `${event.title} - ${formatDate(event.date)} alle ${event.time}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      // Fallback: copia negli appunti
      const text = `${event.title} - ${formatDate(event.date)} alle ${event.time} - ${event.location}`;
      navigator.clipboard.writeText(text);
      toast.success('Dettagli copiati negli appunti');
    }
  };

  const handleConvocazioni = () => {
    toast.success('Apertura modulo convocazioni...');
    // TODO: Aprire modal convocazioni
  };

  const handlePresenze = () => {
    if (event.type === 'training') {
      toast.success('Apertura registro presenze...');
      // TODO: Aprire modal presenze allenamento
    }
  };

  const handleReport = () => {
    toast.success('Generazione report...');
    // TODO: Generare report partita/allenamento
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    try {
      await onEdit(event.id, editData);
      setShowEditForm(false);
      toast.success(`${event.type === 'match' ? 'Partita' : 'Allenamento'} aggiornato con successo`);
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Sei sicuro di voler eliminare questo ${event.type === 'match' ? 'match' : 'allenamento'}?`)) {
      try {
        await onDelete(event);
        onClose();
        toast.success(`${event.type === 'match' ? 'Partita' : 'Allenamento'} eliminato con successo`);
      } catch (error) {
        toast.error('Errore durante l\'eliminazione');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {!showEditForm ? (
            <>
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {event.title}
                  </h3>
                  <span className={`inline-block mt-2 px-3 py-1 text-sm rounded-full text-white ${event.color}`}>
                    {event.type === 'match' ? 'Partita' : event.type === 'training' ? 'Allenamento' : 'Evento'}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Dettagli */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Data</p>
                      <p className="font-medium">{formatDate(event.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Orario</p>
                      <p className="font-medium">{event.time}</p>
                      {event.endTime && (
                        <p className="text-sm text-gray-500">
                          Fino alle {new Date(event.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Squadra</p>
                      <p className="font-medium">{event.team}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Luogo</p>
                      <p className="font-medium">{event.location}</p>
                    </div>
                  </div>
                </div>

                {/* Info aggiuntive per partite */}
                {event.type === 'match' && event.opponent && (
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Avversario</p>
                        <p className="font-medium">{event.opponent}</p>
                      </div>
                      {event.competition && (
                        <div>
                          <p className="text-sm text-gray-500">Competizione</p>
                          <p className="font-medium">{event.competition}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Note */}
                {event.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Note</p>
                    <p className="text-gray-700">{event.notes}</p>
                  </div>
                )}

                {/* Statistiche per allenamenti */}
                {event.type === 'training' && event.attendances && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Presenze</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                        <span className="text-sm">
                          Presenti: {event.attendances.filter(a => a.present).length}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                        <span className="text-sm">
                          Assenti: {event.attendances.filter(a => !a.present).length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Azioni */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {/* Modifica */}
                  <button
                    onClick={handleEdit}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="text-sm">Modifica</span>
                  </button>

                  {/* Elimina */}
                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="text-sm">Elimina</span>
                  </button>

                  {/* Stampa */}
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                  >
                    <PrinterIcon className="h-4 w-4" />
                    <span className="text-sm">Stampa</span>
                  </button>

                  {/* Condividi */}
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                  >
                    <ShareIcon className="h-4 w-4" />
                    <span className="text-sm">Condividi</span>
                  </button>

                  {/* Convocazioni (solo per partite) */}
                  {event.type === 'match' && (
                    <button
                      onClick={handleConvocazioni}
                      className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      <span className="text-sm">Convocazioni</span>
                    </button>
                  )}

                  {/* Presenze (solo per allenamenti) */}
                  {event.type === 'training' && (
                    <button
                      onClick={handlePresenze}
                      className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      <span className="text-sm">Presenze</span>
                    </button>
                  )}

                  {/* Report */}
                  <button
                    onClick={handleReport}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                    <span className="text-sm">Report</span>
                  </button>

                  {/* Duplica */}
                  <button
                    onClick={() => toast.success('Funzione duplica in arrivo...')}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    <span className="text-sm">Duplica</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Form di modifica */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Modifica {event.type === 'match' ? 'Partita' : 'Allenamento'}
                </h3>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={editData.date}
                      onChange={(e) => setEditData({...editData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ora
                    </label>
                    <input
                      type="time"
                      value={editData.time}
                      onChange={(e) => setEditData({...editData, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Squadra
                    </label>
                    <select
                      value={editData.teamId}
                      onChange={(e) => setEditData({...editData, teamId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleziona squadra</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Luogo
                    </label>
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) => setEditData({...editData, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {event.type === 'match' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Avversario
                        </label>
                        <input
                          type="text"
                          value={editData.opponent}
                          onChange={(e) => setEditData({...editData, opponent: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Competizione
                        </label>
                        <input
                          type="text"
                          value={editData.competition}
                          onChange={(e) => setEditData({...editData, competition: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
