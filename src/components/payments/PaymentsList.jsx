import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FiDollarSign, FiCheck, FiAlertTriangle, FiClock, FiDownload } from 'react-icons/fi';

function PaymentsList({ payments, onRecordPayment, onGenerateReceipt }) {
  const getStatusBadge = (status, paidAmount, amount) => {
    const badges = {
      PAID: { 
        color: 'bg-green-100 text-green-800', 
        icon: FiCheck, 
        text: 'Pagato' 
      },
      PARTIAL: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: FiDollarSign, 
        text: `Parziale (€${paidAmount}/${amount})` 
      },
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: FiClock, 
        text: 'In attesa' 
      },
      OVERDUE: { 
        color: 'bg-red-100 text-red-800', 
        icon: FiAlertTriangle, 
        text: 'Scaduto' 
      },
      CANCELLED: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: FiClock, 
        text: 'Annullato' 
      }
    };
    
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="mr-1 h-3 w-3" />
        {status === 'PARTIAL' ? badges.PARTIAL.text : badge.text}
      </span>
    );
  };

  const calculateDaysOverdue = (dueDate, status) => {
    if (status !== 'OVERDUE') return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <FiDollarSign className="mx-auto text-gray-400 text-5xl mb-3" />
        <p className="text-gray-500">Nessun pagamento trovato</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
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
                Pagato il
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => {
              const daysOverdue = calculateDaysOverdue(payment.dueDate, payment.status);
              const isOverdue = payment.status === 'OVERDUE';
              const isPending = payment.status === 'PENDING';
              const isPartial = payment.status === 'PARTIAL';

              return (
                <tr key={payment.id} className={isOverdue ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.athlete?.firstName} {payment.athlete?.lastName}
                      </div>
                      {payment.athlete?.fiscalCode && (
                        <div className="text-xs text-gray-500">
                          CF: {payment.athlete.fiscalCode}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.type?.name || payment.description}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      €{payment.amount.toFixed(2)}
                    </div>
                    {payment.paidAmount > 0 && payment.paidAmount < payment.amount && (
                      <div className="text-xs text-blue-600">
                        Pagato: €{payment.paidAmount.toFixed(2)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {format(new Date(payment.dueDate), 'dd/MM/yyyy', { locale: it })}
                      </div>
                      {daysOverdue && (
                        <div className="text-xs text-red-600 font-bold">
                          Scaduto da {daysOverdue} giorni
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status, payment.paidAmount, payment.amount)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.paidAt ? (
                      <div className="text-sm text-gray-900">
                        {format(new Date(payment.paidAt), 'dd/MM/yyyy', { locale: it })}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {(isPending || isOverdue || isPartial) && (
                        <button
                          onClick={() => onRecordPayment(payment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Registra pagamento"
                        >
                          <FiDollarSign className="text-lg" />
                        </button>
                      )}
                      {payment.status === 'PAID' && (
                        <button
                          onClick={() => onGenerateReceipt(payment)}
                          className="text-green-600 hover:text-green-900"
                          title="Genera ricevuta"
                        >
                          <FiDownload className="text-lg" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaymentsList;