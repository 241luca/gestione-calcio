import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { athleteService } from '../services/api';
import toast from 'react-hot-toast';

const AthleteFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    fiscalCode: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    medicalCertificateDate: '',
    medicalCertificateExpiry: '',
    notes: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (isEdit) {
      loadAthlete();
    }
  }, [id]);

  const loadAthlete = async () => {
    try {
      setLoading(true);
      const response = await athleteService.getById(id);
      if (response.success && response.data) {
        const athlete = response.data;
        setFormData({
          firstName: athlete.firstName || '',
          lastName: athlete.lastName || '',
          birthDate: athlete.birthDate ? athlete.birthDate.split('T')[0] : '',
          fiscalCode: athlete.fiscalCode || '',
          email: athlete.email || '',
          phone: athlete.phone || '',
          address: athlete.address || '',
          city: athlete.city || '',
          postalCode: athlete.postalCode || '',
          parentName: athlete.parentName || '',
          parentPhone: athlete.parentPhone || '',
          parentEmail: athlete.parentEmail || '',
          medicalCertificateDate: athlete.medicalCertificateDate ? athlete.medicalCertificateDate.split('T')[0] : '',
          medicalCertificateExpiry: athlete.medicalCertificateExpiry ? athlete.medicalCertificateExpiry.split('T')[0] : '',
          notes: athlete.notes || '',
          status: athlete.status || 'ACTIVE'
        });
      }
    } catch (error) {
      toast.error('Errore nel caricamento dei dati dell\'atleta');
      navigate('/athletes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validazioni base
    if (!formData.firstName || !formData.lastName) {
      toast.error('Nome e cognome sono obbligatori');
      return;
    }

    if (!formData.birthDate) {
      toast.error('La data di nascita è obbligatoria');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        birthDate: new Date(formData.birthDate).toISOString(),
        medicalCertificateDate: formData.medicalCertificateDate ? new Date(formData.medicalCertificateDate).toISOString() : null,
        medicalCertificateExpiry: formData.medicalCertificateExpiry ? new Date(formData.medicalCertificateExpiry).toISOString() : null
      };

      if (isEdit) {
        await athleteService.update(id, dataToSend);
        toast.success('Atleta aggiornato con successo!');
      } else {
        await athleteService.create(dataToSend);
        toast.success('Atleta creato con successo!');
      }

      navigate('/athletes');
    } catch (error) {
      toast.error(isEdit ? 'Errore nell\'aggiornamento dell\'atleta' : 'Errore nella creazione dell\'atleta');
    } finally {
      setLoading(false);
    }
  };

  // Calcola l'età dall'anno di nascita
  const calculateAge = () => {
    if (!formData.birthDate) return '';
    const today = new Date();
    const birth = new Date(formData.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anni`;
  };

  if (loading && isEdit) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/athletes')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Torna alla lista atleti
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Modifica Atleta' : 'Nuovo Atleta'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEdit ? 'Modifica i dati dell\'atleta' : 'Inserisci i dati del nuovo atleta'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* Dati Anagrafici */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati Anagrafici</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cognome *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rossi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data di Nascita *
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formData.birthDate && (
                <p className="text-sm text-gray-500 mt-1">Età: {calculateAge()}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codice Fiscale
              </label>
              <input
                type="text"
                name="fiscalCode"
                value={formData.fiscalCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="RSSMRA10A01H501Z"
                maxLength="16"
              />
            </div>
          </div>
        </div>

        {/* Contatti */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contatti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="mario.rossi@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="333 1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indirizzo
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Via Roma, 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Città
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Milano"
              />
            </div>
          </div>
        </div>

        {/* Dati Genitore/Tutore */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati Genitore/Tutore</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Genitore
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Giuseppe Rossi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefono Genitore
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="333 9876543"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Genitore
              </label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="giuseppe.rossi@email.com"
              />
            </div>
          </div>
        </div>

        {/* Certificato Medico */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificato Medico</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Rilascio Certificato
              </label>
              <input
                type="date"
                name="medicalCertificateDate"
                value={formData.medicalCertificateDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Scadenza Certificato
              </label>
              <input
                type="date"
                name="medicalCertificateExpiry"
                value={formData.medicalCertificateExpiry}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Note e Stato */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Altre Informazioni</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ACTIVE">Attivo</option>
                <option value="INACTIVE">Inattivo</option>
                <option value="INJURED">Infortunato</option>
                <option value="SUSPENDED">Sospeso</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Eventuali note..."
              />
            </div>
          </div>
        </div>

        {/* Pulsanti */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/athletes')}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvataggio...' : (isEdit ? 'Aggiorna' : 'Crea Atleta')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AthleteFormPage;
