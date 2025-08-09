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
    // Usa il nuovo authService per verificare l'autenticazione
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      // Se autenticato, programma il refresh del token
      if (authenticated) {
        authService.scheduleTokenRefresh();
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

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
      <Router 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* Route pubbliche */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginPage setIsAuthenticated={setIsAuthenticated} />
            } 
          />

          {/* Route protette */}
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ErrorBoundary>
                  <Layout setIsAuthenticated={setIsAuthenticated} />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <ErrorBoundary>
                <DashboardPage />
              </ErrorBoundary>
            } />
            <Route path="athletes" element={
              <ErrorBoundary>
                <AthletesPage />
              </ErrorBoundary>
            } />
            <Route path="athletes/new" element={
              <ErrorBoundary>
                <AthleteFormPage />
              </ErrorBoundary>
            } />
            <Route path="athletes/:id" element={
              <ErrorBoundary>
                <AthleteDetailPage />
              </ErrorBoundary>
            } />
            <Route path="athletes/:id/edit" element={
              <ErrorBoundary>
                <AthleteFormPage />
              </ErrorBoundary>
            } />
            <Route path="teams" element={
              <ErrorBoundary>
                <TeamsPage />
              </ErrorBoundary>
            } />
            <Route path="competitions" element={
              <ErrorBoundary>
                <CompetitionsPage />
              </ErrorBoundary>
            } />
            <Route path="staff" element={
              <ErrorBoundary>
                <StaffPage />
              </ErrorBoundary>
            } />
            <Route path="sponsors" element={
              <ErrorBoundary>
                <SponsorsPage />
              </ErrorBoundary>
            } />
            <Route path="documents" element={
              <ErrorBoundary>
                <DocumentsPage />
              </ErrorBoundary>
            } />
            <Route path="payments" element={
              <ErrorBoundary>
                <PaymentsPage />
              </ErrorBoundary>
            } />
            <Route path="transport" element={
              <ErrorBoundary>
                <TransportPage />
              </ErrorBoundary>
            } />
            <Route path="notifications" element={
              <ErrorBoundary>
                <NotificationsPage />
              </ErrorBoundary>
            } />
            <Route path="test-notifications" element={
              <ErrorBoundary>
                <TestNotifications />
              </ErrorBoundary>
            } />
            <Route path="scheduler" element={
              <ErrorBoundary>
                <SchedulerPage />
              </ErrorBoundary>
            } />
            <Route path="notification-settings" element={
              <ErrorBoundary>
                <NotificationSettingsPage />
              </ErrorBoundary>
            } />
            <Route path="email-settings" element={
              <ErrorBoundary>
                <EmailSettingsPage />
              </ErrorBoundary>
            } />
            <Route path="notification-templates" element={
              <ErrorBoundary>
                <NotificationTemplatesPage />
              </ErrorBoundary>
            } />
            <Route path="calendar" element={
              <ErrorBoundary>
                <CalendarPage />
              </ErrorBoundary>
            } />
            <Route path="settings" element={
              <ErrorBoundary>
                <SettingsPage />
              </ErrorBoundary>
            } />
            <Route path="reports" element={
              <ErrorBoundary>
                <ReportsPage />
              </ErrorBoundary>
            } />
          </Route>

          {/* 404 - Pagina non trovata */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Pagina non trovata</p>
                <a 
                  href="/dashboard" 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Torna alla Dashboard
                </a>
              </div>
            </div>
          } />
        </Routes>

        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
              padding: '16px',
            },
            success: {
              style: {
                background: '#10b981',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
            loading: {
              style: {
                background: '#3b82f6',
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
