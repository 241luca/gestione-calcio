// src/pages/EmailSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Mail, 
  Settings, 
  Save, 
  TestTube,
  Key,
  User,
  Globe,
  Bell,
  CheckCircle,
  XCircle,
  Info,
  Send
} from 'lucide-react';

function EmailSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    provider: 'brevo',
    brevoApiKey: '',
    brevoSenderEmail: '',
    brevoSenderName: 'Soccer Manager',
    emailEnabled: true,
    testEmail: ''
  });
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    message: '',
    lastChecked: null
  });

  // Carica configurazione attuale
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:3000/api/v1/settings/email',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setSettings(response.data.data);
        // Controlla connessione
        await checkConnection(false);
      }
    } catch (error) {
      console.error('Errore caricamento impostazioni:', error);
      // Se l'endpoint non esiste ancora, usa valori di default dal .env
      setSettings({
        ...settings,
        brevoApiKey: process.env.BREVO_API_KEY || '',
        brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@soccermanager.com'
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!settings.brevoApiKey) {
      toast.error('Inserisci la API Key di Brevo');
      return;
    }
    
    if (!settings.brevoSenderEmail) {
      toast.error('Inserisci l\'email del mittente');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/v1/settings/email',
        settings,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Impostazioni salvate con successo!');
        // Verifica connessione dopo salvataggio
        await checkConnection();
      }
    } catch (error) {
      toast.error('Errore nel salvataggio delle impostazioni');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async (showToast = true) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/v1/settings/email/verify',
        { apiKey: settings.brevoApiKey },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setConnectionStatus({
          connected: true,
          message: 'Connessione a Brevo attiva',
          lastChecked: new Date()
        });
        if (showToast) {
          toast.success('Connessione a Brevo verificata!');
        }
      }
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: 'Connessione a Brevo non riuscita',
        lastChecked: new Date()
      });
      if (showToast) {
        toast.error('Connessione a Brevo fallita');
      }
    }
  };

  const sendTestEmail = async () => {
    if (!settings.testEmail) {
      toast.error('Inserisci un indirizzo email di test');
      return;
    }

    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/v1/settings/email/test',
        { 
          to: settings.testEmail,
          settings: settings
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success(`Email di test inviata a ${settings.testEmail}!`);
      }
    } catch (error) {
      toast.error('Errore invio email di test');
      console.error(error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          <Mail className="inline-block mr-2 mb-1" />
          Configurazione Email
        </h1>
        <p className="text-gray-600 mt-2">
          Configura il servizio di invio email per le notifiche
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {connectionStatus.connected ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
            <div>
              <p className="font-semibold text-lg">
                {connectionStatus.connected ? 'Servizio Email Attivo' : 'Servizio Email Non Configurato'}
              </p>
              <p className="text-sm text-gray-500">
                {connectionStatus.message}
              </p>
              {connectionStatus.lastChecked && (
                <p className="text-xs text-gray-400">
                  Ultimo controllo: {connectionStatus.lastChecked.toLocaleTimeString('it-IT')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => checkConnection()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Verifica Connessione
          </button>
        </div>
      </div>

      {/* Configurazione Brevo */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <Settings className="mr-2" />
            Configurazione Brevo (SendinBlue)
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Key className="inline w-4 h-4 mr-1" />
              API Key *
            </label>
            <input
              type="password"
              value={settings.brevoApiKey}
              onChange={(e) => setSettings({ ...settings, brevoApiKey: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">
              Trova la tua API key nel pannello Brevo: Settings → API Keys
            </p>
          </div>

          {/* Sender Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline w-4 h-4 mr-1" />
              Email Mittente *
            </label>
            <input
              type="email"
              value={settings.brevoSenderEmail}
              onChange={(e) => setSettings({ ...settings, brevoSenderEmail: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="noreply@tuodominio.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email verificata su Brevo che apparirà come mittente
            </p>
          </div>

          {/* Sender Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline w-4 h-4 mr-1" />
              Nome Mittente
            </label>
            <input
              type="text"
              value={settings.brevoSenderName}
              onChange={(e) => setSettings({ ...settings, brevoSenderName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Soccer Manager"
            />
          </div>

          {/* Enable/Disable */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium">
                Abilita invio email
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6">
              Se disabilitato, le notifiche saranno solo in-app
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvataggio...' : 'Salva Configurazione'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Email */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <TestTube className="mr-2" />
            Test Invio Email
          </h2>
        </div>
        
        <div className="p-6">
          <div className="flex space-x-4">
            <input
              type="email"
              value={settings.testEmail}
              onChange={(e) => setSettings({ ...settings, testEmail: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="test@example.com"
            />
            <button
              onClick={sendTestEmail}
              disabled={testing || !connectionStatus.connected}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              {testing ? 'Invio...' : 'Invia Email Test'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Invia un'email di test per verificare la configurazione
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3 text-blue-900 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          Come configurare Brevo
        </h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>1. Crea un account Brevo:</strong>
            <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" className="ml-2 underline">
              www.brevo.com
            </a>
          </li>
          <li>
            <strong>2. Verifica il tuo dominio email:</strong>
            <span className="ml-2">Settings → Senders & IP → Domains</span>
          </li>
          <li>
            <strong>3. Crea una API Key:</strong>
            <span className="ml-2">Settings → API Keys → Generate new API key</span>
          </li>
          <li>
            <strong>4. Copia la API Key:</strong>
            <span className="ml-2">Incollala nel campo sopra</span>
          </li>
          <li>
            <strong>5. Configura l'email mittente:</strong>
            <span className="ml-2">Deve essere verificata su Brevo</span>
          </li>
        </ol>
        
        <div className="mt-4 p-3 bg-white rounded">
          <p className="text-xs text-gray-600">
            <strong>Piano gratuito Brevo:</strong> 300 email/giorno, perfetto per iniziare!
          </p>
        </div>
      </div>

      {/* Template Settings Link */}
      <div className="mt-6 text-center">
        <a 
          href="/notification-templates" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <Bell className="w-4 h-4 mr-1" />
          Gestisci Template Email
        </a>
      </div>
    </div>
  );
}

export default EmailSettingsPage;
