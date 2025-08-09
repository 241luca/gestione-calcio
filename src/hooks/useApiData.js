import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * Hook personalizzato per gestire le chiamate API in modo uniforme
 * Gestisce automaticamente il formato delle risposte del backend
 * 
 * @param {string} endpoint - L'endpoint API da chiamare
 * @param {Array} dependencies - Array di dipendenze per useEffect
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useApiData = (endpoint, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(endpoint);
      
      // Il backend restituisce sempre { success, data, error }
      if (response.data.success) {
        const apiData = response.data.data;
        
        // GESTIONE ADATTIVA DEL FORMATO DATI
        if (Array.isArray(apiData)) {
          // Caso 1: data è già un array
          setData(apiData);
        } else if (apiData && typeof apiData === 'object') {
          // Caso 2: data è un oggetto, cerchiamo array nelle proprietà comuni
          const possibleArrayKeys = [
            'items', 'data', 'results', 'records', 'list',
            // Nomi specifici per le nostre entità
            'athletes', 'payments', 'documents', 'teams',
            'staffMembers', 'matches', 'sponsors', 'competitions',
            'transportZones', 'positions', 'roles', 'users'
          ];
          
          // Trova il primo array valido
          let arrayData = null;
          for (const key of possibleArrayKeys) {
            if (Array.isArray(apiData[key])) {
              arrayData = apiData[key];
              console.log(`🎯 useApiData: Trovato array in '${key}' con ${apiData[key].length} elementi`);
              break;
            }
          }
          
          // Se c'è paginazione, salva anche quella
          if (apiData.pagination) {
            setData({
              items: arrayData || [],
              pagination: apiData.pagination,
              meta: apiData.meta || {}
            });
          } else if (arrayData) {
            // Se abbiamo trovato un array, usa quello
            setData(arrayData);
          } else {
            // Altrimenti restituisci l'oggetto completo (potrebbe avere athletes, documents, etc.)
            setData(apiData);
          }
        } else {
          // Caso 3: formato non riconosciuto, usa array vuoto
          console.warn(`Formato dati non riconosciuto per ${endpoint}:`, apiData);
          setData([]);
        }
      } else {
        // Response non successful
        const errorMessage = response.data?.error?.message || 'Errore nel caricamento dei dati';
        setError(errorMessage);
        toast.error(errorMessage);
        setData([]);
      }
    } catch (err) {
      console.error(`Errore caricamento ${endpoint}:`, err);
      
      // Gestione errori dettagliata
      let errorMessage = 'Errore di connessione';
      
      if (err.response) {
        // Errore dal server
        if (err.response.data?.error?.message) {
          errorMessage = err.response.data.error.message;
        } else if (err.response.status === 401) {
          errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
        } else if (err.response.status === 403) {
          errorMessage = 'Non hai i permessi per accedere a questa risorsa.';
        } else if (err.response.status === 404) {
          errorMessage = 'Risorsa non trovata.';
        } else if (err.response.status === 422) {
          errorMessage = 'Dati non validi.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Errore del server. Riprova più tardi.';
        }
      } else if (err.request) {
        // Nessuna risposta dal server
        errorMessage = 'Impossibile contattare il server. Verifica la connessione.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Carica i dati quando cambia l'endpoint o le dipendenze
  useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  // Funzione per ricaricare manualmente i dati
  const refetch = useCallback(() => {
    return loadData();
  }, [loadData]);

  return { 
    data, 
    loading, 
    error, 
    refetch,
    // Helper per accedere facilmente agli items se c'è paginazione
    items: data?.items || data,
    pagination: data?.pagination || null
  };
};

/**
 * Hook per gestire operazioni CRUD con feedback
 */
export const useApiMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (method, endpoint, data = null, successMessage = null) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      switch (method.toLowerCase()) {
        case 'post':
          response = await api.post(endpoint, data);
          break;
        case 'put':
          response = await api.put(endpoint, data);
          break;
        case 'patch':
          response = await api.patch(endpoint, data);
          break;
        case 'delete':
          response = await api.delete(endpoint);
          break;
        default:
          throw new Error(`Metodo HTTP non supportato: ${method}`);
      }
      
      if (response.data.success) {
        if (successMessage) {
          toast.success(successMessage);
        }
        return response.data.data;
      } else {
        throw new Error(response.data?.error?.message || 'Operazione fallita');
      }
    } catch (err) {
      console.error(`Errore ${method} ${endpoint}:`, err);
      
      let errorMessage = 'Errore durante l\'operazione';
      
      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.response?.data?.error?.details) {
        // Errori di validazione
        const details = err.response.data.error.details;
        if (Array.isArray(details) && details.length > 0) {
          errorMessage = details[0].message || details[0];
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mutate,
    loading,
    error
  };
};

// Export di default per retrocompatibilità
export default useApiData;