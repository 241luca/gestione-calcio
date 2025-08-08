import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { FiDollarSign, FiAlertCircle, FiCheck, FiPlus, FiDownload, FiTrendingUp } from 'react-icons/fi';
import PaymentForm from './PaymentForm';
import PaymentsList from './PaymentsList';
import PaymentStats from './PaymentStats';
import { paymentsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

function PaymentsManager() {
  const [activeTab, setActiveTab] = useState('all'); // all, pending, overdue, paid
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filters, setFilters] = useState({
    athleteId: '',
    typeId: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  const queryClient = useQueryClient();

  // Recupera pagamenti con filtri
  const { data: paymentsData, isLoading, error } = useQuery(
    ['payments', filters, activeTab],
    () => paymentsAPI.getPayments({ 
      ...filters, 
      status: activeTab === 'all' ? '' : activeTab.toUpperCase() 
    }),
    {
      keepPreviousData: true
    }
  );

  // Recupera statistiche pagamenti
  const { data: stats } = useQuery(
    'payments-stats',
    paymentsAPI.getStats
  );

  // Recupera pagamenti scaduti
  const { data: overdueData } = useQuery(
    'payments-overdue',
    paymentsAPI.getOverdue
  );

  // Mutation per registrare pagamento
  const payMutation = useMutation(
    ({ paymentId, amount, paymentDate, paymentMethod }) => 
      paymentsAPI.recordPayment(paymentId, { amount, paymentDate, paymentMethod }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('payments');
        queryClient.invalidateQueries('payments-stats');
        queryClient.invalidateQueries('payments-overdue');
        toast.success('Pagamento registrato con successo!');
        setSelectedPayment(null);
      },
      onError: () => {
        toast.error('Errore nella registrazione del pagamento');
      }
    }
  );

  // Mutation per inviare promemoria
  const reminderMutation = useMutation(
    () => paymentsAPI.sendReminders(),
    {
      onSuccess: (data) => {
        toast.success(`Inviati ${data.sent} promemoria!`);
      },
      onError: () => {
        toast.error('Errore nell\'invio dei promemoria');
      }
    }
  );

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    queryClient.invalidateQueries('payments');
    queryClient.invalidateQueries('payments-stats');
    toast.success('Pagamento creato con successo!');
  };

  const handleRecordPayment = (payment) => {
    const amount = prompt(`Importo da registrare per ${payment.athlete?.firstName} ${payment.athlete?.lastName}:`, payment.amount);
    
    if (amount && !isNaN(amount)) {
      payMutation.mutate({
        paymentId: payment.id,
        amount: parseFloat(amount),
        paymentDate: new Date().toISOString(),
        paymentMethod: 'CASH'
      });
    }
  };

  const handleGenerateReceipt = async (payment) => {
    try {
      const receipt = await paymentsAPI.generateReceipt(payment.id);
      // In produzione, questo aprirebbe il PDF
      toast.success('Ricevuta generata!');
    } catch (error) {
      toast.error('Errore nella generazione della ricevuta');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-4">Errore nel caricamento pagamenti</div>;

  const payments = paymentsData?.data || [];
  const overduePayments = overdueData?.data || [];

  return (
    <div className="p-6">
      {/* Header con statistiche */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Gestione Pagamenti</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => reminderMutation.mutate()}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center"
            >
              <FiAlertCircle className="mr-2" />
              Invia Promemoria
            </button>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FiPlus className="mr-2" />
              Nuovo Pagamento
            </button>
          </div>
        </div>

        {/* Cards statistiche */}
        <PaymentStats stats={stats} />

        {/* Alert per pagamenti scaduti */}
        {overduePayments.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <FiAlertCircle className="text-red-400 text-xl mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-700 font-medium">
                  Attenzione: {overduePayments.length} pagamenti scaduti
                </p>
                <p className="text-red-600 text-sm mt-1">
                  Importo totale scaduto: €{overduePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs per filtrare */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tutti i pagamenti
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              In attesa ({stats?.pending || 0})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overdue'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scaduti ({stats?.overdue || 0})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'paid'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pagati ({stats?.paid || 0})
            </button>
          </nav>
        </div>
      </div>

      {/* Lista pagamenti */}
      <PaymentsList
        payments={payments}
        onRecordPayment={handleRecordPayment}
        onGenerateReceipt={handleGenerateReceipt}
      />

      {/* Modal form pagamento */}
      {showPaymentForm && (
        <PaymentForm
          onClose={() => setShowPaymentForm(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default PaymentsManager;