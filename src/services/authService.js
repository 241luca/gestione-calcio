/**
 * Servizio di autenticazione migliorato con sicurezza avanzata
 * Versione: 2.0.0
 * Data: 09/08/2025
 */

import api from './api';

class AuthService {
  constructor() {
    this.tokenKey = 'token';
    this.refreshTokenKey = 'refreshToken';
    this.userKey = 'user';
    this.organizationKey = 'organizationId';
    
    // Usa sessionStorage per maggiore sicurezza (si cancella alla chiusura del browser)
    this.storage = sessionStorage;
    
    // Migra da localStorage a sessionStorage se necessario
    this.migrateStorage();
  }

  /**
   * Migra i token da localStorage a sessionStorage per maggiore sicurezza
   */
  migrateStorage() {
    const token = localStorage.getItem(this.tokenKey);
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    const user = localStorage.getItem(this.userKey);
    const organizationId = localStorage.getItem(this.organizationKey);
    
    if (token) {
      this.storage.setItem(this.tokenKey, token);
      localStorage.removeItem(this.tokenKey);
    }
    
    if (refreshToken) {
      this.storage.setItem(this.refreshTokenKey, refreshToken);
      localStorage.removeItem(this.refreshTokenKey);
    }
    
    if (user) {
      this.storage.setItem(this.userKey, user);
      localStorage.removeItem(this.userKey);
    }
    
    if (organizationId) {
      this.storage.setItem(this.organizationKey, organizationId);
      localStorage.removeItem(this.organizationKey);
    }
  }

  /**
   * Login con email e password
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, refreshToken, user } = response.data.data;
        
        // Salva in sessionStorage (più sicuro di localStorage)
        this.storage.setItem(this.tokenKey, token);
        if (refreshToken) {
          this.storage.setItem(this.refreshTokenKey, refreshToken);
        }
        this.storage.setItem(this.userKey, JSON.stringify(user));
        this.storage.setItem(this.organizationKey, user.organizationId);
        
        // Imposta header per richieste future
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Programma refresh token automatico
        this.scheduleTokenRefresh();
        
        return { success: true, user };
      }
      
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Errore di connessione' 
      };
    }
  }

  /**
   * Logout
   */
  logout() {
    // Pulisci storage
    this.storage.removeItem(this.tokenKey);
    this.storage.removeItem(this.refreshTokenKey);
    this.storage.removeItem(this.userKey);
    this.storage.removeItem(this.organizationKey);
    
    // Pulisci anche localStorage per sicurezza
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.organizationKey);
    
    // Rimuovi header
    delete api.defaults.headers.common['Authorization'];
    
    // Cancella timer refresh
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Redirect al login
    window.location.href = '/login';
  }

  /**
   * Verifica se l'utente è autenticato
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    // Verifica che il token non sia scaduto
    try {
      const payload = this.parseJwt(token);
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Ottieni il token corrente
   */
  getToken() {
    // Controlla prima sessionStorage, poi localStorage per retrocompatibilità
    return this.storage.getItem(this.tokenKey) || localStorage.getItem(this.tokenKey);
  }

  /**
   * Ottieni l'utente corrente
   */
  getCurrentUser() {
    const userStr = this.storage.getItem(this.userKey) || localStorage.getItem(this.userKey);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Ottieni l'organization ID
   */
  getOrganizationId() {
    return this.storage.getItem(this.organizationKey) || 
           localStorage.getItem(this.organizationKey) ||
           '5d260bdd-d1e6-4004-8a81-711605f48aa3'; // Default per retrocompatibilità
  }

  /**
   * Refresh del token
   */
  async refreshToken() {
    const refreshToken = this.storage.getItem(this.refreshTokenKey);
    if (!refreshToken) return false;
    
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.data.success) {
        const { token } = response.data.data;
        this.storage.setItem(this.tokenKey, token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Riprogramma il prossimo refresh
        this.scheduleTokenRefresh();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Programma il refresh automatico del token
   */
  scheduleTokenRefresh() {
    const token = this.getToken();
    if (!token) return;
    
    try {
      const payload = this.parseJwt(token);
      const now = Date.now() / 1000;
      const timeUntilExpiry = (payload.exp - now) * 1000;
      
      // Refresh 5 minuti prima della scadenza
      const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);
      
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
      }
      
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }

  /**
   * Parse JWT token
   */
  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * Verifica permessi utente
   */
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Admin ha tutti i permessi
    if (user.role === 'admin') return true;
    
    // Controlla permessi specifici
    return user.permissions?.includes(permission) || false;
  }

  /**
   * Verifica ruolo utente
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}

// Esporta istanza singleton
export default new AuthService();
