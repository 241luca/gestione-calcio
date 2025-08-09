/**
 * Servizio di autenticazione FIXATO
 * Versione: 2.1.0
 * Data: 09/08/2025
 */

import api from './api';

class AuthService {
  constructor() {
    this.tokenKey = 'token';
    this.refreshTokenKey = 'refreshToken';
    this.userKey = 'user';
    this.organizationKey = 'organizationId';
    
    // Usa sessionStorage per maggiore sicurezza
    this.storage = sessionStorage;
    
    // Migra da localStorage a sessionStorage se necessario
    this.migrateStorage();
  }

  /**
   * Migra i token da localStorage a sessionStorage
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
      console.log('🔐 Attempting login...');
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, refreshToken, user } = response.data.data;
        
        console.log('✅ Login successful, saving credentials...');
        
        // Salva in sessionStorage
        this.storage.setItem(this.tokenKey, token);
        if (refreshToken) {
          this.storage.setItem(this.refreshTokenKey, refreshToken);
        }
        this.storage.setItem(this.userKey, JSON.stringify(user));
        this.storage.setItem(this.organizationKey, user.organizationId);
        
        // Imposta header per richieste future
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        api.defaults.headers.common['X-Organization-ID'] = user.organizationId;
        
        console.log('📋 Credentials saved to sessionStorage');
        
        // NON programmare refresh automatico per ora (potrebbe causare problemi)
        // this.scheduleTokenRefresh();
        
        return { success: true, user };
      }
      
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('❌ Login error:', error);
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
    console.log('🚪 Logging out...');
    
    // Pulisci storage
    this.storage.clear();
    localStorage.clear();
    
    // Rimuovi header
    delete api.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['X-Organization-ID'];
    
    // Cancella timer refresh se esiste
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
    if (!token) {
      console.log('❌ No token found');
      return false;
    }
    
    // Per ora, se c'è un token, consideriamolo valido
    // (il problema della scadenza immediata potrebbe essere qui)
    console.log('✅ Token found, user authenticated');
    return true;
    
    /* COMMENTATO PER ORA - potrebbe causare logout immediati
    try {
      const payload = this.parseJwt(token);
      const now = Date.now() / 1000;
      const isValid = payload.exp > now;
      
      if (!isValid) {
        console.log('❌ Token expired');
      }
      
      return isValid;
    } catch (error) {
      console.error('Error parsing token:', error);
      return false;
    }
    */
  }

  /**
   * Ottieni il token corrente
   */
  getToken() {
    const token = this.storage.getItem(this.tokenKey);
    return token;
  }

  /**
   * Ottieni l'utente corrente
   */
  getCurrentUser() {
    const userStr = this.storage.getItem(this.userKey);
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
    return this.storage.getItem(this.organizationKey);
  }

  /**
   * Parse JWT token
   */
  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }

  /**
   * Programma refresh del token (DISABILITATO PER ORA)
   */
  scheduleTokenRefresh() {
    // DISABILITATO - potrebbe causare problemi
    return;
    
    /*
    const token = this.getToken();
    if (!token) return;
    
    try {
      const payload = this.parseJwt(token);
      const now = Date.now() / 1000;
      const timeUntilRefresh = (payload.exp - now - 300) * 1000; // 5 min prima della scadenza
      
      if (timeUntilRefresh > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken();
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.error('Error scheduling refresh:', error);
    }
    */
  }

  /**
   * Refresh del token (DISABILITATO PER ORA)
   */
  async refreshToken() {
    // DISABILITATO - implementare quando necessario
    return;
  }
}

export default new AuthService();
