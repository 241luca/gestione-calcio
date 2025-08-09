import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Error Boundary Component
 * Cattura gli errori React e mostra una UI di fallback
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Aggiorna lo state per mostrare la UI di fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log dell'errore per debugging
    console.error('Error Boundary caught:', error, errorInfo);
    
    // Salva dettagli errore nello state
    this.setState({
      error,
      errorInfo
    });
    
    // Qui potresti inviare l'errore a un servizio di logging
    // come Sentry o LogRocket
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // UI di fallback quando c'è un errore
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Icona di errore */}
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
                </div>
              </div>
              
              {/* Titolo */}
              <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
                Oops! Qualcosa è andato storto
              </h2>
              
              {/* Descrizione */}
              <p className="mt-2 text-center text-sm text-gray-600">
                Si è verificato un errore imprevisto. Non preoccuparti, abbiamo registrato il problema.
              </p>
              
              {/* Dettagli errore (solo in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="text-xs font-mono text-red-800">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                        Mostra stack trace
                      </summary>
                      <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              {/* Azioni */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Riprova
                </button>
                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ricarica Pagina
                </button>
              </div>
              
              {/* Link di supporto */}
              <div className="mt-4 text-center">
                <a 
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Torna alla Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render normale quando non ci sono errori
    return this.props.children;
  }
}

export default ErrorBoundary;
