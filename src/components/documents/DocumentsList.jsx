import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FiDownload, FiEye, FiCheckCircle, FiTrash2, FiAlertTriangle } from 'react-icons/fi';

function DocumentsList({ documents, onVerify, onDelete, getStatusBadge }) {
  const calculateDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">Nessun documento trovato</p>
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
                Documento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Atleta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scadenza
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verificato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => {
              const daysUntilExpiry = calculateDaysUntilExpiry(doc.expiryDate);
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
              const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

              return (
                <tr key={doc.id} className={isExpired ? 'bg-red-50' : isExpiringSoon ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {doc.fileName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(doc.fileSize)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {doc.athlete?.firstName} {doc.athlete?.lastName}
                    </div>
                    {doc.athlete?.fiscalCode && (
                      <div className="text-xs text-gray-500">
                        CF: {doc.athlete.fiscalCode}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {doc.type?.name}
                    </div>
                    {doc.type?.isRequired && (
                      <span className="text-xs text-red-600">Obbligatorio</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.expiryDate ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {format(new Date(doc.expiryDate), 'dd/MM/yyyy', { locale: it })}
                        </div>
                        {daysUntilExpiry !== null && (
                          <div className={`text-xs ${
                            isExpired ? 'text-red-600 font-bold' :
                            isExpiringSoon ? 'text-yellow-600 font-bold' :
                            'text-gray-500'
                          }`}>
                            {isExpired ? 
                              `Scaduto da ${Math.abs(daysUntilExpiry)} giorni` :
                              `${daysUntilExpiry} giorni`
                            }
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.isVerified ? (
                      <div className="flex items-center text-green-600">
                        <FiCheckCircle className="mr-1" />
                        <span className="text-sm">Verificato</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onVerify(doc)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Verifica
                      </button>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                        title="Visualizza"
                      >
                        <FiEye className="text-lg" />
                      </a>
                      <a
                        href={doc.fileUrl}
                        download={doc.fileName}
                        className="text-green-600 hover:text-green-900"
                        title="Scarica"
                      >
                        <FiDownload className="text-lg" />
                      </a>
                      {!doc.isVerified && (
                        <button
                          onClick={() => onDelete(doc)}
                          className="text-red-600 hover:text-red-900"
                          title="Elimina"
                        >
                          <FiTrash2 className="text-lg" />
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

export default DocumentsList;