// src/pages/PaymentsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Filtri
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

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('organizationId');
      
      // Costruisci query string per filtri
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.athleteId) params.append('athleteId', filters.athleteId);
      if (filters.typeId) params.append('typeId', filters.typeId);
      if (filters.month) {
        const monthDate = new Date(filters.month);
        params.append('fromDate', startOfMonth(monthDate).toISOString());
        params.append('toDate', endOfMonth(monthDate).toISOString());
      }

      // Carica pagamenti
      const paymentsRes = await axios.get(
        `http://localhost:3000/api/v1/payments?${params}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': organizationId
          }
        }
      );
      setPayments(paymentsRes.data.data || []);
      
      // Carica statistiche
      const statsRes = await axios.get(
        `http://localhost:3000/api/v1/payments/stats?month=${filters.month}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': organizationId
          }
        }
      );
      setStats(statsRes.data.data);
      
      // Carica atleti (solo una volta)
      if (athletes.length === 0) {
        const athletesRes = await axios.get(
          'http://localhost:3000/api/v1/athletes',
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'X-Organization-ID': organizationId
            }
          }
        );
        setAthletes(athletesRes.data.data || []);
      }
      
      // Carica tipi pagamento (solo una volta)
      if (paymentTypes.length === 0) {
        // Per ora usiamo tipi hardcoded, poi li prenderemo dal backend
        setPaymentTypes([
          { id: 1, name: 'Quota Iscrizione', amount: 150 },
          { id: 2, name: 'Quota Mensile', amount: 50 },
          { id: 3, name: 'Kit Allenamento', amount: 80 },
          { id: 4, name: 'Trasferta', amount: 30 },
          { id: 5, name: 'Altro', amount: 0 }
        ]);
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('organizationId');
      
      const response = await axios.post(
        'http://localhost:3000/api/v1/payments',
        newPayment,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': organizationId
          }
        }
      );
      
      toast.success('Pagamento creato con successo');
      setShowCreateModal(false);
      setNewPayment({
        athleteId: '',
        typeId: '',
        amount: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Errore creazione pagamento:', error);
      toast.error('Errore nella creazione del pagamento');
    }
  };

  const recordPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('organizationId');
      
      await axios.post(
        `http://localhost:3000/api/v1/payments/${selectedPayment.id}/pay`,
        paymentRecord,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': organizationId
          }
        }
      );
      
      toast.success('Pagamento registrato con successo');
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setPaymentRecord({
        amount: '',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Errore registrazione pagamento:', error);
      toast.error('Errore nella registrazione del pagamento');
    }
  };

  const createBulkPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('organizationId');
      
      const response = await axios.post(
        'http://localhost:3000/api/v1/payments/bulk',
        bulkPayment,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': organizationId
          }
        }
      );
      
      const result = response.data.data;
      toast.success(`Creati ${result.created.length} pagamenti su ${result.total}`);
      
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} pagamenti non creati`);
      }
      
      setShowBulkModal(false);
      setBulkPayment({
        athleteIds: [],
        typeId: '',
        amount: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        description: ''
      });
      loadData();
    } catch (error) {
      console.error('Errore creazione pagamenti multipli:', error);
      toast.error('Errore nella creazione dei pagamenti');
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('organizationId');
      
      await axios.put(
        `http://localhost:3000/api/v1/payments/${paymentId}`,
        { status: newStatus },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': organizationId
          }
        }
      );
      
      toast.success('Stato pagamento aggiornato');
      loadData();
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      toast.error('Errore nell\'aggiornamento dello stato');
    }
  };

  const downloadReceipt = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('organizationId');
      
      const response = await axios.get(
        `http://localhost:3000/api/v1/payments/${paymentId}/receipt`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': organizationId
          }
        }
      );
      
      // Converti base64 in blob e scarica
      const pdfData = response.data.data.pdf;
      const blob = new Blob(
        [Uint8Array.from(atob(pdfData), c => c.charCodeAt(0))],
        { type: 'application/pdf' }
      );
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ricevuta_${response.data.data.receiptNumber}.pdf`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      toast.success('Ricevuta scaricata');
    } catch (error) {
      console.error('Errore download ricevuta:', error);
      toast.error('Errore nel download della ricevuta');
    }
  };

  const sendReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('organizationId');
      
      const response = await axios.post(
        'http://localhost:3000/api/v1/payments/send-reminders',
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': organizationId
          }
        }
      );
      
      const result = response.data.data;
      toast.success(`Inviati ${result.remindersSent} promemoria`);
    } catch (error) {
      console.error('Errore invio promemoria:', error);
      toast.error('Errore nell\'invio dei promemoria');
    }
  };

  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('organizationId');
      
      const monthDate = new Date(filters.month);
      const params = new URLSearchParams({
        fromDate: startOfMonth(monthDate).toISOString(),
        toDate: endOfMonth(monthDate).toISOString()
      });
      
      const response = await axios.get(
        `http://localhost:3000/api/v1/payments/export/excel?${params}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': organizationId
          }
        }
      );
      
      // Converti base64 in blob e scarica
      const csvData = response.data.data.data;
      const blob = new Blob(
        [Uint8Array.from(atob(csvData), c => c.charCodeAt(0))],
        { type: response.data.data.mimeType }
      );
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.data.data.filename;
      link.click();
      
      window.URL.revokeObjectURL(url);
      toast.success('Export Excel completato');
    } catch (error) {
      console.error('Errore export Excel:', error);
      toast.error('Errore nell\'export Excel');
    }
  };

  const downloadMonthlyReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('organizationId');
      
      const response = await axios.get(
        `http://localhost:3000/api/v1/payments/report/monthly?month=${filters.month}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': organizationId
          }
        }
      );
      
      // Converti base64 in blob e scarica
      const pdfData = response.data.data.pdf;
      const blob = new Blob(
        [Uint8Array.from(atob(pdfData), c => c.charCodeAt(0))],
        { type: 'application/pdf' }
      );
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_pagamenti_${response.data.data.month}.pdf`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      toast.success('Report mensile scaricato');
    } catch (error) {
      console.error('Errore download report:', error);
      toast.error('Errore nel download del report');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'In Attesa' },
      PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Pagato' },
      OVERDUE: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon, text: 'Scaduto' },
      CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon, text: 'Annullato' },
      PARTIAL: { color: 'bg-blue-100 text-blue-800', icon: BanknotesIcon, text: 'Parziale' }
    };
    
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getDaysUntilDue = (dueDate) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return <span className="text-red-600">Scaduto da {Math.abs(days)} giorni</span>;
    if (days === 0) return <span className="text-orange-600">Scade oggi</span>;
    if (days <= 3) return <span className="text-yellow-600">Scade tra {days} giorni</span>;
    return <span className="text-gray-600">Scade tra {days} giorni</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Pagamenti</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestisci quote, pagamenti e situazione economica
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={downloadMonthlyReport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <ChartBarIcon className="h-5 w-5" />
              <span>Report Mensile</span>
            </button>
            <button
              onClick={sendReminders}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <CalendarIcon className="h-5 w-5" />
              <span>Invia Promemoria</span>
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <BanknotesIcon className="h-5 w-5" />
              <span>Pagamenti Multipli</span>
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Nuovo Pagamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistiche */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyEuroIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Totale Previsto</p>
                <p className="text-2xl font-semibold text-gray-900">
                  €{stats.totalExpected?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Incassato</p>
                <p className="text-2xl font-semibold text-gray-900">
                  €{stats.totalCollected?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-green-600">
                  {stats.collectionRate || 0}% riscosso
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Attesa</p>
                <p className="text-2xl font-semibold text-gray-900">
                  €{stats.totalPending?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Scaduti</p>
                <p className="text-2xl font-semibold text-gray-900">
                  €{stats.totalOverdue?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtri */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tutti</option>
              <option value="PENDING">In Attesa</option>
              <option value="PAID">Pagati</option>
              <option value="OVERDUE">Scaduti</option>
              <option value="PARTIAL">Parziali</option>
              <option value="CANCELLED">Annullati</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atleta
            </label>
            <select
              value={filters.athleteId}
              onChange={(e) => setFilters({...filters, athleteId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutti</option>
              {athletes.map(athlete => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.firstName} {athlete.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={filters.typeId}
              onChange={(e) => setFilters({...filters, typeId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutti</option>
              {paymentTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mese
            </label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({...filters, month: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                status: 'all',
                athleteId: '',
                typeId: '',
                month: format(new Date(), 'yyyy-MM')
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset Filtri
            </button>
          </div>
        </div>
      </div>

      {/* Tabella Pagamenti */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
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
                Note
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {payment.athlete?.firstName} {payment.athlete?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.athlete?.fiscalCode}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{payment.type?.name}</div>
                  <div className="text-sm text-gray-500">{payment.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    €{payment.amount?.toFixed(2)}
                  </div>
                  {payment.paidAmount > 0 && payment.paidAmount < payment.amount && (
                    <div className="text-sm text-gray-500">
                      Pagato: €{payment.paidAmount?.toFixed(2)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(new Date(payment.dueDate), 'dd/MM/yyyy')}
                  </div>
                  <div className="text-sm">
                    {payment.status !== 'PAID' && getDaysUntilDue(payment.dueDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(payment.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {payment.notes}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {payment.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setPaymentRecord({
                            amount: payment.amount,
                            paymentDate: format(new Date(), 'yyyy-MM-dd'),
                            paymentMethod: 'cash',
                            notes: ''
                          });
                          setShowPaymentModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Registra Pagamento"
                      >
                        <BanknotesIcon className="h-5 w-5" />
                      </button>
                    )}
                    
                    {payment.status === 'PAID' && (
                      <button
                        onClick={() => downloadReceipt(payment.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Scarica Ricevuta"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                      </button>
                    )}
                    
                    {payment.status === 'PENDING' && (
                      <button
                        onClick={() => updatePaymentStatus(payment.id, 'CANCELLED')}
                        className="text-red-600 hover:text-red-900"
                        title="Annulla"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {payments.length === 0 && (
          <div className="text-center py-12">
            <CurrencyEuroIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun pagamento</h3>
            <p className="mt-1 text-sm text-gray-500">
              Non ci sono pagamenti da visualizzare.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Crea Pagamento
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nuovo Pagamento */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowCreateModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="bg-white rounded-lg p-6 max-w-md w-full z-10">
              <h3 className="text-lg font-medium mb-4">Nuovo Pagamento</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Atleta *
                  </label>
                  <select
                    value={newPayment.athleteId}
                    onChange={(e) => setNewPayment({...newPayment, athleteId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleziona atleta...</option>
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
                    value={newPayment.typeId}
                    onChange={(e) => {
                      const type = paymentTypes.find(t => t.id === parseInt(e.target.value));
                      setNewPayment({
                        ...newPayment,
                        typeId: e.target.value,
                        amount: type?.amount || '',
                        description: type?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleziona tipo...</option>
                    {paymentTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} {type.amount > 0 && `(€${type.amount})`}
                      </option>
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
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Scadenza *
                  </label>
                  <input
                    type="date"
                    value={newPayment.dueDate}
                    onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <input
                    type="text"
                    value={newPayment.description}
                    onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={createPayment}
                  disabled={!newPayment.athleteId || !newPayment.typeId || !newPayment.amount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Crea Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registra Pagamento */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowPaymentModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="bg-white rounded-lg p-6 max-w-md w-full z-10">
              <h3 className="text-lg font-medium mb-4">Registra Pagamento</h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Atleta:</p>
                <p className="font-medium">
                  {selectedPayment.athlete?.firstName} {selectedPayment.athlete?.lastName}
                </p>
                <p className="text-sm text-gray-600 mt-2">Importo dovuto:</p>
                <p className="font-medium text-lg">€{selectedPayment.amount?.toFixed(2)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importo Pagato (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentRecord.amount}
                    onChange={(e) => setPaymentRecord({...paymentRecord, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Pagamento *
                  </label>
                  <input
                    type="date"
                    value={paymentRecord.paymentDate}
                    onChange={(e) => setPaymentRecord({...paymentRecord, paymentDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metodo Pagamento
                  </label>
                  <select
                    value={paymentRecord.paymentMethod}
                    onChange={(e) => setPaymentRecord({...paymentRecord, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="cash">Contanti</option>
                    <option value="bank_transfer">Bonifico</option>
                    <option value="card">Carta</option>
                    <option value="check">Assegno</option>
                    <option value="other">Altro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={paymentRecord.notes}
                    onChange={(e) => setPaymentRecord({...paymentRecord, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={recordPayment}
                  disabled={!paymentRecord.amount}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Registra Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagamenti Multipli */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowBulkModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="bg-white rounded-lg p-6 max-w-2xl w-full z-10">
              <h3 className="text-lg font-medium mb-4">Crea Pagamenti Multipli</h3>
              <p className="text-sm text-gray-600 mb-4">
                Crea lo stesso pagamento per più atleti contemporaneamente (es. quota mensile)
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleziona Atleti *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="mb-2">
                      <button
                        onClick={() => {
                          const allIds = athletes.filter(a => a.status === 'ACTIVE').map(a => a.id);
                          setBulkPayment({...bulkPayment, athleteIds: allIds});
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 mr-4"
                      >
                        Seleziona tutti
                      </button>
                      <button
                        onClick={() => setBulkPayment({...bulkPayment, athleteIds: []})}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Deseleziona tutti
                      </button>
                    </div>
                    {athletes.map(athlete => (
                      <label key={athlete.id} className="flex items-center py-1">
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
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {athlete.firstName} {athlete.lastName}
                          {athlete.status !== 'ACTIVE' && (
                            <span className="ml-2 text-xs text-gray-500">({athlete.status})</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {bulkPayment.athleteIds.length} atleti selezionati
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Pagamento *
                    </label>
                    <select
                      value={bulkPayment.typeId}
                      onChange={(e) => {
                        const type = paymentTypes.find(t => t.id === parseInt(e.target.value));
                        setBulkPayment({
                          ...bulkPayment,
                          typeId: e.target.value,
                          amount: type?.amount || '',
                          description: type?.name || ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Seleziona tipo...</option>
                      {paymentTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name} {type.amount > 0 && `(€${type.amount})`}
                        </option>
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
                      value={bulkPayment.amount}
                      onChange={(e) => setBulkPayment({...bulkPayment, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Scadenza *
                  </label>
                  <input
                    type="date"
                    value={bulkPayment.dueDate}
                    onChange={(e) => setBulkPayment({...bulkPayment, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <input
                    type="text"
                    value={bulkPayment.description}
                    onChange={(e) => setBulkPayment({...bulkPayment, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="es. Quota mensile Gennaio 2025"
                  />
                </div>

                {bulkPayment.athleteIds.length > 0 && bulkPayment.amount && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Riepilogo:
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Verranno creati {bulkPayment.athleteIds.length} pagamenti da €{bulkPayment.amount} ciascuno
                    </p>
                    <p className="text-sm font-medium text-blue-900 mt-1">
                      Totale: €{(bulkPayment.athleteIds.length * parseFloat(bulkPayment.amount || 0)).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={createBulkPayments}
                  disabled={bulkPayment.athleteIds.length === 0 || !bulkPayment.typeId || !bulkPayment.amount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Crea {bulkPayment.athleteIds.length} Pagamenti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
