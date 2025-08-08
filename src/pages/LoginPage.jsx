import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const LoginPage = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Inserisci email e password');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login effettuato con successo!');
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Credenziali non valide');
      }
    } catch (error) {
      toast.error('Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  // Funzione per riempire automaticamente i campi per test
  const fillTestCredentials = () => {
    setFormData({
      email: 'admin@juventusacademymilano.it',
      password: 'password123'
    });
    toast.success('Credenziali di test inserite');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-white mb-2">
            ⚽ Soccer Manager
          </h1>
          <h2 className="text-center text-xl text-blue-100">
            Sistema di Gestione Società Calcio
          </h2>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            Accedi al tuo account
          </h3>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="inserisci@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </button>
            </div>
          </form>

          {/* Bottone per credenziali di test - solo per sviluppo */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-2">
              Per test rapido:
            </p>
            <button
              type="button"
              onClick={fillTestCredentials}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Usa credenziali di test
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              Email: admin@juventusacademymilano.it<br />
              Password: password123
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-blue-100">
          © 2025 Soccer Management System
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
