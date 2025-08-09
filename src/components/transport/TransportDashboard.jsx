import React, { useState } from 'react';
import { FaBus, FaMapMarkedAlt, FaCalendarAlt, FaTicketAlt, FaChartBar } from 'react-icons/fa';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useApiData } from '../../hooks/useApiData';
import TransportZoneManager from './TransportZoneManager';
import TransportRouteList from './TransportRouteList';
import TransportScheduleCalendar from './TransportScheduleCalendar';
import TransportBookingList from './TransportBookingList';
import TransportStats from './TransportStats';

function TransportDashboard() {
  const [activeTab, setActiveTab] = useState('zones');
  
  // Hook per recuperare statistiche dal backend
  const { data: statsData, loading, error, refetch } = useApiData('/transport/stats');
  const stats = statsData || {
    totalSchedules: 0,
    totalBookings: 0,
    averageOccupancy: 0,
    routeUsage: []
  };

  const tabs = [
    { id: 'zones', label: 'Zone Trasporto', icon: FaMapMarkedAlt },
    { id: 'routes', label: 'Percorsi', icon: FaBus },
    { id: 'schedules', label: 'Programmazione', icon: FaCalendarAlt },
    { id: 'bookings', label: 'Prenotazioni', icon: FaTicketAlt },
    { id: 'stats', label: 'Statistiche', icon: FaChartBar }
  ];

  // Loading state
  if (loading && activeTab === 'stats') {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento statistiche trasporti...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (solo per statistiche, gli altri tab hanno la loro gestione)
  if (error && activeTab === 'stats') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Errore nel caricamento</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={refetch} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestione Trasporti</h1>
        <p className="text-gray-600 mt-2">
          Organizza i trasporti per partite e allenamenti
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Viaggi Totali</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSchedules || 0}
              </p>
            </div>
            <FaCalendarAlt className="text-3xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Prenotazioni</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalBookings || 0}
              </p>
            </div>
            <FaTicketAlt className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Media Occupazione</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageOccupancy || 0}
              </p>
            </div>
            <FaBus className="text-3xl text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Percorsi Attivi</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.routeUsage || []).length}
              </p>
            </div>
            <FaMapMarkedAlt className="text-3xl text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="text-lg" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'zones' && <TransportZoneManager />}
          {activeTab === 'routes' && <TransportRouteList />}
          {activeTab === 'schedules' && <TransportScheduleCalendar />}
          {activeTab === 'bookings' && <TransportBookingList />}
          {activeTab === 'stats' && <TransportStats stats={stats} onRefresh={refetch} />}
        </div>
      </div>
    </div>
  );
}

export default TransportDashboard;