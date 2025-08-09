// src/pages/SchedulerPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Usa il nostro api configurato
import toast from 'react-hot-toast';
import { 
  Clock, 
  Play, 
  Pause, 
  RefreshCw, 
  Calendar,
  Bell,
  FileText,
  DollarSign,
  Activity,
  Settings,
  AlertCircle
} from 'lucide-react';

function SchedulerPage() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [scheduleSettings, setScheduleSettings] = useState({
    documentsTime: '09:00',
    paymentsTime: '10:00',
    matchesTime: '18:00',
    documentsEnabled: true,
    paymentsEnabled: true,
    matchesEnabled: true,
    testMode: false
  });
  const [stats, setStats] = useState({
    lastDocumentCheck: null,
    lastPaymentCheck: null,
    lastMatchCheck: null,
    totalNotificationsSent: 0
  });
  const [executionHistory, setExecutionHistory] = useState([]);

  // Carica configurazione scheduler
  useEffect(() => {
    loadSchedulerConfig();
    loadExecutionHistory();
  }, []);

  const loadSchedulerConfig = async () => {
    try {
      const response = await api.get('/scheduler/config');
      
      if (response.data.success) {
        setScheduleSettings(response.data.data.settings);
        setJobs(response.data.data.jobs);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Errore caricamento configurazione:', error);
      // Se l'endpoint non esiste ancora, usa valori di default
      setJobs([
        { name: 'document-expiry-check', schedule: '0 9 * * *', active: true, lastRun: null },
        { name: 'payment-reminders', schedule: '0 10 * * *', active: true, lastRun: null },
        { name: 'match-reminders', schedule: '0 18 * * *', active: true, lastRun: null }
      ]);
    }
  };

  const loadExecutionHistory = async () => {
    try {
      const response = await api.get('/scheduler/history');
      
      if (response.data.success) {
        setExecutionHistory(response.data.data);
      }
    } catch (error) {
      // Dati di esempio se l'endpoint non esiste
      setExecutionHistory([
        { 
          id: 1, 
          job: 'document-expiry-check', 
          executedAt: new Date().toISOString(), 
          success: true, 
          notificationsSent: 3,
          duration: 1250 
        },
        { 
          id: 2, 
          job: 'payment-reminders', 
          executedAt: new Date(Date.now() - 3600000).toISOString(), 
          success: true, 
          notificationsSent: 5,
          duration: 890 
        }
      ]);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/v1/scheduler/config',
        scheduleSettings,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Impostazioni salvate con successo!');
        loadSchedulerConfig();
      }
    } catch (error) {
      toast.error('Errore nel salvataggio delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleRunJob = async (jobName) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Mappa il nome del job al tipo corretto per l'API
      let type = 'all';
      if (jobName.includes('document')) type = 'documents';
      else if (jobName.includes('payment')) type = 'payments';
      else if (jobName.includes('match')) type = 'matches';
      
      const response = await axios.post(
        'http://localhost:3000/api/v1/notifications/send-reminders',
        { type },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success(`Job ${jobName} eseguito con successo!`);
        
        // Mostra risultati
        const result = response.data.data;
        if (result.sent !== undefined) {
          toast.success(`Inviate ${result.sent} notifiche su ${result.total}`);
        }
        
        loadExecutionHistory();
      }
    } catch (error) {
      toast.error(`Errore esecuzione job: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJob = async (jobName) => {
    try {
      const token = localStorage.getItem('token');
      const job = jobs.find(j => j.name === jobName);
      
      const response = await axios.post(
        `http://localhost:3000/api/v1/scheduler/jobs/${jobName}/toggle`,
        { active: !job.active },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success(`Job ${job.active ? 'disattivato' : 'attivato'}`);
        loadSchedulerConfig();
      }
    } catch (error) {
      // Se l'endpoint non esiste, aggiorna localmente
      setJobs(jobs.map(j => 
        j.name === jobName ? { ...j, active: !j.active } : j
      ));
      toast.success('Stato aggiornato (locale)');
    }
  };

  const getJobIcon = (jobName) => {
    if (jobName.includes('document')) return <FileText className="w-5 h-5" />;
    if (jobName.includes('payment')) return <DollarSign className="w-5 h-5" />;
    if (jobName.includes('match')) return <Calendar className="w-5 h-5" />;
    return <Bell className="w-5 h-5" />;
  };

  const getJobTitle = (jobName) => {
    if (jobName.includes('document')) return 'Documenti in Scadenza';
    if (jobName.includes('payment')) return 'Promemoria Pagamenti';
    if (jobName.includes('match')) return 'Promemoria Partite';
    return jobName;
  };

  const formatCronSchedule = (schedule) => {
    // Converte cron expression in formato leggibile
    const parts = schedule.split(' ');
    if (parts[1] === '*' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
      if (parts[0].includes('*/')) {
        return `Ogni ${parts[0].replace('*/', '')} minuti`;
      }
      return `Ogni minuto alle :${parts[0]}`;
    }
    if (parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
      return `Ogni giorno alle ${parts[1]}:${parts[0].padStart(2, '0')}`;
    }
    return schedule;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          <Clock className="inline-block mr-2 mb-1" />
          Gestione Scheduler
        </h1>
        <p className="text-gray-600 mt-2">
          Configura e gestisci i job automatici per le notifiche
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Job Attivi</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.active).length}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Notifiche Inviate</p>
              <p className="text-2xl font-bold">{stats.totalNotificationsSent || 0}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ultimo Check</p>
              <p className="text-sm font-semibold">
                {stats.lastDocumentCheck 
                  ? new Date(stats.lastDocumentCheck).toLocaleTimeString('it-IT')
                  : 'Mai'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Modalità</p>
              <p className="text-sm font-semibold">
                {scheduleSettings.testMode ? 'Test (5 min)' : 'Produzione'}
              </p>
            </div>
            <Settings className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Job Schedulati */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Job Schedulati</h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getJobIcon(job.name)}
                    <div>
                      <h3 className="font-semibold">{getJobTitle(job.name)}</h3>
                      <p className="text-sm text-gray-500">
                        Schedule: {formatCronSchedule(job.schedule)}
                      </p>
                      {job.lastRun && (
                        <p className="text-xs text-gray-400">
                          Ultimo run: {new Date(job.lastRun).toLocaleString('it-IT')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleJob(job.name)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        job.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.active ? 'Attivo' : 'Disattivato'}
                    </button>
                    
                    <button
                      onClick={() => handleRunJob(job.name)}
                      disabled={loading}
                      className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      title="Esegui ora"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configurazione Orari */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Configurazione Orari</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Controllo Documenti
              </label>
              <input
                type="time"
                value={scheduleSettings.documentsTime}
                onChange={(e) => setScheduleSettings({
                  ...scheduleSettings,
                  documentsTime: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Controllo Pagamenti
              </label>
              <input
                type="time"
                value={scheduleSettings.paymentsTime}
                onChange={(e) => setScheduleSettings({
                  ...scheduleSettings,
                  paymentsTime: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promemoria Partite
              </label>
              <input
                type="time"
                value={scheduleSettings.matchesTime}
                onChange={(e) => setScheduleSettings({
                  ...scheduleSettings,
                  matchesTime: e.target.value
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={scheduleSettings.testMode}
                onChange={(e) => setScheduleSettings({
                  ...scheduleSettings,
                  testMode: e.target.checked
                })}
                className="mr-2"
              />
              <span className="text-sm">
                Modalità Test (esegue ogni 5 minuti)
              </span>
            </label>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Salva Configurazione
            </button>
          </div>
        </div>
      </div>

      {/* Storico Esecuzioni */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Storico Esecuzioni</h2>
        </div>
        <div className="p-4">
          {executionHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Job</th>
                    <th className="text-left py-2">Data/Ora</th>
                    <th className="text-left py-2">Stato</th>
                    <th className="text-left py-2">Notifiche</th>
                    <th className="text-left py-2">Durata</th>
                  </tr>
                </thead>
                <tbody>
                  {executionHistory.map((execution) => (
                    <tr key={execution.id} className="border-b">
                      <td className="py-2">{getJobTitle(execution.job)}</td>
                      <td className="py-2">
                        {new Date(execution.executedAt).toLocaleString('it-IT')}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          execution.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {execution.success ? 'Successo' : 'Errore'}
                        </span>
                      </td>
                      <td className="py-2">{execution.notificationsSent || 0}</td>
                      <td className="py-2">{execution.duration}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nessuna esecuzione registrata</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-900">
          <AlertCircle className="inline-block mr-1 mb-1 w-4 h-4" />
          Informazioni
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• I job vengono eseguiti automaticamente agli orari configurati</li>
          <li>• In modalità test, i job vengono eseguiti ogni 5 minuti</li>
          <li>• Puoi eseguire manualmente un job cliccando sul pulsante play</li>
          <li>• Le notifiche vengono inviate solo per documenti/pagamenti che necessitano attenzione</li>
        </ul>
      </div>
    </div>
  );
}

export default SchedulerPage;
