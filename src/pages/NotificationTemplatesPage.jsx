// src/pages/NotificationTemplatesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Edit, 
  Save, 
  X,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Mail,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: '',
    title: '',
    message: '',
    emailSubject: '',
    emailBody: '',
    variables: []
  });

  // Template types disponibili
  const templateTypes = [
    { value: 'document_expiry', label: 'Documento in scadenza' },
    { value: 'payment_overdue', label: 'Pagamento scaduto' },
    { value: 'match_convocation', label: 'Convocazione partita' },
    { value: 'athlete_new', label: 'Nuovo atleta' },
    { value: 'training_cancelled', label: 'Allenamento annullato' },
    { value: 'injury_registered', label: 'Infortunio registrato' },
    { value: 'custom', label: 'Personalizzato' }
  ];

  // Variabili disponibili per tipo
  const availableVariables = {
    document_expiry: ['documentType', 'athleteName', 'expiryDate', 'daysUntilExpiry'],
    payment_overdue: ['amount', 'athleteName', 'dueDate'],
    match_convocation: ['matchDate', 'opponent', 'meetingTime', 'venue'],
    athlete_new: ['athleteName', 'teamName'],
    training_cancelled: ['date', 'reason'],
    injury_registered: ['athleteName', 'description', 'severity']
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
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
      console.error('Errore caricamento template:', error);
      // Usa template di default se l'endpoint non esiste
      setTemplates([
        {
          id: '1',
          name: 'Documento in scadenza',
          type: 'document_expiry',
          title: 'Documento in scadenza',
          message: 'Il documento {{documentType}} di {{athleteName}} scade il {{expiryDate}}',
          emailSubject: 'Documento in scadenza - {{athleteName}}',
          emailBody: 'Il documento {{documentType}} scadrà il {{expiryDate}}',
          variables: ['documentType', 'athleteName', 'expiryDate'],
          isSystem: true,
          isActive: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (template) => {
    try {
      const token = localStorage.getItem('token');
      
      if (template.id) {
        // Update existing
        const response = await axios.put(
          `http://localhost:3000/api/v1/notification-templates/${template.id}`,
          template,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.success) {
          toast.success('Template aggiornato con successo!');
        }
      } else {
        // Create new
        const response = await axios.post(
          'http://localhost:3000/api/v1/notification-templates',
          template,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.success) {
          toast.success('Template creato con successo!');
        }
      }
      
      loadTemplates();
      setEditingTemplate(null);
      setShowNewTemplate(false);
    } catch (error) {
      toast.error('Errore nel salvataggio del template');
      console.error(error);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:3000/api/v1/notification-templates/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success('Template eliminato');
      loadTemplates();
    } catch (error) {
      toast.error('Errore eliminazione template');
    }
  };

  const handleExportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'notification-templates.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Template esportati');
  };

  const handleImportTemplates = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedTemplates = JSON.parse(e.target.result);
        
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:3000/api/v1/notification-templates/import',
          { templates: importedTemplates },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.success) {
          toast.success('Template importati con successo!');
          loadTemplates();
        }
      } catch (error) {
        toast.error('Errore importazione template');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const renderTemplateForm = (template, isNew = false) => {
    const currentTemplate = isNew ? newTemplate : editingTemplate;
    const setCurrentTemplate = isNew ? setNewTemplate : setEditingTemplate;
    
    return (
      <div className="bg-gray-50 rounded-lg p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Template
            </label>
            <input
              type="text"
              value={currentTemplate.name}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={currentTemplate.type}
              onChange={(e) => setCurrentTemplate({ 
                ...currentTemplate, 
                type: e.target.value,
                variables: availableVariables[e.target.value] || []
              })}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={!isNew && currentTemplate.isSystem}
            >
              <option value="">Seleziona tipo</option>
              {templateTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Titolo Notifica */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquare className="inline w-4 h-4 mr-1" />
              Titolo Notifica
            </label>
            <input
              type="text"
              value={currentTemplate.title}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Es: Documento in scadenza"
            />
          </div>
          
          {/* Messaggio Notifica */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquare className="inline w-4 h-4 mr-1" />
              Messaggio Notifica
            </label>
            <textarea
              value={currentTemplate.message}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, message: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
              placeholder="Es: Il documento {{documentType}} di {{athleteName}} scade il {{expiryDate}}"
            />
          </div>
          
          {/* Oggetto Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline w-4 h-4 mr-1" />
              Oggetto Email
            </label>
            <input
              type="text"
              value={currentTemplate.emailSubject || ''}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, emailSubject: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Es: [URGENTE] Documento in scadenza - {{athleteName}}"
            />
          </div>
          
          {/* Corpo Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline w-4 h-4 mr-1" />
              Corpo Email
            </label>
            <textarea
              value={currentTemplate.emailBody || ''}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, emailBody: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows="5"
              placeholder="Testo dell'email con variabili {{variable}}"
            />
          </div>
          
          {/* Variabili disponibili */}
          {currentTemplate.variables && currentTemplate.variables.length > 0 && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variabili disponibili:
              </label>
              <div className="flex flex-wrap gap-2">
                {currentTemplate.variables.map(variable => (
                  <span 
                    key={variable}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(`{{${variable}}}`);
                      toast.success(`{{${variable}}} copiato!`);
                    }}
                    title="Clicca per copiare"
                  >
                    {`{{${variable}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Azioni */}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={() => {
              if (isNew) {
                setShowNewTemplate(false);
                setNewTemplate({
                  name: '',
                  type: '',
                  title: '',
                  message: '',
                  emailSubject: '',
                  emailBody: '',
                  variables: []
                });
              } else {
                setEditingTemplate(null);
              }
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            <X className="w-4 h-4 inline mr-1" />
            Annulla
          </button>
          <button
            onClick={() => handleSaveTemplate(currentTemplate)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Save className="w-4 h-4 inline mr-1" />
            Salva
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          <FileText className="inline-block mr-2 mb-1" />
          Template Notifiche
        </h1>
        <p className="text-gray-600 mt-2">
          Personalizza i messaggi delle notifiche e delle email
        </p>
      </div>

      {/* Azioni */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowNewTemplate(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuovo Template
            </button>
            <button
              onClick={handleExportTemplates}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Esporta
            </button>
            <label className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center cursor-pointer">
              <Upload className="w-4 h-4 mr-1" />
              Importa
              <input
                type="file"
                accept=".json"
                onChange={handleImportTemplates}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Form nuovo template */}
      {showNewTemplate && renderTemplateForm(newTemplate, true)}

      {/* Lista Template */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">Caricamento...</div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nessun template configurato</p>
          </div>
        ) : (
          <div className="divide-y">
            {templates.map((template) => (
              <div key={template.id || template.type} className="p-4">
                {editingTemplate?.id === template.id ? (
                  renderTemplateForm(template)
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          {template.isSystem && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                              Sistema
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded ${
                            template.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {template.isActive ? 'Attivo' : 'Disattivato'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-1">
                          Tipo: {templateTypes.find(t => t.value === template.type)?.label || template.type}
                        </p>
                        
                        <div className="mt-3 space-y-2">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs font-semibold text-gray-600">Titolo:</p>
                            <p className="text-sm">{template.title}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs font-semibold text-gray-600">Messaggio:</p>
                            <p className="text-sm">{template.message}</p>
                          </div>
                          
                          {template.emailSubject && (
                            <div className="bg-blue-50 p-3 rounded">
                              <p className="text-xs font-semibold text-gray-600">
                                <Mail className="inline w-3 h-3 mr-1" />
                                Oggetto Email:
                              </p>
                              <p className="text-sm">{template.emailSubject}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditingTemplate(template)}
                          className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                          title="Modifica"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!template.isSystem && (
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-900">
          <AlertCircle className="inline-block mr-1 mb-1 w-4 h-4" />
          Come funzionano i template
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Usa le variabili {`{{nome_variabile}}`} per inserire dati dinamici</li>
          <li>• I template di sistema possono essere modificati ma non eliminati</li>
          <li>• I template personalizzati sovrascrivono quelli di sistema</li>
          <li>• Le email vengono inviate solo se configurate in Impostazioni Email</li>
          <li>• Clicca sulle variabili per copiarle negli appunti</li>
        </ul>
      </div>
    </div>
  );
}

export default NotificationTemplatesPage;
