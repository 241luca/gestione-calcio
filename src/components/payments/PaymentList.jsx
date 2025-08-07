import React, { useState, useEffect } from 'react';
import { FiPlus, FiFilter, FiDownload, FiSearch, FiDollarSign, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    athleteId: '',
    search: '',
    fromDate: '',
    toDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);

  // Colori per gli stati
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    CANCELLED: 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    PENDING: <FiClock className="w-4 h-4" />,
    PAID: <FiCheckCircle className="w-4 h-4" />,
    OVERDUE: <FiAlertCircle className="w-4 h-4" />,
    PARTIAL: <FiDollarSign className="w-4 h-4" />,
    CANCELLED: <FiAlertCircle className="w-4 h-4" />
  };

  const statusLabels = {
    PENDING: 'In attesa',
    PAID: 'Pagato',
    OVERDUE: 'Scaduto',
    PARTIAL: 'Parziale',
    CANCELLED: 'Annullato'
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.athleteId) params.append('athleteId', filters.athleteId);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);

      const response = await axios.get(
        `http://localhost:3000/api/v1/payments?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setPayments(response.data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento pagamenti:', error);
      toast.error('Errore nel caricamento dei pagamenti');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:3000/api/v1/payments/stats',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  };

  const handleStatusChange = async (paymentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:3000/api/v1/payments/${paymentId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Stato pagamento aggiornato');
        fetchPayments();
        fetchStats();
      }
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      toast.error('Errore nell\'aggiornamento dello stato');
    }
  };

  const handleRecordPayment = async (paymentId) => {
    // In un'app reale, apriresti un modal per inserire i dettagli
    const paymentData = {
      amount: prompt('Importo pagato:'),
      paymentDate: new Date().toISOString(),
      paymentMethod: 'CASH'
    };

    if (!paymentData.amount) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3000/api/v1/payments/${paymentId}/record`,
        {
          ...paymentData,
          amount: parseFloat(paymentData.amount)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Pagamento registrato con successo');
        fetchPayments();
        fetchStats();
      }
    } catch (error) {
      console.error('Errore registrazione pagamento:', error);
      toast.error('Errore nella registrazione del pagamento');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM yyyy', { locale: it });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiche */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale Previsto</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalExpected || 0)}
                </p>
              </div>
              <FiDollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Incassato</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalCollected || 0)}
                </p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Attesa</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(stats.totalPending || 0)}
                </p>
              </div>
              <FiClock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scaduti</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalOverdue || 0)}
                </p>
              </div>
              <FiAlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Header con azioni */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Gestione Pagamenti</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiFilter className="inline-block mr-2" />
                Filtri
              </button>
              <button
                onClick={() => window.location.href = '/payments/new'}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiPlus className="inline-block mr-2" />
                Nuovo Pagamento
              </button>
            </div>
          </div>

          {/* Filtri */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stato</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="">Tutti</option>
                    <option value="PENDING">In attesa</option>
                    <option value="PAID">Pagato</option>
                    <option value="OVERDUE">Scaduto</option>
                    <option value="PARTIAL">Parziale</option>
                    <option value="CANCELLED">Annullato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Da data</label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">A data</label>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ status: '', athleteId: '', search: '', fromDate: '', toDate: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Pulisci Filtri
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabella Pagamenti */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atleta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scadenza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.athlete?.firstName} {payment.athlete?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.athlete?.fiscalCode}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.type?.name}</div>
                    <div className="text-sm text-gray-500">{payment.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </div>
                    {payment.paidAmount > 0 && payment.paidAmount < payment.amount && (
                      <div className="text-sm text-gray-500">
                        Pagato: {formatCurrency(payment.paidAmount)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(payment.dueDate)}</div>
                    {payment.paidDate && (
                      <div className="text-sm text-gray-500">
                        Pagato: {formatDate(payment.paidDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                      {statusIcons[payment.status]}
                      <span className="ml-1">{statusLabels[payment.status]}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {payment.status === 'PENDING' && (
                        <button
                          onClick={() => handleRecordPayment(payment.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Registra pagamento"
                        >
                          <FiCheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      {payment.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(payment.id, 'CANCELLED')}
                          className="text-red-600 hover:text-red-900"
                          title="Annulla"
                        >
                          <FiAlertCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => window.location.href = `/payments/${payment.id}`}
                        className="text-primary-600 hover:text-primary-900"
                        title="Dettagli"
                      >
                        Dettagli
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessun pagamento trovato</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentList;