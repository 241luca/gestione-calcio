import axios from 'axios';
import toast from 'react-hot-toast';

// Configurazione base di axios
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondi di timeout
});

// Interceptor per le richieste
api.interceptors.request.use(
  (config) => {
    // Aggiungi token se presente
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Aggiungi organization ID se presente
    const organizationId = localStorage.getItem('organizationId');
    if (organizationId) {
      config.headers['X-Organization-ID'] = organizationId;
    }
    
    // Log delle richieste in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor per le risposte
api.interceptors.response.use(
  (response) => {
    // Log delle risposte in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Response from ${response.config.url}:`, response.data);
    }
    
    // Verifica che la risposta abbia il formato corretto
    if (!response.data.hasOwnProperty('success')) {
      console.warn('⚠️ Risposta API non standard:', response.data);
    }
    
    return response;
  },
  (error) => {
    // Log dettagliato dell'errore per debug
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
    }

    // Gestione errori specifici
    if (!error.response) {
      // Errore di rete o timeout
      console.error('Network error:', error);
      toast.error('Errore di connessione. Verifica la tua connessione internet.');
      return Promise.reject(error);
    }

    const status = error.response.status;
    const errorData = error.response.data;

    // Messaggio di errore personalizzato dal backend
    const backendMessage = errorData?.error?.message || errorData?.message;

    switch (status) {
      case 401:
        // Token scaduto o non valido
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('organizationId');
        
        // Solo reindirizza se non siamo già nella pagina di login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
          toast.error('Sessione scaduta. Effettua nuovamente il login.');
        }
        break;

      case 403:
        toast.error(backendMessage || 'Non hai i permessi per eseguire questa azione.');
        break;

      case 404:
        // Non sempre è un errore (es. lista vuota)
        if (!backendMessage?.includes('non trovat')) {
          console.warn('Risorsa non trovata:', error.config?.url);
        }
        break;

      case 422:
        // Errori di validazione
        if (errorData?.error?.details) {
          const details = errorData.error.details;
          if (Array.isArray(details) && details.length > 0) {
            // Mostra il primo errore di validazione
            const firstError = details[0];
            const message = firstError.message || firstError;
            toast.error(`Errore di validazione: ${message}`);
          } else {
            toast.error(backendMessage || 'Dati non validi.');
          }
        } else {
          toast.error(backendMessage || 'Errore di validazione.');
        }
        break;

      case 409:
        // Conflitto (es. duplicato)
        toast.error(backendMessage || 'Conflitto: la risorsa esiste già.');
        break;

      case 500:
        // Errore del server
        console.error('Server error:', errorData);
        toast.error(backendMessage || 'Errore del server. Riprova più tardi.');
        break;

      default:
        if (status >= 500) {
          toast.error('Errore del server. Riprova più tardi.');
        } else if (status >= 400) {
          toast.error(backendMessage || `Errore: ${status}`);
        }
    }

    return Promise.reject(error);
  }
);

// Helper per verificare se siamo autenticati
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Helper per ottenere l'utente corrente
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error('Errore parsing user data:', e);
    return null;
  }
};

// Helper per fare logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('organizationId');
  window.location.href = '/login';
};

// Servizio di autenticazione
export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Salva token e dati utente
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Salva organization ID se presente
        if (user.organizationId) {
          localStorage.setItem('organizationId', user.organizationId);
        }
        
        return { success: true, data: response.data.data };
      } else {
        return { 
          success: false, 
          error: response.data.error?.message || 'Errore durante il login' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Errore durante il login' 
      };
    }
  },

  logout,
  getCurrentUser,
  isAuthenticated
};

// Servizio per gli atleti - SEMPLIFICATO
// Usa useApiData hook invece di questi metodi diretti
export const athleteService = {
  getAll: async (params = {}) => {
    const response = await api.get('/athletes', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/athletes/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/athletes', data);
    if (response.data.success) {
      toast.success('Atleta creato con successo');
    }
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/athletes/${id}`, data);
    if (response.data.success) {
      toast.success('Atleta aggiornato con successo');
    }
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/athletes/${id}`);
    if (response.data.success) {
      toast.success('Atleta eliminato con successo');
    }
    return response.data;
  }
};

// Servizio per i documenti - SEMPLIFICATO
export const documentService = {
  getAll: async () => {
    const response = await api.get('/documents');
    return response.data;
  },

  getByAthlete: async (athleteId) => {
    const response = await api.get(`/athletes/${athleteId}/documents`);
    return response.data;
  },

  upload: async (athleteId, formData) => {
    const response = await api.post(`/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.success) {
      toast.success('Documento caricato con successo');
    }
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    if (response.data.success) {
      toast.success('Documento eliminato con successo');
    }
    return response.data;
  }
};

// Servizio per i pagamenti - SEMPLIFICATO
export const paymentService = {
  getAll: async () => {
    const response = await api.get('/payments');
    return response.data;
  },

  getByAthlete: async (athleteId) => {
    const response = await api.get(`/athletes/${athleteId}/payments`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/payments', data);
    if (response.data.success) {
      toast.success('Pagamento registrato con successo');
    }
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/payments/${id}`, data);
    if (response.data.success) {
      toast.success('Pagamento aggiornato con successo');
    }
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/payments/${id}`);
    if (response.data.success) {
      toast.success('Pagamento eliminato con successo');
    }
    return response.data;
  }
};

// Altri servizi per completezza
export const teamService = {
  getAll: async () => {
    const response = await api.get('/teams');
    return response.data;
  }
};

export const staffService = {
  getAll: async () => {
    const response = await api.get('/staff');
    return response.data;
  }
};

export const matchService = {
  getAll: async () => {
    const response = await api.get('/matches');
    return response.data;
  }
};

export const competitionService = {
  getAll: async () => {
    const response = await api.get('/competitions');
    return response.data;
  }
};

// Export default dell'istanza axios configurata
export default api;