import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  MapPinIcon,
  BellIcon,
  CloudArrowDownIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Dati società
  const [companyData, setCompanyData] = useState({
    name: 'ASD Calcio Milano',
    address: 'Via dello Sport, 15',
    city: 'Milano',
    province: 'MI',
    cap: '20100',
    phone: '02 12345678',
    mobile: '333 1234567',
    email: 'info@asdcalciomilano.it',
    pec: 'asdcalciomilano@pec.it',
    website: 'www.asdcalciomilano.it',
    fiscalCode: '12345678901',
    vatNumber: 'IT12345678901',
    iban: 'IT60X0542811101000000123456',
    president: 'Mario Rossi',
    secretary: 'Luigi Bianchi'
  });

  // Campi di gioco
  const [fields, setFields] = useState([
    { id: 1, name: 'Campo Principale', address: 'Via dello Sport, 15', type: 'Erba naturale', capacity: 500 },
    { id: 2, name: 'Campo B', address: 'Via dello Sport, 15', type: 'Sintetico', capacity: 200 },
    { id: 3, name: 'Campo Allenamento', address: 'Via Secondaria, 10', type: 'Erba naturale', capacity: 0 }
  ]);

  // Utenti
  const [users, setUsers] = useState([
    { id: 1, name: 'Luca Mambelli', email: 'lucamambelli@lmtecnologie.it', role: 'Amministratore', status: 'Attivo', lastAccess: '2025-08-07' },
    { id: 2, name: 'Marco Verdi', email: 'marco.verdi@email.com', role: 'Allenatore', status: 'Attivo', lastAccess: '2025-08-06' },
    { id: 3, name: 'Paolo Neri', email: 'paolo.neri@email.com', role: 'Dirigente', status: 'Attivo', lastAccess: '2025-08-05' },
    { id: 4, name: 'Anna Blu', email: 'anna.blu@email.com', role: 'Segreteria', status: 'Attivo', lastAccess: '2025-08-07' }
  ]);

  // Impostazioni notifiche
  const [notifications, setNotifications] = useState({
    documentExpiry: true,
    documentExpiryDays: 30,
    paymentDue: true,
    paymentDueDays: 7,
    newConvocation: true,
    calendarChanges: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  // Impostazioni backup
  const [backup, setBackup] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    keepBackups: 30,
    lastBackup: '2025-08-07 02:00:00',
    backupSize: '125 MB'
  });

  // Tabs configuration
  const tabs = [
    { id: 'company', name: 'Dati Società', icon: BuildingOfficeIcon },
    { id: 'fields', name: 'Campi di Gioco', icon: MapPinIcon },
    { id: 'users', name: 'Utenti', icon: UserGroupIcon },
    { id: 'notifications', name: 'Notifiche', icon: BellIcon },
    { id: 'backup', name: 'Backup', icon: CloudArrowDownIcon },
    { id: 'security', name: 'Sicurezza', icon: ShieldCheckIcon }
  ];

  // Salva modifiche
  const handleSave = () => {
    toast.success('Impostazioni salvate con successo');
    setIsEditing(false);
    setHasChanges(false);
  };

  // Annulla modifiche
  const handleCancel = () => {
    setIsEditing(false);
    setHasChanges(false);
    toast.info('Modifiche annullate');
  };

  // Upload logo
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Il file è troppo grande (max 5MB)');
        return;
      }
      toast.success('Logo aggiornato con successo');
    }
  };

  // Aggiungi nuovo campo
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    address: '',
    type: 'Erba naturale',
    capacity: 0
  });

  const handleAddField = () => {
    if (!newField.name || !newField.address) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    
    setFields([...fields, { 
      id: fields.length + 1, 
      ...newField 
    }]);
    
    toast.success('Campo aggiunto con successo');
    setShowFieldModal(false);
    setNewField({ name: '', address: '', type: 'Erba naturale', capacity: 0 });
  };

  // Aggiungi nuovo utente
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Allenatore',
    password: ''
  });

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    
    setUsers([...users, { 
      id: users.length + 1, 
      ...newUser,
      status: 'Attivo',
      lastAccess: 'Mai'
    }]);
    
    toast.success('Utente aggiunto. Email di invito inviata.');
    setShowUserModal(false);
    setNewUser({ name: '', email: '', role: 'Allenatore', password: '' });
  };

  // Backup manuale
  const handleManualBackup = () => {
    toast.loading('Backup in corso...', { duration: 2000 });
    setTimeout(() => {
      toast.success('Backup completato con successo');
      setBackup({...backup, lastBackup: new Date().toLocaleString('it-IT')});
    }, 2000);
  };

  // Download backup
  const handleDownloadBackup = () => {
    toast.success('Download del backup avviato');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <CogIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
              <p className="text-gray-600">Configura la tua società</p>
            </div>
          </div>
          
          {isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <XMarkIcon className="h-5 w-5" />
                <span>Annulla</span>
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <CheckIcon className="h-5 w-5" />
                <span>Salva</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-6">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white rounded-lg shadow-sm p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
          {/* Tab: Dati Società */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Informazioni Società</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <PencilIcon className="h-5 w-5" />
                    <span>Modifica</span>
                  </button>
                )}
              </div>

              {/* Logo */}
              <div className="flex items-center space-x-6 pb-6 border-b">
                <div className="relative">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                      <PhotoIcon className="h-5 w-5" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{companyData.name}</h3>
                  <p className="text-gray-600">Logo della società</p>
                  {isEditing && (
                    <p className="text-sm text-gray-500 mt-2">
                      Formato: JPG, PNG (max 5MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Form campi società - versione semplificata per spazio */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(companyData).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        setCompanyData({...companyData, [key]: e.target.value});
                        setHasChanges(true);
                      }}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Campi di Gioco */}
          {activeTab === 'fields' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Campi di Gioco</h2>
                <button
                  onClick={() => setShowFieldModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Aggiungi Campo
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field) => (
                  <div key={field.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{field.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <MapPinIcon className="inline h-4 w-4 mr-1" />
                          {field.address}
                        </p>
                        <div className="flex space-x-4 mt-2 text-sm">
                          <span className="text-gray-600">Tipo: {field.type}</span>
                          {field.capacity > 0 && (
                            <span className="text-gray-600">Capienza: {field.capacity} posti</span>
                          )}
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Utenti */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Gestione Utenti</h2>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Aggiungi Utente
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ruolo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ultimo Accesso
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.status === 'Attivo' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.lastAccess}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Notifiche */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Impostazioni Notifiche</h2>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Eventi da Notificare</h3>
                
                <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">Documenti in scadenza</div>
                    <div className="text-sm text-gray-600">
                      Ricevi notifiche per documenti in scadenza
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={notifications.documentExpiryDays}
                      onChange={(e) => setNotifications({
                        ...notifications, 
                        documentExpiryDays: parseInt(e.target.value)
                      })}
                      className="w-16 px-2 py-1 border rounded text-center"
                    />
                    <span className="text-sm text-gray-600">giorni prima</span>
                    <input
                      type="checkbox"
                      checked={notifications.documentExpiry}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        documentExpiry: e.target.checked
                      })}
                      className="ml-4 h-4 w-4 text-blue-600 rounded"
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">Pagamenti in scadenza</div>
                    <div className="text-sm text-gray-600">
                      Ricevi notifiche per pagamenti dovuti
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={notifications.paymentDueDays}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        paymentDueDays: parseInt(e.target.value)
                      })}
                      className="w-16 px-2 py-1 border rounded text-center"
                    />
                    <span className="text-sm text-gray-600">giorni prima</span>
                    <input
                      type="checkbox"
                      checked={notifications.paymentDue}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        paymentDue: e.target.checked
                      })}
                      className="ml-4 h-4 w-4 text-blue-600 rounded"
                    />
                  </div>
                </label>

                <h3 className="font-medium text-gray-700 mt-6">Canali di Notifica</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        emailNotifications: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span>Email</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={notifications.smsNotifications}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        smsNotifications: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span>SMS</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        pushNotifications: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span>Push</span>
                  </label>
                </div>

                <button
                  onClick={() => toast.success('Impostazioni notifiche salvate')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salva Impostazioni
                </button>
              </div>
            </div>
          )}

          {/* Tab: Backup */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Gestione Backup</h2>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-blue-900">Ultimo Backup</h3>
                    <p className="text-sm text-blue-700 mt-1">{backup.lastBackup}</p>
                    <p className="text-sm text-blue-700">Dimensione: {backup.backupSize}</p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={handleManualBackup}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Backup Manuale
                    </button>
                    <button
                      onClick={handleDownloadBackup}
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      Scarica Backup
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Backup Automatico</h3>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={backup.autoBackup}
                    onChange={(e) => setBackup({...backup, autoBackup: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span>Abilita backup automatico</span>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequenza
                    </label>
                    <select
                      value={backup.backupFrequency}
                      onChange={(e) => setBackup({...backup, backupFrequency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="daily">Giornaliero</option>
                      <option value="weekly">Settimanale</option>
                      <option value="monthly">Mensile</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orario
                    </label>
                    <input
                      type="time"
                      value={backup.backupTime}
                      onChange={(e) => setBackup({...backup, backupTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conserva backup per (giorni)
                  </label>
                  <input
                    type="number"
                    value={backup.keepBackups}
                    onChange={(e) => setBackup({...backup, keepBackups: parseInt(e.target.value)})}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <button
                  onClick={() => toast.success('Impostazioni backup salvate')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salva Impostazioni
                </button>
              </div>
            </div>
          )}

          {/* Tab: Sicurezza */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Impostazioni Sicurezza</h2>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-3">Politiche Password</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
                      <span className="text-sm">Lunghezza minima 8 caratteri</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
                      <span className="text-sm">Richiedi lettere maiuscole e minuscole</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
                      <span className="text-sm">Richiedi almeno un numero</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                      <span className="text-sm">Richiedi caratteri speciali</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-3">Sessioni</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeout sessione (minuti)
                      </label>
                      <input
                        type="number"
                        defaultValue="30"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                      <span className="text-sm">Disconnetti dopo inattività</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-3">Autenticazione a Due Fattori</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Aumenta la sicurezza richiedendo un codice aggiuntivo al login
                  </p>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Abilita 2FA
                  </button>
                </div>

                <button
                  onClick={() => toast.success('Impostazioni sicurezza salvate')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salva Impostazioni
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Aggiungi Campo */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowFieldModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="bg-white rounded-lg p-6 max-w-md w-full z-10">
              <h3 className="text-lg font-medium mb-4">Aggiungi Campo</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Campo *
                  </label>
                  <input
                    type="text"
                    value={newField.name}
                    onChange={(e) => setNewField({...newField, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo *
                  </label>
                  <input
                    type="text"
                    value={newField.address}
                    onChange={(e) => setNewField({...newField, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newField.type}
                    onChange={(e) => setNewField({...newField, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Erba naturale">Erba naturale</option>
                    <option value="Sintetico">Sintetico</option>
                    <option value="Terra">Terra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capienza (posti)
                  </label>
                  <input
                    type="number"
                    value={newField.capacity}
                    onChange={(e) => setNewField({...newField, capacity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowFieldModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleAddField}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Aggiungi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aggiungi Utente */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowUserModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="bg-white rounded-lg p-6 max-w-md w-full z-10">
              <h3 className="text-lg font-medium mb-4">Aggiungi Utente</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ruolo
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Amministratore">Amministratore</option>
                    <option value="Allenatore">Allenatore</option>
                    <option value="Dirigente">Dirigente</option>
                    <option value="Segreteria">Segreteria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password temporanea
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Lascia vuoto per generare automaticamente"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Aggiungi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
