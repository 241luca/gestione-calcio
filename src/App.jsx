import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import authService from './services/authService';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AthletesPage from './pages/AthletesPage';
import AthleteDetailPage from './pages/AthleteDetailPage';
import AthleteFormPage from './pages/AthleteFormPage';
import TeamsPage from './pages/TeamsPage';
import DocumentsPage from './pages/DocumentsPage';
import PaymentsPage from './pages/PaymentsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import TransportPage from './pages/TransportPage';
import NotificationsPage from './pages/NotificationsPage';
import TestNotifications from './pages/TestNotifications';
import SchedulerPage from './pages/SchedulerPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import EmailSettingsPage from './pages/EmailSettingsPage';
import NotificationTemplatesPage from './pages/NotificationTemplatesPage';
import CompetitionsPage from './pages/CompetitionsPage';
import StaffPage from './pages/StaffPage';
import SponsorsPage from './pages/SponsorsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica autenticazione
    const checkAuth = () => {
      console.log('🔍 Checking authentication...');
      
      // Controlla se c'è un token
      const token = sessionStorage.getItem('token');
      
      if (token) {
        console.log('✅ Token found, user is authenticated');
        setIsAuthenticated(true);
      } else {
        console.log('❌ No token, user not authenticated');
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };
    
    checkAuth();
    
    // Aggiungi listener per storage changes (per multi-tab)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    console.log('🚪 Logout requested');
    authService.logout();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-2xl text-gray-600">Caricamento sistema...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Rotta di login */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage setIsAuthenticated={setIsAuthenticated} />
              )
            } 
          />

          {/* Rotte protette con Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Layout onLogout={handleLogout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="athletes" element={<AthletesPage />} />
            <Route path="athletes/:id" element={<AthleteDetailPage />} />
            <Route path="athletes/new" element={<AthleteFormPage />} />
            <Route path="athletes/:id/edit" element={<AthleteFormPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="transport" element={<TransportPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="notifications/test" element={<TestNotifications />} />
            <Route path="scheduler" element={<SchedulerPage />} />
            <Route path="settings/notifications" element={<NotificationSettingsPage />} />
            <Route path="settings/email" element={<EmailSettingsPage />} />
            <Route path="settings/templates" element={<NotificationTemplatesPage />} />
            <Route path="competitions" element={<CompetitionsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="sponsors" element={<SponsorsPage />} />
          </Route>

          {/* Redirect per rotte non trovate */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
