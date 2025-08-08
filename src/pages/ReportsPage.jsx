import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [attendanceData, setAttendanceData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [athleteStats, setAthleteStats] = useState({});
  const [paymentStats, setPaymentStats] = useState({});

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Dati di esempio per i grafici
      // In produzione questi verranno dal backend
      
      // Dati presenze mensili
      const mockAttendanceData = [
        { month: 'Gen', presenze: 85, assenze: 15 },
        { month: 'Feb', presenze: 88, assenze: 12 },
        { month: 'Mar', presenze: 82, assenze: 18 },
        { month: 'Apr', presenze: 90, assenze: 10 },
        { month: 'Mag', presenze: 87, assenze: 13 },
        { month: 'Giu', presenze: 92, assenze: 8 },
      ];
      setAttendanceData(mockAttendanceData);

      // Dati incassi
      const mockRevenueData = [
        { month: 'Gen', incassi: 4500, dovuti: 5000 },
        { month: 'Feb', incassi: 4800, dovuti: 5000 },
        { month: 'Mar', incassi: 4200, dovuti: 5000 },
        { month: 'Apr', incassi: 4900, dovuti: 5000 },
        { month: 'Mag', incassi: 4600, dovuti: 5000 },
        { month: 'Giu', incassi: 5000, dovuti: 5000 },
      ];
      setRevenueData(mockRevenueData);

      // Statistiche atleti
      setAthleteStats({
        total: 45,
        active: 40,
        injured: 3,
        suspended: 2,
        byCategory: [
          { name: 'Under 10', value: 12, color: '#3B82F6' },
          { name: 'Under 12', value: 15, color: '#10B981' },
          { name: 'Under 14', value: 10, color: '#F59E0B' },
          { name: 'Under 16', value: 8, color: '#EF4444' },
        ]
      });

      // Statistiche pagamenti
      try {
        const paymentsResponse = await api.get('/payments/stats');
        if (paymentsResponse.data.success) {
          setPaymentStats(paymentsResponse.data.data);
        }
      } catch (error) {
        console.log('Stats pagamenti non disponibili');
      }

    } catch (error) {
      console.error('Errore caricamento report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    alert('Funzione export PDF in sviluppo');
  };

  const exportExcel = () => {
    alert('Funzione export Excel in sviluppo');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report e Analytics</h1>
          <p className="text-gray-600 mt-1">Analizza le performance della tua società</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export PDF
          </button>
          <button
            onClick={exportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filtri Periodo */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Ultima Settimana</option>
            <option value="month">Ultimo Mese</option>
            <option value="quarter">Ultimo Trimestre</option>
            <option value="year">Ultimo Anno</option>
          </select>
        </div>
      </div>

      {/* Statistiche Riepilogo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Atleti Totali</p>
              <p className="text-2xl font-bold text-gray-900">{athleteStats.total}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasso Presenze</p>
              <p className="text-2xl font-bold text-green-600">87%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Incassi Mese</p>
              <p className="text-2xl font-bold text-gray-900">€4,600</p>
            </div>
            <CurrencyEuroIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasso Pagamento</p>
              <p className="text-2xl font-bold text-purple-600">92%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafico Presenze Mensili */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Presenze Mensili</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="presenze" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Presenze"
              />
              <Line 
                type="monotone" 
                dataKey="assenze" 
                stroke="#EF4444"
                strokeWidth={2}
                name="Assenze"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grafico Incassi */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Incassi Mensili</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `€${value}`} />
              <Legend />
              <Bar dataKey="incassi" fill="#10B981" name="Incassi" />
              <Bar dataKey="dovuti" fill="#FCA5A5" name="Dovuti" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuzione Atleti per Categoria */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Distribuzione per Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={athleteStats.byCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {athleteStats.byCategory?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Trend Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { month: 'Gen', performance: 72 },
              { month: 'Feb', performance: 75 },
              { month: 'Mar', performance: 78 },
              { month: 'Apr', performance: 82 },
              { month: 'Mag', performance: 85 },
              { month: 'Giu', performance: 88 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="performance" 
                stroke="#8B5CF6"
                strokeWidth={2}
                name="Performance Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabella Dettagli */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Dettagli Mensili</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mese
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atleti Attivi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Presenze Media
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incassi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasso Pagamento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueData.map((month, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {month.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {athleteStats.active}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attendanceData[index]?.presenze}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    €{month.incassi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round((month.incassi / month.dovuti) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
