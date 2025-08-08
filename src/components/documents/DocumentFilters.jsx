import React from 'react';
import { useQuery } from 'react-query';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { documentsAPI, athletesAPI } from '../../services/api';

function DocumentFilters({ filters, onFiltersChange }) {
  // Recupera lista atleti per filtro
  const { data: athletesData } = useQuery('athletes-filter', 
    () => athletesAPI.getAthletes({ limit: 1000 })
  );

  // Recupera tipi di documento per filtro
  const { data: documentTypes } = useQuery('document-types',
    () => documentsAPI.getDocumentTypes()
  );

  const athletes = athletesData?.data?.athletes || [];
  const types = documentTypes?.data || [];

  const handleFilterChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      athleteId: '',
      typeId: '',
      status: '',
      search: ''
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center mb-3">
        <FiFilter className="text-gray-500 mr-2" />
        <h3 className="font-medium text-gray-700">Filtri</h3>
        {(filters.athleteId || filters.typeId || filters.search) && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            Pulisci filtri
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ricerca testuale */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Cerca</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Nome file, note..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filtro per atleta */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Atleta</label>
          <select
            value={filters.athleteId}
            onChange={(e) => handleFilterChange('athleteId', e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli atleti</option>
            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.firstName} {athlete.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro per tipo documento */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tipo Documento</label>
          <select
            value={filters.typeId}
            onChange={(e) => handleFilterChange('typeId', e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti i tipi</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro per stato */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Stato</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli stati</option>
            <option value="VALID">Validi</option>
            <option value="EXPIRING">In scadenza</option>
            <option value="EXPIRED">Scaduti</option>
            <option value="NOT_VERIFIED">Da verificare</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default DocumentFilters;