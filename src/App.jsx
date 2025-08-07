import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Controlla se c'è un token salvato
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Caricamento...</div>
      </div>
    );
  }

  return (
    <Router>
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
              <Layout setIsAuthenticated={setIsAuthenticated} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="athletes" element={<AthletesPage />} />
          <Route path="athletes/new" element={<AthleteFormPage />} />
          <Route path="athletes/:id" element={<AthleteDetailPage />} />
          <Route path="athletes/:id/edit" element={<AthleteFormPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
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
  );
}

export default App;
