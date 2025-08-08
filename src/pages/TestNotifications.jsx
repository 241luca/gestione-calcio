// src/pages/TestNotifications.jsx
import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';

function TestNotifications() {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { connected, testConnection } = useSocket();

  // Test connessione Socket.io
  const handleTestSocket = () => {
    testConnection();
    toast.success('Test ping inviato!');
  };

  // Genera notifiche di test
  const handleGenerateNotifications = async (type) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/v1/notifications/send-reminders',
        { type },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Notifiche ${type} generate!`);
        console.log('Risultato:', response.data.data);
      }
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore generazione notifiche');
    } finally {
      setLoading(false);
    }
  };

  // Carica notifiche esistenti
  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:3000/api/v1/notifications',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        toast.success(`Caricate ${response.data.data.notifications.length} notifiche`);
      }
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore caricamento notifiche');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 Test Sistema Notifiche</h1>

      {/* Status Connessione */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Stato Connessione</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Socket.io: {connected ? 'Connesso' : 'Disconnesso'}</span>
          </div>
          <button
            onClick={handleTestSocket}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Ping
          </button>
        </div>
      </div>

      {/* Generazione Notifiche */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Genera Notifiche di Test</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleGenerateNotifications('documents')}
            disabled={loading}
            className="p-4 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            📄 Documenti in Scadenza
          </button>
          <button
            onClick={() => handleGenerateNotifications('payments')}
            disabled={loading}
            className="p-4 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            💰 Pagamenti Scaduti
          </button>
          <button
            onClick={() => handleGenerateNotifications('matches')}
            disabled={loading}
            className="p-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            ⚽ Promemoria Partite
          </button>
          <button
            onClick={() => handleGenerateNotifications('all')}
            disabled={loading}
            className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            🔔 Tutte le Notifiche
          </button>
        </div>
      </div>

      {/* Lista Notifiche */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Notifiche Ricevute</h2>
          <button
            onClick={loadNotifications}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Ricarica
          </button>
        </div>
        
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div key={notif.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between">
                  <h3 className="font-semibold">{notif.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    notif.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    notif.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {notif.priority}
                  </span>
                </div>
                <p className="text-gray-600">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleString('it-IT')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nessuna notifica. Premi "Genera Notifiche di Test" per crearne alcune!
          </p>
        )}
      </div>

      {/* Istruzioni */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">📋 Come testare:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Verifica che Socket.io sia connesso (pallino verde)</li>
          <li>Premi uno dei pulsanti per generare notifiche di test</li>
          <li>Guarda in alto a destra nella campanella per vedere il badge aggiornarsi</li>
          <li>Dovrebbero apparire anche dei toast di notifica</li>
          <li>Clicca su "Ricarica" per vedere le notifiche nella lista</li>
        </ol>
      </div>
    </div>
  );
}

export default TestNotifications;
