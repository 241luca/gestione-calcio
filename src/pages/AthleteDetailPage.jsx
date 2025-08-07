import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  UserIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { athleteService } from '../services/api';
import { exportService } from '../services/exportService';
import toast from 'react-hot-toast';

const AthleteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAthlete();
  }, [id]);

  const loadAthlete = async () => {
    try {
      setLoading(true);
      const response = await athleteService.getById(id);
      if (response.success && response.data) {
        setAthlete(response.data);
      }
    } catch (error) {
      toast.error('Errore nel caricamento dei dati');
      navigate('/athletes');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('it-IT');
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'INJURED': 'bg-red-100 text-red-800',
      'SUSPENDED': 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      'ACTIVE': 'Attivo',
      'INACTIVE': 'Inattivo',
      'INJURED': 'Infortunato',
      'SUSPENDED': 'Sospeso'
    };
    
    return (
      <span className={`px-3 py-1 text-sm rounded-full font-medium ${badges[status] || badges['INACTIVE']}`}>
        {labels[status] || status}
      </span>
    );
  };

  const checkCertificateStatus = () => {
    if (!athlete?.medicalCertificateExpiry) return null;
    
    const expiry = new Date(athlete.medicalCertificateExpiry);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', message: 'Certificato scaduto', color: 'text-red-600' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', message: `Scade tra ${daysUntilExpiry} giorni`, color: 'text-yellow-600' };
    }
    return { status: 'valid', message: 'Certificato valido', color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Atleta non trovato</p>
          <Link to="/athletes" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Torna alla lista
          </Link>
        </div>
      </div>
    );
  }

  const certificateStatus = checkCertificateStatus();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/athletes')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Torna alla lista atleti
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {athlete.firstName} {athlete.lastName}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              {getStatusBadge(athlete.status)}
              <span className="text-gray-600">
                {calculateAge(athlete.birthDate)} anni
              </span>
              {athlete.fiscalCode && (
                <span className="text-gray-600">
                  CF: {athlete.fiscalCode}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportService.printAthleteDetail(athlete)}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              title="Stampa scheda"
            >
              <PrinterIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Stampa</span>
            </button>
            <button
              onClick={() => {
                const subject = `Scheda Atleta: ${athlete.firstName} ${athlete.lastName}`;
                const body = `Informazioni atleta:\n\nNome: ${athlete.firstName} ${athlete.lastName}\nData di nascita: ${formatDate(athlete.birthDate)}\nCodice Fiscale: ${athlete.fiscalCode || 'N/D'}\n\nContatti:\nEmail: ${athlete.email || 'N/D'}\nTelefono: ${athlete.phone || 'N/D'}`;
                exportService.shareViaEmail(subject, body);
              }}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              title="Condividi"
            >
              <ShareIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Condividi</span>
            </button>
            <Link
              to={`/athletes/${id}/edit`}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PencilIcon className="w-5 h-5 mr-2" />
              Modifica
            </Link>
          </div>
        </div>
      </div>

      {/* Avvisi */}
      {certificateStatus && certificateStatus.status !== 'valid' && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="ml-3">
              <p className={`font-medium ${certificateStatus.color}`}>
                {certificateStatus.message}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Scadenza: {formatDate(athlete.medicalCertificateExpiry)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid di informazioni */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dati Anagrafici */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati Anagrafici</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Nome completo</p>
                <p className="font-medium">{athlete.firstName} {athlete.lastName}</p>
              </div>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Data di nascita</p>
                <p className="font-medium">{formatDate(athlete.birthDate)} ({calculateAge(athlete.birthDate)} anni)</p>
              </div>
            </div>
            {athlete.fiscalCode && (
              <div className="flex items-center">
                <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Codice Fiscale</p>
                  <p className="font-medium">{athlete.fiscalCode}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contatti */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contatti</h2>
          <div className="space-y-3">
            {athlete.email && (
              <div className="flex items-center">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href={`mailto:${athlete.email}`} className="font-medium text-blue-600 hover:text-blue-700">
                    {athlete.email}
                  </a>
                </div>
              </div>
            )}
            {athlete.phone && (
              <div className="flex items-center">
                <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Telefono</p>
                  <a href={`tel:${athlete.phone}`} className="font-medium text-blue-600 hover:text-blue-700">
                    {athlete.phone}
                  </a>
                </div>
              </div>
            )}
            {(athlete.address || athlete.city) && (
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Indirizzo</p>
                  <p className="font-medium">
                    {athlete.address && <span>{athlete.address}</span>}
                    {athlete.address && athlete.city && <span>, </span>}
                    {athlete.city && <span>{athlete.city}</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dati Genitore */}
        {(athlete.parentName || athlete.parentPhone || athlete.parentEmail) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Genitore/Tutore</h2>
            <div className="space-y-3">
              {athlete.parentName && (
                <div className="flex items-center">
                  <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-medium">{athlete.parentName}</p>
                  </div>
                </div>
              )}
              {athlete.parentEmail && (
                <div className="flex items-center">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a href={`mailto:${athlete.parentEmail}`} className="font-medium text-blue-600 hover:text-blue-700">
                      {athlete.parentEmail}
                    </a>
                  </div>
                </div>
              )}
              {athlete.parentPhone && (
                <div className="flex items-center">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Telefono</p>
                    <a href={`tel:${athlete.parentPhone}`} className="font-medium text-blue-600 hover:text-blue-700">
                      {athlete.parentPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certificato Medico */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificato Medico</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Data rilascio</p>
              <p className="font-medium">{formatDate(athlete.medicalCertificateDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data scadenza</p>
              <p className={`font-medium ${certificateStatus?.color || 'text-gray-900'}`}>
                {formatDate(athlete.medicalCertificateExpiry)}
              </p>
            </div>
            {certificateStatus && (
              <div>
                <p className="text-sm text-gray-600">Stato</p>
                <p className={`font-medium ${certificateStatus.color}`}>
                  {certificateStatus.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note */}
      {athlete.notes && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{athlete.notes}</p>
        </div>
      )}

      {/* Azioni rapide */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Carica Documento
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
            <CurrencyEuroIcon className="w-5 h-5 mr-2" />
            Registra Pagamento
          </button>
          <button className="flex items-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Visualizza Presenze
          </button>
        </div>
      </div>
    </div>
  );
};

export default AthleteDetailPage;
