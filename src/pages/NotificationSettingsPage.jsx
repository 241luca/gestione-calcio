// src/pages/NotificationSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Bell,
  Mail,
  MessageSquare,
  Clock,
  Settings,
  Save,
  TestTube,
  AlertCircle,
  Check,
  X,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

function NotificationSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  
  // Email Settings (Brevo)
  const [emailSettings, setEmailSettings] = useState({
    provider: 'brevo',
    apiKey: '',
    senderEmail: 'noreply@soccermanager.com',
    senderName: 'Soccer Manager',
    enabled: true,
    testMode: false
  });

  // Preferenze Default
  const [defaultPreferences, setDefaultPreferences] = useState({
    emailEnabled: true,
    emailFrequency: 'instant',
    notificationTypes: {
      documents: true,
      payments: true,
      matches: true,
      training: true,
      roster: true,
      injuries: true,
      general: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  // Template
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Statistiche
  const [stats, setStats] = useState({
    emailsSent: 0,
    emailsFailed: 0,
    notificationsSent: 0,
    usersWithEmail: 0
  });

  useEffect(() => {
    loadSettings();
    loadTemplates();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:3000/api/v1/settings/notifications',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setEmailSettings(response.data.data.email || emailSettings);
        setDefaultPreferences(response.data.data.preferences || defaultPreferences);
      }
    } catch (error) {
      console.error('Errore caricamento impostazioni:', error);
      // Se l'endpoint non esiste ancora, usa i valori di default
    }
  };

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:3000/api/v1/notification-templates',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      // Template di default se l'endpoint non esiste
      setTemplates([
        {
          id: '1',
          name: 'Documento in scadenza',
          type: 'document_expiry',
          title: 'Documento in scadenza',
          message: 'Il documento {{documentType}} di {{athleteName}} scade il {{expiryDate}}',
          variables: ['documentType', 'athleteName', 'expiryDate'],
          isSystem: true
        },
        {
          id: '2',
          name: 'Pagamento scaduto',
          type: 'payment_overdue',
          title: 'Pagamento scaduto',
          message: 'Il pagamento di €{{amount}} per {{athleteName}} è scaduto',
          variables: ['amount', 'athleteName'],
          isSystem: true
        }
      ]);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:3000/api/v1/notifications/stats',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  };

  const saveEmailSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/v1/settings/notifications/email',
        emailSettings,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Impostazioni email salvate!');
      }
    } catch (error) {
      toast.error('Errore salvataggio impostazioni');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/v1/settings/notifications/test-email',
        {
          to: 'test@example.com',
          settings: emailSettings
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Email di test inviata con successo!');
      }
    } catch (error) {
      toast.error('Errore invio email di test');
    } finally {
      setLoading(false);
    }
  };

  const saveDefaultPreferences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/v1/settings/notifications/preferences',
        defaultPreferences,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Preferenze salvate e applicate a tutti gli utenti!');
      }
    } catch (error) {
      toast.error('Errore salvataggio preferenze');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingTemplate.id 
        ? `http://localhost:3000/api/v1/notification-templates/${editingTemplate.id}`
        : 'http://localhost:3000/api/v1/notification-templates';
      
      const method = editingTemplate.id ? 'PUT' : 'POST';
      
      const response = await axios({
        method,
        url,
        data: editingTemplate,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Template salvato!');
        loadTemplates();
        setShowTemplateModal(false);
        setEditingTemplate(null);
      }
    } catch (error) {
      toast.error('Errore salvataggio template');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:3000/api/v1/notification-templates/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success('Template eliminato!');
      loadTemplates();
    } catch (error) {
      toast.error('Errore eliminazione template');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          <Settings className="inline-block mr-2 mb-1" />
          Impostazioni Notifiche
        </h1>
        <p className="text-gray-600 mt-2">
          Configura email, preferenze e template delle notifiche
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('email')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Mail className="inline-block w-4 h-4 mr-2" />
            Email (Brevo)
          </button>
          
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="inline-block w-4 h-4 mr-2" />
            Preferenze Default
          </button>
          
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="inline-block w-4 h-4 mr-2" />
            Template
          </button>
          
          <button
            onClick={() => setActiveTab('future')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'future'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <RefreshCw className="inline-block w-4 h-4 mr-2" />
            Integrazioni Future
          </button>
        </nav>
      </div>

      {/* Tab Email */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Configurazione Brevo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Configurazione Brevo (SendinBlue)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={emailSettings.apiKey}
                  onChange={(e) => setEmailSettings({
                    ...emailSettings,
                    apiKey: e.target.value
                  })}
                  placeholder="xkeysib-xxxxxxxxxxxx"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ottieni la tua API key da{' '}
                  <a href="https://app.brevo.com/settings/keys/api" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-blue-500 hover:underline">
                    Brevo Dashboard
                  </a>
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Mittente
                  </label>
                  <input
                    type="email"
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings({
                      ...emailSettings,
                      senderEmail: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Mittente
                  </label>
                  <input
                    type="text"
                    value={emailSettings.senderName}
                    onChange={(e) => setEmailSettings({
                      ...emailSettings,
                      senderName: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={emailSettings.enabled}
                    onChange={(e) => setEmailSettings({
                      ...emailSettings,
                      enabled: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Email notifiche abilitate</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={emailSettings.testMode}
                    onChange={(e) => setEmailSettings({
                      ...emailSettings,
                      testMode: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    Modalità test (non invia realmente le email)
                  </span>
                </label>
              </div>
              
              <div className="flex justify-between pt-4">
                <button
                  onClick={testEmailConnection}
                  disabled={loading || !emailSettings.apiKey}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  <TestTube className="inline-block w-4 h-4 mr-2" />
                  Test Connessione
                </button>
                
                <button
                  onClick={saveEmailSettings}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  <Save className="inline-block w-4 h-4 mr-2" />
                  Salva Impostazioni
                </button>
              </div>
            </div>
          </div>

          {/* Statistiche Email */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Statistiche Email</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.emailsSent}
                </p>
                <p className="text-sm text-gray-500">Email Inviate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {stats.emailsFailed}
                </p>
                <p className="text-sm text-gray-500">Email Fallite</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.usersWithEmail}
                </p>
                <p className="text-sm text-gray-500">Utenti con Email</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {((stats.emailsSent / (stats.emailsSent + stats.emailsFailed)) * 100 || 0).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Preferenze */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Preferenze Default per Nuovi Utenti
            </h2>
            
            <div className="space-y-4">
              {/* Frequenza Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequenza Email Default
                </label>
                <select
                  value={defaultPreferences.emailFrequency}
                  onChange={(e) => setDefaultPreferences({
                    ...defaultPreferences,
                    emailFrequency: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="instant">Istantanea</option>
                  <option value="daily">Digest Giornaliero</option>
                  <option value="weekly">Digest Settimanale</option>
                  <option value="never">Mai</option>
                </select>
              </div>
              
              {/* Tipi Notifiche */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipi di Notifiche Abilitate
                </label>
                <div className="space-y-2">
                  {Object.entries(defaultPreferences.notificationTypes).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setDefaultPreferences({
                          ...defaultPreferences,
                          notificationTypes: {
                            ...defaultPreferences.notificationTypes,
                            [key]: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">
                        {key === 'documents' && '📄 Documenti'}
                        {key === 'payments' && '💰 Pagamenti'}
                        {key === 'matches' && '⚽ Partite'}
                        {key === 'training' && '🏃 Allenamenti'}
                        {key === 'roster' && '📋 Convocazioni'}
                        {key === 'injuries' && '🏥 Infortuni'}
                        {key === 'general' && '📢 Generali'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Quiet Hours */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={defaultPreferences.quietHours.enabled}
                    onChange={(e) => setDefaultPreferences({
                      ...defaultPreferences,
                      quietHours: {
                        ...defaultPreferences.quietHours,
                        enabled: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">
                    Abilita Orari di Silenzio
                  </span>
                </label>
                
                {defaultPreferences.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-xs text-gray-500">Dalle</label>
                      <input
                        type="time"
                        value={defaultPreferences.quietHours.start}
                        onChange={(e) => setDefaultPreferences({
                          ...defaultPreferences,
                          quietHours: {
                            ...defaultPreferences.quietHours,
                            start: e.target.value
                          }
                        })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Alle</label>
                      <input
                        type="time"
                        value={defaultPreferences.quietHours.end}
                        onChange={(e) => setDefaultPreferences({
                          ...defaultPreferences,
                          quietHours: {
                            ...defaultPreferences.quietHours,
                            end: e.target.value
                          }
                        })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={saveDefaultPreferences}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  <Save className="inline-block w-4 h-4 mr-2" />
                  Salva e Applica a Tutti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Template */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Template Notifiche</h2>
              <button
                onClick={() => {
                  setEditingTemplate({
                    name: '',
                    type: '',
                    title: '',
                    message: '',
                    variables: []
                  });
                  setShowTemplateModal(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Plus className="inline-block w-4 h-4 mr-2" />
                Nuovo Template
              </button>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {template.name}
                          {template.isSystem && (
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                              Sistema
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Tipo: {template.type}
                        </p>
                        <p className="text-sm mt-2">
                          <strong>Titolo:</strong> {template.title}
                        </p>
                        <p className="text-sm mt-1">
                          <strong>Messaggio:</strong> {template.message}
                        </p>
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Variabili: </span>
                          {template.variables?.map(v => (
                            <span key={v} className="text-xs bg-blue-100 px-2 py-1 rounded ml-1">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setEditingTemplate(template);
                            setShowTemplateModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          disabled={template.isSystem}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          disabled={template.isSystem}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Integrazioni Future */}
      {activeTab === 'future' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Integrazioni Future
            </h2>
            
            <div className="space-y-6">
              {/* Push Notifications */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      📱
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold">Push Notifications Mobile</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Notifiche push per app mobile iOS e Android
                    </p>
                    <div className="mt-3">
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        In Sviluppo
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        Disponibile quando l'app mobile sarà pronta
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-xs text-gray-500">Provider supportati:</p>
                      <div className="flex space-x-4 mt-2">
                        <span className="text-sm">• Firebase Cloud Messaging</span>
                        <span className="text-sm">• OneSignal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      💬
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold">WhatsApp Business</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Notifiche urgenti via WhatsApp
                    </p>
                    <div className="mt-3">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        Pianificato
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        Q2 2025
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-xs text-gray-500">Casi d'uso:</p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>• Convocazioni last-minute</li>
                        <li>• Annullamenti allenamenti</li>
                        <li>• Promemoria pagamenti urgenti</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMS */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      📨
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold">SMS</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      SMS per notifiche critiche
                    </p>
                    <div className="mt-3">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        Pianificato
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        Q3 2025
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-xs text-gray-500">Provider:</p>
                      <div className="flex space-x-4 mt-2">
                        <span className="text-sm">• Twilio</span>
                        <span className="text-sm">• Vonage</span>
                        <span className="text-sm">• MessageBird</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-blue-900">
                  Informazioni sulle integrazioni future
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Queste integrazioni sono pianificate per versioni future del sistema.
                  Le date sono indicative e potrebbero variare in base alle priorità di sviluppo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Template */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingTemplate?.id ? 'Modifica Template' : 'Nuovo Template'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Template
                </label>
                <input
                  type="text"
                  value={editingTemplate?.name || ''}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    name: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={editingTemplate?.type || ''}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    type: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Seleziona tipo...</option>
                  <option value="document_expiry">Documento in scadenza</option>
                  <option value="payment_overdue">Pagamento scaduto</option>
                  <option value="match_convocation">Convocazione partita</option>
                  <option value="training_cancelled">Allenamento annullato</option>
                  <option value="custom">Personalizzato</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titolo
                </label>
                <input
                  type="text"
                  value={editingTemplate?.title || ''}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    title: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Es: Documento in scadenza"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Messaggio
                </label>
                <textarea
                  value={editingTemplate?.message || ''}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    message: e.target.value
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Es: Il documento {{documentType}} di {{athleteName}} scade il {{expiryDate}}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa {`{{variabile}}`} per inserire variabili dinamiche
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variabili disponibili
                </label>
                <input
                  type="text"
                  value={editingTemplate?.variables?.join(', ') || ''}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    variables: e.target.value.split(',').map(v => v.trim())
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="athleteName, documentType, expiryDate"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separa le variabili con virgole
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={saveTemplate}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Salva Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationSettingsPage;
