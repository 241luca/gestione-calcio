import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  UsersIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { exportService } from '../services/exportService';

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Dati di esempio per i report
  const [attendanceData, setAttendanceData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [documentData, setDocumentData] = useState([]);

  useEffect(() => {
    // Carica dati di esempio
    loadReportData();
  }, [dateRange]);

  const loadReportData = () => {
    // Dati presenze
    setAttendanceData([
      { athlete: 'Mario Rossi', team: 'Under 15', presenze: 12, assenze: 3, percentuale: 80 },
      { athlete: 'Luigi Verdi', team: 'Under 15', presenze: 14, assenze: 1, percentuale: 93 },
      { athlete: 'Giovanni Bianchi', team: 'Under 13', presenze: 10, assenze: 5, percentuale: 67 },
      { athlete: 'Paolo Neri', team: 'Under 17', presenze: 15, assenze: 0, percentuale: 100 },
      { athlete: 'Marco Blu', team: 'Prima Squadra', presenze: 13, assenze: 2, percentuale: 87 }
    ]);

    // Dati pagamenti
    setPaymentData([
      { mese: 'Giugno', dovuto: 5000, incassato: 4500, percentuale: 90 },
      { mese: 'Luglio', dovuto: 5000, incassato: 4200, percentuale: 84 },
      { mese: 'Agosto', dovuto: 5000, incassato: 3800, percentuale: 76 }
    ]);

    // Dati documenti
    setDocumentData([
      { tipo: 'Certificato Medico', totale: 45, validi: 38, scaduti: 4, inScadenza: 3 },
      { tipo: 'Documento Identità', totale: 45, validi: 43, scaduti: 1, inScadenza: 1 },
      { tipo: 'Codice Fiscale', totale: 45, validi: 45, scaduti: 0, inScadenza: 0 }
    ]);
  };

  const handleExport = (type) => {
    let data = [];
    let filename = '';

    switch (activeReport) {
      case 'attendance':
        data = attendanceData;
        filename = 'report_presenze';
        break;
      case 'payments':
        data = paymentData;
        filename = 'report_pagamenti';
        break;
      case 'documents':
        data = documentData;
        filename = 'report_documenti';
        break;
    }

    if (type === 'csv') {
      exportService.exportToCSV(data, filename);
      toast.success('Report esportato in CSV');
    } else if (type === 'pdf') {
      // Per ora solo simulato
      toast.success('Export PDF in arrivo (funzione da completare)');
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Preparazione stampa...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Report</h1>
              <p className="text-gray-600">Analizza i dati della tua società</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <PrinterIcon className="h-5 w-5" />
              <span>Stampa</span>
            </button>
          </div>
        </div>

        {/* Filtro date */}
        <div className="mt-4 flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data inizio</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data fine</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="pt-6">
            <button
              onClick={loadReportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aggiorna
            </button>
          </div>
        </div>
      </div>

      {/* Tab Report */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveReport('attendance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeReport === 'attendance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UsersIcon className="h-5 w-5 inline mr-2" />
              Presenze
            </button>
            <button
              onClick={() => setActiveReport('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeReport === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CurrencyEuroIcon className="h-5 w-5 inline mr-2" />
              Pagamenti
            </button>
            <button
              onClick={() => setActiveReport('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeReport === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Documenti
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Report Presenze */}
          {activeReport === 'attendance' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Report Presenze Allenamenti</h2>
              
              {/* Statistiche riassuntive */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Media Presenze</p>
                  <p className="text-2xl font-bold text-blue-900">85%</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Sempre Presenti</p>
                  <p className="text-2xl font-bold text-green-900">12</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Assenze Frequenti</p>
                  <p className="text-2xl font-bold text-yellow-900">3</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Totale Allenamenti</p>
                  <p className="text-2xl font-bold text-purple-900">15</p>
                </div>
              </div>

              {/* Tabella presenze */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atleta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Squadra</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Presenze</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Assenze</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Percentuale</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((row, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{row.athlete}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.team}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-green-600 font-medium">{row.presenze}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-red-600 font-medium">{row.assenze}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              row.percentuale >= 90 ? 'bg-green-100 text-green-800' :
                              row.percentuale >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {row.percentuale}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report Pagamenti */}
          {activeReport === 'payments' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Report Pagamenti</h2>
              
              {/* Statistiche riassuntive */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Totale Dovuto</p>
                  <p className="text-2xl font-bold text-blue-900">€15.000</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Totale Incassato</p>
                  <p className="text-2xl font-bold text-green-900">€12.500</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Da Incassare</p>
                  <p className="text-2xl font-bold text-red-900">€2.500</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Tasso Incasso</p>
                  <p className="text-2xl font-bold text-purple-900">83%</p>
                </div>
              </div>

              {/* Grafico semplice */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Andamento Mensile</h3>
                <div className="space-y-3">
                  {paymentData.map((month, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{month.mese}</span>
                        <span>€{month.incassato} / €{month.dovuto}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div 
                          className="bg-blue-600 h-6 rounded-full flex items-center justify-center text-xs text-white"
                          style={{ width: `${month.percentuale}%` }}
                        >
                          {month.percentuale}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lista morosi */}
              <div>
                <h3 className="font-medium mb-3">Atleti con Pagamenti in Sospeso</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Mario Rossi</span>
                      <span className="text-red-600 font-medium">€150 (2 mesi)</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Giovanni Bianchi</span>
                      <span className="text-red-600 font-medium">€100 (1 mese)</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Paolo Verdi</span>
                      <span className="text-red-600 font-medium">€50 (1 mese)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Report Documenti */}
          {activeReport === 'documents' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Report Documenti</h2>
              
              {/* Statistiche riassuntive */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Documenti Validi</p>
                  <p className="text-2xl font-bold text-green-900">126</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">In Scadenza</p>
                  <p className="text-2xl font-bold text-yellow-900">4</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Scaduti</p>
                  <p className="text-2xl font-bold text-red-900">5</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Completezza</p>
                  <p className="text-2xl font-bold text-blue-900">93%</p>
                </div>
              </div>

              {/* Tabella per tipo documento */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Documento</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Totale</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Validi</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">In Scadenza</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Scaduti</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documentData.map((doc, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{doc.tipo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{doc.totale}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-green-600 font-medium">{doc.validi}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-yellow-600 font-medium">{doc.inScadenza}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-red-600 font-medium">{doc.scaduti}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Lista documenti in scadenza */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Documenti in Scadenza nei Prossimi 30 Giorni</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Mario Rossi - Certificato Medico</span>
                      <span className="text-yellow-600 font-medium">Scade tra 5 giorni</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Luigi Verdi - Certificato Medico</span>
                      <span className="text-yellow-600 font-medium">Scade tra 15 giorni</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Giovanni Bianchi - Documento Identità</span>
                      <span className="text-yellow-600 font-medium">Scade tra 28 giorni</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
