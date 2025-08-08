import React from 'react';
import { FiDollarSign, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';

function PaymentStats({ stats }) {
  if (!stats) {
    return null;
  }

  const collectionRate = stats.monthlyCollected && stats.monthlyExpected 
    ? ((stats.monthlyCollected / stats.monthlyExpected) * 100).toFixed(1)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {/* Incassi del mese */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Incassi Mese</p>
            <p className="text-2xl font-bold text-green-600">
              €{(stats.monthlyCollected || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              su €{(stats.monthlyExpected || 0).toFixed(2)}
            </p>
          </div>
          <FiDollarSign className="text-green-500 text-3xl" />
        </div>
        {/* Progress bar */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">{collectionRate}% riscosso</p>
        </div>
      </div>

      {/* In attesa */}
      <div className="bg-yellow-50 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-600">In Attesa</p>
            <p className="text-2xl font-bold text-yellow-700">
              {stats.pendingCount || 0}
            </p>
            <p className="text-xs text-yellow-600">
              €{(stats.pendingAmount || 0).toFixed(2)}
            </p>
          </div>
          <FiClock className="text-yellow-500 text-3xl" />
        </div>
      </div>

      {/* Scaduti */}
      <div className="bg-red-50 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-600">Scaduti</p>
            <p className="text-2xl font-bold text-red-700">
              {stats.overdueCount || 0}
            </p>
            <p className="text-xs text-red-600">
              €{(stats.overdueAmount || 0).toFixed(2)}
            </p>
          </div>
          <FiAlertCircle className="text-red-500 text-3xl" />
        </div>
      </div>

      {/* Pagati */}
      <div className="bg-green-50 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600">Pagati</p>
            <p className="text-2xl font-bold text-green-700">
              {stats.paidCount || 0}
            </p>
            <p className="text-xs text-green-600">
              questo mese
            </p>
          </div>
          <FiCheckCircle className="text-green-500 text-3xl" />
        </div>
      </div>

      {/* Trend */}
      <div className="bg-blue-50 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600">Trend</p>
            <p className="text-2xl font-bold text-blue-700">
              {stats.trend > 0 ? '+' : ''}{(stats.trend || 0).toFixed(1)}%
            </p>
            <p className="text-xs text-blue-600">
              vs mese scorso
            </p>
          </div>
          <FiTrendingUp className={`text-3xl ${stats.trend >= 0 ? 'text-blue-500' : 'text-red-500 rotate-180'}`} />
        </div>
      </div>
    </div>
  );
}

export default PaymentStats;