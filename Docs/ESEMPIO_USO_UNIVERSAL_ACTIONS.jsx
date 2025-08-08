// ESEMPIO DI UTILIZZO DEL COMPONENTE UniversalActions
// Questo esempio mostra come integrare il componente in una pagina esistente

import React, { useState, useEffect } from 'react';
import UniversalActions from '../components/common/UniversalActions';
import { athleteService } from '../services/api';

function AthletesPageExample() {
  const [athletes, setAthletes] = useState([]);
  const [selectedAthletes, setSelectedAthletes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);

  // Configurazione export
  const exportConfig = {
    fields: [
      { key: 'firstName', label: 'Nome' },
      { key: 'lastName', label: 'Cognome' },
      { key: 'fiscalCode', label: 'Codice Fiscale' },
      { key: 'birthDate', label: 'Data Nascita' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telefono' },
      { key: 'team', label: 'Squadra' },
      { key: 'status', label: 'Stato' }
    ],
    filename: 'atleti',
    title: 'Report Atleti ASD Juventus Academy Milano'
  };

  // Handler CRUD
  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleEdit = (athlete) => {
    setEditingAthlete(athlete);
    setShowEditModal(true);
  };

  const handleDelete = async (athletesToDelete) => {
    try {
      // Chiamata API per eliminare
      for (const athlete of athletesToDelete) {
        await athleteService.delete(athlete.id);
      }
      
      // Aggiorna lista locale
      setAthletes(athletes.filter(a => !athletesToDelete.includes(a)));
      setSelectedAthletes([]);
      
      toast.success(`${athletesToDelete.length} atleti eliminati`);
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  return (
    <div className="p-6">
      {/* Header con UniversalActions */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Gestione Atleti</h1>
          
          {/* COMPONENTE UNIVERSALE - Variante Toolbar */}
          <UniversalActions
            entityName="atleta"
            entityNamePlural="atleti"
            selectedItems={selectedAthletes}
            allItems={athletes}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            exportConfig={exportConfig}
            variant="toolbar"
          />
        </div>
      </div>

      {/* Tabella Atleti */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAthletes(athletes);
                    } else {
                      setSelectedAthletes([]);
                    }
                  }}
                />
              </th>
              <th className="px-6 py-3 text-left">Nome</th>
              <th className="px-6 py-3 text-left">Squadra</th>
              <th className="px-6 py-3 text-left">Stato</th>
              <th className="px-6 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete) => (
              <tr key={athlete.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedAthletes.includes(athlete)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAthletes([...selectedAthletes, athlete]);
                      } else {
                        setSelectedAthletes(selectedAthletes.filter(a => a.id !== athlete.id));
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-4">
                  {athlete.firstName} {athlete.lastName}
                </td>
                <td className="px-6 py-4">{athlete.team?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    athlete.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    athlete.status === 'INJURED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {athlete.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {/* COMPONENTE UNIVERSALE - Variante Dropdown per singola riga */}
                  <UniversalActions
                    entityName="atleta"
                    entityNamePlural="atleti"
                    selectedItems={[athlete]}
                    allItems={[athlete]}
                    onEdit={() => handleEdit(athlete)}
                    onDelete={() => handleDelete([athlete])}
                    showAdd={false}
                    exportConfig={{
                      ...exportConfig,
                      title: `Scheda ${athlete.firstName} ${athlete.lastName}`
                    }}
                    variant="dropdown"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AthletesPageExample;
