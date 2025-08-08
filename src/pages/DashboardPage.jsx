import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  DocumentTextIcon, 
  CurrencyEuroIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { athleteService } from '../services/api';
import api from '../services/api';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalAthletes: 0,
    activeAthletes: 0,
    documentsExpiring: 0,
    pendingPayments: 0,
    upcomingMatches: 0,
    todayTrainings: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentAthletes, setRecentAthletes] = useState([]);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [overduePayments, setOverduePayments] = useState({ amount: 0, count: 0, payments: [] });
  const [upcomingMatches, setUpcomingMatches] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carica gli atleti per le statistiche
      const athletesResponse = await athleteService.getAll();
      
      if (athletesResponse.success && athletesResponse.data) {
        const athletes = athletesResponse.data.athletes || [];
        
        setStats(prev => ({
          ...prev,
          totalAthletes: athletes.length,
          activeAthletes: athletes.filter(a => a.status === 'ACTIVE').length,
        }));

        // Prendi gli ultimi 5 atleti
        setRecentAthletes(athletes.slice(0, 5));
      }

      // Carica documenti in scadenza
      try {
        const docsResponse = await api.get('/documents/expiring?days=30');
        if (docsResponse.data.success) {
          const docs = docsResponse.data.data || [];
          setExpiringDocs(docs.slice(0, 5)); // Prendi i primi 5
          setStats(prev => ({
            ...prev,
            documentsExpiring: docs.length
          }));
        }
      } catch (error) {
        console.log('Documenti in scadenza non disponibili');
      }

      // Carica pagamenti scaduti
      try {
        const paymentsResponse = await api.get('/payments/overdue');
        if (paymentsResponse.data.success && paymentsResponse.data.data) {
          const overdueData = paymentsResponse.data.data;
          setOverduePayments({
            amount: overdueData.stats?.totalAmount || 0,
            count: overdueData.stats?.count || 0,
            payments: overdueData.payments || []
          });
          setStats(prev => ({
            ...prev,
            pendingPayments: overdueData.stats?.count || 0
          }));
        }
      } catch (error) {
        console.log('Pagamenti scaduti non disponibili');
      }

      // Carica prossime partite
      try {
        const matchesResponse = await api.get('/matches/upcoming?limit=5');
        if (matchesResponse.data.success) {
          const matches = matchesResponse.data.data || [];
          setUpcomingMatches(matches);
          setStats(prev => ({
            ...prev,
            upcomingMatches: matches.length
          }));
        }
      } catch (error) {
        console.log('Partite non disponibili');
      }

    } catch (error) {
      console.error('Errore nel caricamento dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, link }) => (
    <Link to={link} className="block">
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Benvenuto nel sistema di gestione della società calcio</p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Atleti Totali"
          value={stats.totalAthletes}
          icon={UsersIcon}
          color="bg-blue-500"
          link="/athletes"
        />
        <StatCard
          title="Atleti Attivi"
          value={stats.activeAthletes}
          icon={CheckCircleIcon}
          color="bg-green-500"
          link="/athletes"
        />
        <StatCard
          title="Documenti in Scadenza"
          value={stats.documentsExpiring}
          icon={DocumentTextIcon}
          color="bg-yellow-500"
          link="/documents"
        />
        <StatCard
          title="Pagamenti in Sospeso"
          value={stats.pendingPayments}
          icon={CurrencyEuroIcon}
          color="bg-red-500"
          link="/payments"
        />
        <StatCard
          title="Partite Programmate"
          value={stats.upcomingMatches}
          icon={CalendarDaysIcon}
          color="bg-purple-500"
          link="/calendar"
        />
        <StatCard
          title="Allenamenti Oggi"
          value={stats.todayTrainings}
          icon={ClockIcon}
          color="bg-indigo-500"
          link="/calendar"
        />
      </div>

      {/* Widget Avanzati - Prima riga */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Widget Documenti in Scadenza */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Documenti in Scadenza</h3>
            <DocumentTextIcon className="h-6 w-6 text-yellow-500" />
          </div>
          {expiringDocs.length > 0 ? (
            <div className="space-y-3">
              {expiringDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.athlete?.firstName} {doc.athlete?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{doc.type?.name || 'Documento'}</p>
                  </div>
                  <span className="text-xs text-red-600 font-medium">
                    {doc.daysUntilExpiry ? `${doc.daysUntilExpiry}g` : 'Scade oggi'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Nessun documento in scadenza</p>
          )}
          <Link to="/documents" className="mt-4 block text-sm text-blue-600 hover:text-blue-800 font-medium">
            Vedi tutti →
          </Link>
        </div>

        {/* Widget Pagamenti Scaduti */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pagamenti Scaduti</h3>
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            €{overduePayments.amount.toFixed(2)}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {overduePayments.count} pagamenti in ritardo
          </p>
          {overduePayments.payments.length > 0 && (
            <div className="mt-3 space-y-2">
              {overduePayments.payments.slice(0, 3).map(payment => (
                <div key={payment.id} className="text-xs text-gray-600">
                  {payment.athlete?.firstName} {payment.athlete?.lastName} - €{payment.amount}
                </div>
              ))}
            </div>
          )}
          <Link to="/payments" className="mt-4 block text-sm text-blue-600 hover:text-blue-800 font-medium">
            Gestisci pagamenti →
          </Link>
        </div>

        {/* Widget Prossime Partite */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Prossime Partite</h3>
            <CalendarIcon className="h-6 w-6 text-blue-500" />
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.slice(0, 3).map(match => (
                <div key={match.id} className="border-l-4 border-blue-500 pl-3">
                  <p className="text-sm font-medium text-gray-900">
                    {match.homeTeam} vs {match.awayTeam}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(match.date), 'dd MMM HH:mm', { locale: it })}
                  </p>
                  <p className="text-xs text-gray-400">{match.venue}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Nessuna partita programmata</p>
          )}
          <Link to="/calendar" className="mt-4 block text-sm text-blue-600 hover:text-blue-800 font-medium">
            Calendario completo →
          </Link>
        </div>
      </div>

      {/* Sezioni esistenti */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atleti Recenti */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Atleti Recenti</h2>
          </div>
          <div className="p-6">
            {recentAthletes.length > 0 ? (
              <div className="space-y-3">
                {recentAthletes.map((athlete) => (
                  <Link
                    key={athlete.id}
                    to={`/athletes/${athlete.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {athlete.firstName} {athlete.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {athlete.team?.name || 'Nessuna squadra'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      athlete.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {athlete.status === 'ACTIVE' ? 'Attivo' : 'Inattivo'}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nessun atleta registrato</p>
            )}
            <Link
              to="/athletes"
              className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Vedi tutti gli atleti →
            </Link>
          </div>
        </div>

        {/* Avvisi e Notifiche */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Avvisi Importanti</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.documentsExpiring > 0 && (
                <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{stats.documentsExpiring} documenti in scadenza</p>
                    <p className="text-sm text-gray-600">Controlla i documenti degli atleti</p>
                  </div>
                </div>
              )}
              {overduePayments.count > 0 && (
                <div className="flex items-start p-3 bg-red-50 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{overduePayments.count} pagamenti in ritardo</p>
                    <p className="text-sm text-gray-600">Totale: €{overduePayments.amount.toFixed(2)}</p>
                  </div>
                </div>
              )}
              {upcomingMatches.length > 0 && (
                <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <CalendarDaysIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Prossima partita</p>
                    <p className="text-sm text-gray-600">
                      {upcomingMatches[0].homeTeam} vs {upcomingMatches[0].awayTeam}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Azioni Rapide */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/athletes/new"
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <UsersIcon className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Nuovo Atleta</span>
          </Link>
          <Link
            to="/documents/upload"
            className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <DocumentTextIcon className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Carica Documento</span>
          </Link>
          <Link
            to="/payments/new"
            className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <CurrencyEuroIcon className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Registra Pagamento</span>
          </Link>
          <Link
            to="/calendar"
            className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <CalendarDaysIcon className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Calendario</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
