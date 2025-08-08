import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { toast } from 'react-hot-toast';
import { FiX, FiDollarSign, FiCalendar, FiUser, FiUsers } from 'react-icons/fi';
import { paymentsAPI, athletesAPI } from '../../services/api';

function PaymentForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    athleteId: '',
    typeId: '',
    amount: '',
    dueDate: '',
    description: '',
    createForAll: false
  });
  const [creating, setCreating] = useState(false);

  // Recupera lista atleti
  const { data: athletesData } = useQuery('athletes-payment', 
    () => athletesAPI.getAthletes({ limit: 1000, status: 'ACTIVE' })
  );

  // Recupera tipi di pagamento
  const { data: paymentTypes } = useQuery('payment-types',
    () => paymentsAPI.getPaymentTypes()
  );

  // Mutation per creare pagamento
  const createMutation = useMutation(
    (data) => paymentsAPI.createPayment(data),
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || 'Errore nella creazione del pagamento');
        setCreating(false);
      }
    }
  );

  // Mutation per creare pagamenti multipli
  const bulkCreateMutation = useMutation(
    (data) => paymentsAPI.createBulkPayments(data),
    {
      onSuccess: (result) => {
        toast.success(`Creati ${result.created} pagamenti!`);
        onSuccess();
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || 'Errore nella creazione dei pagamenti');
        setCreating(false);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.typeId) {
      toast.error('Seleziona il tipo di pagamento');
      return;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Inserisci un importo valido');
      return;
    }
    
    if (!formData.dueDate) {
      toast.error('Seleziona la data di scadenza');
      return;
    }

    setCreating(true);

    if (formData.createForAll) {
      // Crea pagamento per tutti gli atleti attivi
      const activeAthletes = athletes.filter(a => a.status === 'ACTIVE');
      
      if (activeAthletes.length === 0) {
        toast.error('Nessun atleta attivo trovato');
        setCreating(false);
        return;
      }

      const payments = activeAthletes.map(athlete => ({
        athleteId: athlete.id,
        typeId: parseInt(formData.typeId),
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        description: formData.description || `Pagamento ${selectedType?.name || ''}`
      }));

      bulkCreateMutation.mutate(payments);
    } else {
      // Crea pagamento singolo
      if (!formData.athleteId) {
        toast.error('Seleziona un atleta');
        setCreating(false);
        return;
      }

      createMutation.mutate({
        athleteId: formData.athleteId,
        typeId: parseInt(formData.typeId),
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        description: formData.description
      });
    }
  };

  const athletes = athletesData?.data?.athletes || [];
  const types = paymentTypes?.data || [];
  const selectedType = types.find(t => t.id === parseInt(formData.typeId));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Crea Nuovo Pagamento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Opzione pagamento multiplo */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.createForAll}
                onChange={(e) => setFormData({ ...formData, createForAll: e.target.checked })}
                className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-700">
                  <FiUsers className="inline mr-1" />
                  Crea per tutti gli atleti attivi
                </span>
                <p className="text-sm text-gray-500">
                  Verrà creato un pagamento per ogni atleta attivo ({athletes.filter(a => a.status === 'ACTIVE').length} atleti)
                </p>
              </div>
            </label>
          </div>

          {/* Selezione Atleta (solo se non è per tutti) */}
          {!formData.createForAll && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiUser className="inline mr-1" />
                Atleta *
              </label>
              <select
                value={formData.athleteId}
                onChange={(e) => setFormData({ ...formData, athleteId: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required={!formData.createForAll}
              >
                <option value="">Seleziona un atleta...</option>
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.firstName} {athlete.lastName}
                    {athlete.fiscalCode && ` - ${athlete.fiscalCode}`}
                    {athlete.status !== 'ACTIVE' && ` (${athlete.status})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Pagamento *
            </label>
            <select
              value={formData.typeId}
              onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleziona tipo...</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                  {type.defaultAmount && ` (€${type.defaultAmount})`}
                </option>
              ))}
            </select>
          </div>

          {/* Importo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiDollarSign className="inline mr-1" />
              Importo (€) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder={selectedType?.defaultAmount ? `Default: €${selectedType.defaultAmount}` : '0.00'}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            {selectedType?.defaultAmount && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, amount: selectedType.defaultAmount })}
                className="text-sm text-blue-600 hover:text-blue-800 mt-1"
              >
                Usa importo default (€{selectedType.defaultAmount})
              </button>
            )}
          </div>

          {/* Data Scadenza */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiCalendar className="inline mr-1" />
              Data Scadenza *
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Descrizione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Descrizione aggiuntiva (opzionale)"
            />
          </div>

          {/* Riepilogo se per tutti */}
          {formData.createForAll && formData.amount && formData.typeId && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Riepilogo</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Atleti coinvolti: {athletes.filter(a => a.status === 'ACTIVE').length}</p>
                <p>• Importo per atleta: €{parseFloat(formData.amount || 0).toFixed(2)}</p>
                <p className="font-bold text-gray-900">
                  • Totale da incassare: €{(parseFloat(formData.amount || 0) * athletes.filter(a => a.status === 'ACTIVE').length).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Pulsanti */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={creating}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={creating}
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creazione...
                </>
              ) : (
                <>
                  <FiDollarSign className="mr-2" />
                  {formData.createForAll ? 'Crea Pagamenti' : 'Crea Pagamento'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentForm;