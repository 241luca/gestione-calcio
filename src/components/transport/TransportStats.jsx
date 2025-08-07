import React from 'react';
import { FaChartBar, FaBus, FaRoute, FaUsers, FaSyncAlt } from 'react-icons/fa';

function TransportStats({ stats, onRefresh }) {
  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Statistiche Trasporti</h2>
          <p className="text-sm text-gray-600 mt-1">
            Analisi e report sull'utilizzo dei trasporti
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <FaSyncAlt />
          Aggiorna
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Viaggi Totali</h3>
            <FaBus className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">{stats.totalSchedules || 0}</p>
          <p className="text-sm opacity-90 mt-1">programmati questo mese</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Prenotazioni Totali</h3>
            <FaUsers className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">{stats.totalBookings || 0}</p>
          <p className="text-sm opacity-90 mt-1">atleti trasportati</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Media Occupazione</h3>
            <FaChartBar className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">{stats.averageOccupancy || 0}</p>
          <p className="text-sm opacity-90 mt-1">atleti per viaggio</p>
        </div>
      </div>

      {/* Routes Usage */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaRoute className="text-blue-500" />
          Utilizzo Percorsi
        </h3>
        {stats.routeUsage && stats.routeUsage.length > 0 ? (
          <div className="space-y-3">
            {stats.routeUsage.map((route) => (
              <div key={route.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{route.name}</span>
                    <span className="text-sm text-gray-600">{route.usageCount} viaggi</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(route.usageCount / Math.max(...stats.routeUsage.map(r => r.usageCount))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Nessun dato disponibile</p>
        )}
      </div>

      {/* Top Travelers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaUsers className="text-green-500" />
          Atleti Frequenti
        </h3>
        {stats.topTravelers && stats.topTravelers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.topTravelers.map((traveler, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {traveler.athlete ? 
                        `${traveler.athlete.firstName} ${traveler.athlete.lastName}` : 
                        'Atleta sconosciuto'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {traveler.tripCount} viaggi
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {traveler.tripCount} 🚌
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Nessun dato disponibile</p>
        )}
      </div>
    </div>
  );
}

export default TransportStats;
