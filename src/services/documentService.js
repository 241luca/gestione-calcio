import api from './api';
import toast from 'react-hot-toast';

export const documentService = {
  /**
   * Recupera tutti i documenti
   */
  getAll: async (filters = {}) => {
    try {
      const response = await api.get('/documents', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero documenti:', error);
      throw error;
    }
  },

  /**
   * Recupera documenti di un atleta
   */
  getByAthlete: async (athleteId) => {
    try {
      const response = await api.get(`/athletes/${athleteId}/documents`);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero documenti atleta:', error);
      throw error;
    }
  },

  /**
   * Carica un nuovo documento
   */
  upload: async (formData) => {
    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Documento caricato con successo');
      return response.data;
    } catch (error) {
      console.error('Errore nel caricamento documento:', error);
      toast.error('Errore nel caricamento del documento');
      throw error;
    }
  },

  /**
   * Aggiorna informazioni documento
   */
  update: async (id, data) => {
    try {
      const response = await api.put(`/documents/${id}`, data);
      toast.success('Documento aggiornato con successo');
      return response.data;
    } catch (error) {
      console.error('Errore nell\'aggiornamento documento:', error);
      throw error;
    }
  },

  /**
   * Elimina documento
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/documents/${id}`);
      toast.success('Documento eliminato con successo');
      return response.data;
    } catch (error) {
      console.error('Errore nell\'eliminazione documento:', error);
      throw error;
    }
  },

  /**
   * Scarica documento
   */
  download: async (id, fileName) => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: 'blob'
      });
      
      // Crea link per download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Download avviato');
    } catch (error) {
      console.error('Errore nel download documento:', error);
      toast.error('Errore nel download del documento');
      throw error;
    }
  },

  /**
   * Verifica documento (per admin)
   */
  verify: async (id) => {
    try {
      const response = await api.post(`/documents/${id}/verify`);
      toast.success('Documento verificato');
      return response.data;
    } catch (error) {
      console.error('Errore nella verifica documento:', error);
      throw error;
    }
  }
};
