import React, { useState, useEffect } from 'react';
import { 
  CurrencyEuroIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { athleteService } from '../services/api';
import { exportService } from '../services/exportService';
import toast from 'react-hot-toast';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    athleteId: '',
    amount: '',
    paymentType: 'monthly',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceMonth: '',
    notes: ''
  });

  const paymentTypes = [
    { id: 'registration', name: 'Iscrizione', amount: 150 },
    { id: 'monthly', name: 'Quota Mensile', amount: 50 },
    { id: 'uniform', name: 'Divisa', amount: 80 },
    { id: 'tournament', name: 'Torneo', amount: 30 },
    { id: 'insurance', name: 'Assicurazione', amount: 40 },
    { id: 'other', name: 'Altro', amount: 0 }
  ];

  const paymentMethods = [
    { id: 'cash', name: 'Contanti' },
    { id: 'bank', name: 'Bonifico' },
    { id: 'card', name: 'Carta' },
    { id: 'check', name: 'Assegno' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carica atleti
      const athletesResponse = await athleteService.getAll();
      if (athletesResponse.success) {
        setAthletes(athletesResponse.data.athletes || []);
      }

      // Dati di esempio per i pagamenti
      const mockPayments = [
        {
          id: '1',
          athleteId: '1',
          athleteName: 'Mario Rossi',
          amount: 50,
          type: 'Quota Mensile',
          method: 'Bonifico',
          paymentDate: '2024-11-01',
          referenceMonth: 'Novembre 2024',
          status: 'paid',
          receiptNumber: 'RIC-2024-001'
        },
        {
          id: '2',
          athleteId: '2',
          athleteName: 'Luigi Verdi',
          amount: 50,
          type: 'Quota Mensile',
          method: 'Contanti',
          paymentDate: '2024-11-05',
          referenceMonth: 'Novembre 2024',
          status: 'paid',
          receiptNumber: 'RIC-2024-002'
        },
        {
          id: '3',
          athleteId: '3',
          athleteName: 'Giovanni Bianchi',
          amount: 50,
          type: 'Quota Mensile',
          method: '-',
          paymentDate: null,
          referenceMonth: 'Novembre 2024',
          status: 'pending',
          dueDate: '2024-11-30'
        },
        {
          id: '4',
          athleteId: '4',
          athleteName: 'Paolo Neri',
          amount: 100,
          type: 'Quota Mensile',
          method: '-',
          paymentDate: null,
          referenceMonth: 'Ottobre-Novembre 2024',
          status: 'overdue',
          dueDate: '2024-10-31'
        },
        {
          id: '5',
          athleteId: '1',
          athleteName: 'Mario Rossi',
          amount: 150,
          type: 'Iscrizione',
          method: 'Bonifico',
          paymentDate: '2024-09-15',
          referenceMonth: 'Settembre 2024',
          status: 'paid',
          receiptNumber: 'RIC-2024-003'
        }
      ];
      
      setPayments(mockPayments);
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentForm.athleteId || !paymentForm.amount) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    try {
      // Simuliamo la registrazione del pagamento
      const athlete = athletes.find(a => a.id === paymentForm.athleteId);
      const newPayment = {
        id: Date.now().toString(),
        athleteId: paymentForm.athleteId,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        amount: parseFloat(paymentForm.amount),
        type: paymentTypes.find(t => t.id === paymentForm.paymentType)?.name,
        method: paymentMethods.find(m => m.id === paymentForm.paymentMethod)?.name,
        paymentDate: paymentForm.paymentDate,
        referenceMonth: paymentForm.referenceMonth || new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
        status: 'paid',
        receiptNumber: `RIC-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`
      };
      
      setPayments([newPayment, ...payments]);
      toast.success('Pagamento registrato con successo!');
      setShowPaymentModal(false);
      resetForm();
    } catch (error) {
      toast.error('Errore nella registrazione del pagamento');
    }
  };

  const resetForm = () => {
    setPaymentForm({
      athleteId: '',
      amount: '',
      paymentType: 'monthly',
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      referenceMonth: '',
      notes: ''
    });
  };

  const handlePaymentTypeChange = (typeId) => {
    const type = paymentTypes.find(t => t.id === typeId);
    setPaymentForm({
      ...paymentForm,
      paymentType: typeId,
      amount: type?.amount || ''
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'paid': { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Pagato' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'In attesa' },
      'overdue': { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon, text: 'Scaduto' }
    };
    
    const badge = badges[status] || badges['pending'];
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${badge.color}`}>
        <badge.icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Filtra pagamenti
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calcola statistiche
  const stats = {
    totalExpected: payments.reduce((sum, p) => sum + p.amount, 0),
    totalPaid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    totalPending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    totalOverdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0)
  };

  const exportPayments = () => {
    const dataToExport = filteredPayments.map(payment => ({
      'Atleta': payment.athleteName,
      'Importo': formatCurrency(payment.amount),
      'Tipo': payment.type,
      'Metodo': payment.method,
      'Data Pagamento': formatDate(payment.paymentDate),
      'Periodo': payment.referenceMonth,
      'Stato': payment.status === 'paid' ? 'Pagato' : payment.status === 'pending' ? 'In attesa' : 'Scaduto',
      'N. Ricevuta': payment.receiptNumber || '-'
    }));

    exportService.exportToCSV(dataToExport, `pagamenti_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const printReceipt = (payment) => {
    const receiptContent = `
      <html>
        <head>
          <title>Ricevuta ${payment.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #1e40af; }
            .receipt-number { margin-top: 20px; font-size: 18px; }
            .section { margin: 30px 0; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #111827; }
            .amount { font-size: 24px; font-weight: bold; color: #1e40af; text-align: center; margin: 30px 0; }
            .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; }
            .signature { margin-top: 60px; border-top: 1px solid #000; width: 200px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">⚽ Soccer Management System</div>
            <div class="receipt-number">Ricevuta N° ${payment.receiptNumber}</div>
          </div>
          
          <div class="section">
            <div class="row">
              <span class="label">Data:</span>
              <span class="value">${formatDate(payment.paymentDate)}</span>
            </div>
            <div class="row">
              <span class="label">Atleta:</span>
              <span class="value">${payment.athleteName}</span>
            </div>
            <div class="row">
              <span class="label">Tipo Pagamento:</span>
              <span class="value">${payment.type}</span>
            </div>
            <div class="row">
              <span class="label">Periodo:</span>
              <span class="value">${payment.referenceMonth}</span>
            </div>
            <div class="row">
              <span class="label">Metodo:</span>
              <span class="value">${payment.method}</span>
            </div>
          </div>
          
          <div class="amount">
            IMPORTO: ${formatCurrency(payment.amount)}
          </div>
          
          <div class="signature">
            Firma
          </div>
          
          <div class="footer">
            Soccer Management System - Via dello Sport, 1 - Tel: 02 1234567<br>
            Documento generato il ${new Date().toLocaleDateString('it-IT')}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pagamenti</h1>
            <p className="text-gray-600 mt-2">Gestisci i pagamenti e le quote</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportPayments}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <PrinterIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Report</span>
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Registra Pagamento
            </button>
          </div>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Previsto</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalExpected)}</p>
            </div>
            <CurrencyEuroIcon className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Incassato</p>
              <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.totalPaid)}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Attesa</p>
              <p className="text-2xl font-semibold text-yellow-600">{formatCurrency(stats.totalPending)}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scaduti</p>
              <p className="text-2xl font-semibold text-red-600">{formatCurrency(stats.totalOverdue)}</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca atleta o ricevuta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="paid">Pagati</option>
              <option value="pending">In attesa</option>
              <option value="overdue">Scaduti</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabella Pagamenti */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atleta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.athleteName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.referenceMonth}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.status === 'paid' 
                          ? formatDate(payment.paymentDate)
                          : `Scadenza: ${formatDate(payment.dueDate)}`
                        }
                      </div>
                      {payment.method && payment.method !== '-' && (
                        <div className="text-xs text-gray-500">{payment.method}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {payment.status === 'paid' ? (
                        <button
                          onClick={() => printReceipt(payment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Stampa ricevuta"
                        >
                          <DocumentTextIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setPaymentForm({
                              ...paymentForm,
                              athleteId: payment.athleteId,
                              amount: payment.amount,
                              referenceMonth: payment.referenceMonth
                            });
                            setShowPaymentModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Registra
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <CurrencyEuroIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nessun pagamento trovato</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registra Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowPaymentModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Registra Pagamento
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Atleta *
                    </label>
                    <select
                      value={paymentForm.athleteId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, athleteId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Pagamento *
                    </label>
                    <select
                      value={paymentForm.paymentType}
                      onChange={(e) => handlePaymentTypeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {paymentTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Importo (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="50.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metodo di Pagamento *
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {paymentMethods.map(method => (
                        <option key={method.id} value={method.id}>{method.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Pagamento *
                    </label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Periodo di Riferimento
                    </label>
                    <input
                      type="text"
                      value={paymentForm.referenceMonth}
                      onChange={(e) => setPaymentForm({ ...paymentForm, referenceMonth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="es. Novembre 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note
                    </label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Note aggiuntive..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Registra Pagamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
