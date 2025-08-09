// src/pages/PaymentsPage.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CurrencyEuroIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PrinterIcon,
  BanknotesIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { format, differenceInDays, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { useApiData, useApiMutation } from '../hooks/useApiData';

const PaymentsPage = () => {
  // Usa i nuovi hooks per caricare i dati
  const { data: paymentsData, loading: loadingPayments, error: errorPayments, refetch: refetchPayments } = useApiData('/payments');
  const { data: athletesData, loading: loadingAthletes } = useApiData('/athletes');
  const { data: overdueData, loading: loadingOverdue } = useApiData('/payments/overdue');
  const { mutate } = useApiMutation();
  
  // Estrai gli array dal formato restituito dal backend
  const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.payments || []);
  const athletes = Array.isArray(athletesData) ? athletesData : [];
  const overduePayments = overdueData?.payments || [];
  const stats = overdueData?.stats || {};
  
  // Tipi di pagamento (per ora hardcoded, potremmo caricarli dal backend)
  const paymentTypes = [
    { id: 1, name: 'Quota Iscrizione', amount: 150 },
    { id: 2, name: 'Quota Mensile', amount: 50 },
    { id: 3, name: 'Quota Annuale', amount: 500 },
    { id: 4, name: 'Kit Sportivo', amount: 80 },
    { id: 5, name: 'Gita/Torneo', amount: 100 },
    { id: 6, name: 'Altro', amount: 0 }
  ];
  
  // Stati per UI
  const [filters, setFilters] = useState({
    status: 'all',
    athleteId: '',
    typeId: '',
    month: format(new Date(), 'yyyy-MM')
  });
  
  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Form nuovo pagamento
  const [newPayment, setNewPayment] = useState({
    athleteId: '',
    typeId: '',
    amount: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    notes: ''
  });

  // Form registra pagamento
  const [paymentRecord, setPaymentRecord] = useState({
    amount: '',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    notes: ''
  });

  // Form pagamenti multipli
  const [bulkPayment, setBulkPayment] = useState({
    athleteIds: [],
    typeId: '',
    amount: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  // Handler per creare nuovo pagamento
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    
    try {
      await mutate('post', '/payments', {
        ...newPayment,
        typeId: parseInt(newPayment.typeId),
        amount: parseFloat(newPayment.amount)
      }, 'Pagamento creato con successo');
      
      setShowCreateModal(false);
      setNewPayment({
        athleteId: '',
        typeId: '',
        amount: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        notes: ''
      });
      refetchPayments();
    } catch (error) {
      console.error('Errore creazione pagamento:', error);
    }
  };

  // Handler per registrare pagamento
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedPayment) return;
    
    try {
      await mutate('post', `/payments/${selectedPayment.id}/pay`, {
        ...paymentRecord,
        amount: parseFloat(paymentRecord.amount)
      }, 'Pagamento registrato con successo');
      
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setPaymentRecord({
        amount: '',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        notes: ''
      });
      refetchPayments();
    } catch (error) {
      console.error('Errore registrazione pagamento:', error);
    }
  };

  // Handler per pagamenti multipli
  const handleBulkCreate = async (e) => {
    e.preventDefault();
    
    if (bulkPayment.athleteIds.length === 0) {
      toast.error('Seleziona almeno un atleta');
      return;
    }
    
    try {
      await mutate('post', '/payments/bulk', {
        ...bulkPayment,
        typeId: parseInt(bulkPayment.typeId),
        amount: parseFloat(bulkPayment.amount)
      }, 'Pagamenti creati con successo');
      
      setShowBulkModal(false);
      setBulkPayment({
        athleteIds: [],
        typeId: '',
        amount: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        description: ''
      });
      refetchPayments();
    } catch (error) {
      console.error('Errore creazione pagamenti multipli:', error);
    }
  };

  // Handler per eliminare pagamento
  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo pagamento?')) return;
    
    try {
      await mutate('delete', `/payments/${paymentId}`, null, 'Pagamento eliminato con successo');
      refetchPayments();
    } catch (error) {
      console.error('Errore eliminazione pagamento:', error);
    }
  };

  // Handler per generare ricevuta
  const handleGenerateReceipt = async (paymentId) => {
    try {
      const response = await mutate('post', `/payments/${paymentId}/receipt`, null, null);
      // TODO: Gestire il download del PDF
      toast.success('Ricevuta generata con successo');
    } catch (error) {
      console.error('Errore generazione ricevuta:', error);
    }
  };

  // Filtra pagamenti
  const filteredPayments = payments.filter(payment => {
    let matches = true;
    
    if (filters.status !== 'all') {
      matches = matches && payment.status === filters.status;
    }
    
    if (filters.athleteId) {
      matches = matches && payment.athleteId === filters.athleteId;
    }
    
    if (filters.typeId) {
      matches = matches && payment.typeId === parseInt(filters.typeId);
    }
    
    return matches;
  });

  // Calcola statistiche
  const dashboardStats = {
    totalExpected: payments.reduce((sum, p) => sum + p.amount, 0),
    totalCollected: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.paidAmount || 0), 0),
    totalPending: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
    totalOverdue: overduePayments.reduce((sum, p) => sum + p.amount, 0),
    overdueCount: overduePayments.length
  };

  // Helper per ottenere nome atleta
  const getAthleteName = (athleteId) => {
    const athlete = athletes.find(a => a.id === athleteId);
    return athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Atleta sconosciuto';
  };

  // Helper per ottenere nome tipo pagamento
  const getPaymentTypeName = (typeId) => {
    const type = paymentTypes.find(t => t.id === typeId);
    return type ? type.name : 'Tipo sconosciuto';
  };

  // Helper per formattare importo
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Helper per ottenere classe CSS per status
  const getStatusClass = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper per ottenere icona status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'PENDING':
        return <ClockIcon className="w-5 h-5" />;
      case 'OVERDUE':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'CANCELLED':
        return <XCircleIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const loading = loadingPayments || loadingAthletes || loadingOverdue;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Caricamento pagamenti...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Pagamenti</h1>
          <p className="text-gray-600 mt-1">Gestisci quote e pagamenti degli atleti</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <BanknotesIcon className="w-5 h-5 mr-2" />
            Pagamenti Multipli
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuovo Pagamento
          </button>
        </div>
      </div>

      {/* Statistiche Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Previsto</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(dashboardStats.totalExpected)}
              </p>
            </div>
            <CurrencyEuroIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Incassato</p>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(dashboardStats.totalCollected)}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Attesa</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatAmount(dashboardStats.totalPending)}
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scaduti</p>
              <p className="text-2xl font-bold text-red-600">
                {formatAmount(dashboardStats.totalOverdue)}
              </p>
              <p className="text-xs text-gray-500">{dashboardStats.overdueCount} pagamenti</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasso Riscossione</p>
              <p className="text-2xl font-bold text-blue-600">
                {dashboardStats.totalExpected > 0 
                  ? Math.round((dashboardStats.totalCollected / dashboardStats.totalExpected) * 100)
                  : 0}%
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stato
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti</option>
              <option value="PENDING">In Attesa</option>
              <option value="PAID">Pagato</option>
              <option value="OVERDUE">Scaduto</option>
              <option value="CANCELLED">Annullato</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Atleta
            </label>
            <select
              value={filters.athleteId}
              onChange={(e) => setFilters({...filters, athleteId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutti gli atleti</option>
              {athletes.map(athlete => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.firstName} {athlete.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Pagamento
            </label>
            <select
              value={filters.typeId}
              onChange={(e) => setFilters({...filters, typeId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutti i tipi</option>
              {paymentTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mese
            </label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({...filters, month: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabella Pagamenti */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getAthleteName(payment.athleteId)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getPaymentTypeName(payment.typeId)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatAmount(payment.amount)}
                  </div>
                  {payment.paidAmount && payment.paidAmount !== payment.amount && (
                    <div className="text-xs text-green-600">
                      Pagato: {formatAmount(payment.paidAmount)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(new Date(payment.dueDate), 'dd/MM/yyyy')}
                  </div>
                  {payment.status === 'OVERDUE' && (
                    <div className="text-xs text-red-600">
                      Scaduto da {differenceInDays(new Date(), new Date(payment.dueDate))} giorni
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    <span className="ml-1">
                      {payment.status === 'PAID' && 'Pagato'}
                      {payment.status === 'PENDING' && 'In Attesa'}
                      {payment.status === 'OVERDUE' && 'Scaduto'}
                      {payment.status === 'CANCELLED' && 'Annullato'}
                    </span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {payment.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setPaymentRecord({
                            ...paymentRecord,
                            amount: payment.amount.toString()
                          });
                          setShowPaymentModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Registra Pagamento"
                      >
                        <BanknotesIcon className="w-5 h-5" />
                      </button>
                    )}
                    
                    {payment.status === 'PAID' && (
                      <button
                        onClick={() => handleGenerateReceipt(payment.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Genera Ricevuta"
                      >
                        <PrinterIcon className="w-5 h-5" />
                      </button>
                    )}
                    
                    {payment.status !== 'PAID' && (
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Elimina"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPayments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nessun pagamento trovato
          </div>
        )}
      </div>

      {/* Modal Nuovo Pagamento */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nuovo Pagamento</h2>
            
            <form onSubmit={handleCreatePayment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atleta *
                  </label>
                  <select
                    value={newPayment.athleteId}
                    onChange={(e) => setNewPayment({...newPayment, athleteId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona atleta</option>
                    {athletes.map(athlete => (
                      <option key={athlete.id} value={athlete.id}>
                        {athlete.firstName} {athlete.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Pagamento *
                  </label>
                  <select
                    value={newPayment.typeId}
                    onChange={(e) => {
                      const typeId = e.target.value;
                      const type = paymentTypes.find(t => t.id === parseInt(typeId));
                      setNewPayment({
                        ...newPayment,
                        typeId,
                        amount: type?.amount?.toString() || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona tipo</option>
                    {paymentTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importo (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scadenza *
                  </label>
                  <input
                    type="date"
                    value={newPayment.dueDate}
                    onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione
                  </label>
                  <input
                    type="text"
                    value={newPayment.description}
                    onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crea Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registra Pagamento */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Registra Pagamento</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">Atleta</p>
              <p className="font-semibold">{getAthleteName(selectedPayment.athleteId)}</p>
              <p className="text-sm text-gray-600 mt-2">Tipo</p>
              <p className="font-semibold">{getPaymentTypeName(selectedPayment.typeId)}</p>
              <p className="text-sm text-gray-600 mt-2">Importo Dovuto</p>
              <p className="font-semibold text-lg">{formatAmount(selectedPayment.amount)}</p>
            </div>
            
            <form onSubmit={handleRecordPayment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importo Pagato (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentRecord.amount}
                    onChange={(e) => setPaymentRecord({...paymentRecord, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Pagamento *
                  </label>
                  <input
                    type="date"
                    value={paymentRecord.paymentDate}
                    onChange={(e) => setPaymentRecord({...paymentRecord, paymentDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metodo di Pagamento *
                  </label>
                  <select
                    value={paymentRecord.paymentMethod}
                    onChange={(e) => setPaymentRecord({...paymentRecord, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="cash">Contanti</option>
                    <option value="bank_transfer">Bonifico</option>
                    <option value="credit_card">Carta di Credito</option>
                    <option value="check">Assegno</option>
                    <option value="other">Altro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    value={paymentRecord.notes}
                    onChange={(e) => setPaymentRecord({...paymentRecord, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayment(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Registra Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pagamenti Multipli */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Crea Pagamenti Multipli</h2>
            
            <form onSubmit={handleBulkCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleziona Atleti *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {athletes.map(athlete => (
                      <label key={athlete.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={bulkPayment.athleteIds.includes(athlete.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkPayment({
                                ...bulkPayment,
                                athleteIds: [...bulkPayment.athleteIds, athlete.id]
                              });
                            } else {
                              setBulkPayment({
                                ...bulkPayment,
                                athleteIds: bulkPayment.athleteIds.filter(id => id !== athlete.id)
                              });
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">
                          {athlete.firstName} {athlete.lastName}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setBulkPayment({
                        ...bulkPayment,
                        athleteIds: athletes.map(a => a.id)
                      })}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Seleziona tutti
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkPayment({
                        ...bulkPayment,
                        athleteIds: []
                      })}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Deseleziona tutti
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Pagamento *
                  </label>
                  <select
                    value={bulkPayment.typeId}
                    onChange={(e) => {
                      const typeId = e.target.value;
                      const type = paymentTypes.find(t => t.id === parseInt(typeId));
                      setBulkPayment({
                        ...bulkPayment,
                        typeId,
                        amount: type?.amount?.toString() || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona tipo</option>
                    {paymentTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importo (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bulkPayment.amount}
                    onChange={(e) => setBulkPayment({...bulkPayment, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scadenza *
                  </label>
                  <input
                    type="date"
                    value={bulkPayment.dueDate}
                    onChange={(e) => setBulkPayment({...bulkPayment, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione
                  </label>
                  <input
                    type="text"
                    value={bulkPayment.description}
                    onChange={(e) => setBulkPayment({...bulkPayment, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Riepilogo: {bulkPayment.athleteIds.length} atleti selezionati
                </p>
                {bulkPayment.amount && (
                  <p className="text-sm text-blue-700 mt-1">
                    Totale: {formatAmount(parseFloat(bulkPayment.amount) * bulkPayment.athleteIds.length)}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={bulkPayment.athleteIds.length === 0}
                >
                  Crea {bulkPayment.athleteIds.length} Pagamenti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
