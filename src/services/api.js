import axios from 'axios';
import toast from 'react-hot-toast';

// Configurazione base di axios
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token a ogni richiesta
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire gli errori
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token scaduto o non valido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Sessione scaduta, effettua nuovamente il login');
    } else if (error.response?.status === 403) {
      toast.error('Non hai i permessi per questa azione');
    } else if (error.response?.status === 404) {
      toast.error('Risorsa non trovata');
    } else if (error.response?.status >= 500) {
      toast.error('Errore del server, riprova più tardi');
    }
    return Promise.reject(error);
  }
);

// Servizio di autenticazione
export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      
      // Salva token e dati utente
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, data: response.data.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Errore durante il login' 
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// Servizio per gli atleti
export const athleteService = {
  getAll: async (params = {}) => {
    try {
      // Imposta un limite più alto per vedere più atleti
      const defaultParams = {
        limit: 500,  // Mostra fino a 500 atleti
        ...params
      };
      const response = await api.get('/athletes', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero atleti:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/athletes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero atleta:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/athletes', data);
      toast.success('Atleta creato con successo');
      return response.data;
    } catch (error) {
      console.error('Errore nella creazione atleta:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/athletes/${id}`, data);
      toast.success('Atleta aggiornato con successo');
      return response.data;
    } catch (error) {
      console.error('Errore nell\'aggiornamento atleta:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/athletes/${id}`);
      toast.success('Atleta eliminato con successo');
      return response.data;
    } catch (error) {
      console.error('Errore nell\'eliminazione atleta:', error);
      throw error;
    }
  }
};

// Servizio per i documenti
export const documentService = {
  getByAthlete: async (athleteId) => {
    try {
      const response = await api.get(`/athletes/${athleteId}/documents`);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero documenti:', error);
      throw error;
    }
  },

  upload: async (athleteId, formData) => {
    try {
      const response = await api.post(`/athletes/${athleteId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Documento caricato con successo');
      return response.data;
    } catch (error) {
      console.error('Errore nel caricamento documento:', error);
      throw error;
    }
  }
};

// Servizio per i pagamenti
export const paymentService = {
  getByAthlete: async (athleteId) => {
    try {
      const response = await api.get(`/athletes/${athleteId}/payments`);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero pagamenti:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/payments', data);
      toast.success('Pagamento registrato con successo');
      return response.data;
    } catch (error) {
      console.error('Errore nella registrazione pagamento:', error);
      throw error;
    }
  }
};

export default api;
