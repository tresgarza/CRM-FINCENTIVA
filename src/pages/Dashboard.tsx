import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, CurrencyDollarIcon, UserGroupIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../utils/constants/roles';

// Componentes de UI
import MainLayout from '../components/layout/MainLayout';
import MetricCard from '../components/ui/charts/MetricCard';
import StatusDistributionChart from '../components/ui/charts/StatusDistributionChart';
import MonthlyApplicationsChart from '../components/ui/charts/MonthlyApplicationsChart';
import AmountRangeChart from '../components/ui/charts/AmountRangeChart';
import AdvisorPerformanceChart from '../components/ui/charts/AdvisorPerformanceChart';

// Servicios
import {
  DashboardStats,
  AdvisorStats,
  CompanyStats,
  getGeneralDashboardStats,
  getAdvisorDashboardStats,
  getCompanyDashboardStats,
} from '../services/dashboardService';

// Interfaces adicionales
interface AmountRange {
  range: string;
  count: number;
}

interface AdvisorPerformance {
  advisor_name: string;
  total_applications: number;
  approved_applications?: number;
}

// Extender las interfaces para agregar propiedades opcionales para el dashboard
interface ExtendedStats {
  applications?: { [key: string]: number };
  previousMonthApproved?: number;
  amountRanges?: AmountRange[];
  advisorPerformance?: AdvisorPerformance[];
}

// Tipo combinado para stats con todas las propiedades posibles
type DashboardStatsType = (DashboardStats | AdvisorStats | CompanyStats) & ExtendedStats;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formatear moneda (pesos)
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  // Comprobar si el objeto es de tipo AdvisorStats
  const isAdvisorStats = (obj: DashboardStatsType): obj is AdvisorStats & ExtendedStats => {
    return 'conversionRate' in obj && typeof obj.conversionRate === 'number';
  };

  // Cargar estadísticas según rol del usuario
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let dashboardData;

        if (user.role === USER_ROLES.ADVISOR) {
          // Estadísticas específicas del asesor
          dashboardData = await getAdvisorDashboardStats(user.id);
        } else if (user.role === USER_ROLES.COMPANY_ADMIN && user.entityId) {
          // Estadísticas específicas de la empresa (entityId contiene el company_id)
          dashboardData = await getCompanyDashboardStats(user.entityId);
        } else {
          // Estadísticas generales para admin del sistema
          dashboardData = await getGeneralDashboardStats();
        }

        // Preparar datos de muestra para los gráficos mientras implementamos los datos reales
        const extendedData: DashboardStatsType = {
          ...dashboardData,
          applications: {
            pending: dashboardData.totalPending,
            approved: dashboardData.totalApproved,
            rejected: dashboardData.totalRejected,
            in_review: dashboardData.totalPending - dashboardData.pendingApproval,
          },
          previousMonthApproved: Math.floor(dashboardData.totalApproved * 0.8), // Simulación
          amountRanges: [
            { range: '0-5,000', count: Math.floor(Math.random() * 30) + 10 },
            { range: '5,001-10,000', count: Math.floor(Math.random() * 25) + 15 },
            { range: '10,001-20,000', count: Math.floor(Math.random() * 20) + 20 },
            { range: '20,001-30,000', count: Math.floor(Math.random() * 15) + 10 },
            { range: '30,001-50,000', count: Math.floor(Math.random() * 10) + 5 },
            { range: '50,001+', count: Math.floor(Math.random() * 5) + 2 },
          ],
          advisorPerformance: [
            { advisor_name: 'Asesor 1', total_applications: Math.floor(Math.random() * 30) + 20, approved_applications: Math.floor(Math.random() * 20) + 10 },
            { advisor_name: 'Asesor 2', total_applications: Math.floor(Math.random() * 30) + 15, approved_applications: Math.floor(Math.random() * 15) + 5 },
            { advisor_name: 'Asesor 3', total_applications: Math.floor(Math.random() * 25) + 10, approved_applications: Math.floor(Math.random() * 10) + 5 },
            { advisor_name: 'Asesor 4', total_applications: Math.floor(Math.random() * 20) + 5, approved_applications: Math.floor(Math.random() * 10) + 2 },
            { advisor_name: 'Asesor 5', total_applications: Math.floor(Math.random() * 15) + 5, approved_applications: Math.floor(Math.random() * 8) + 1 },
          ]
        };

        setStats(extendedData);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('Error al cargar las estadísticas del dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, user]);

  // Si está cargando, mostrar indicador
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full p-8">
          <div className="spinner-border text-primary" role="status">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Si no hay datos, mostrar mensaje
  if (!stats) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="alert alert-info">
            <span>No hay datos disponibles para mostrar en el dashboard.</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

        {/* Tarjetas de métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Solicitudes"
            value={stats.totalApplications}
            icon={<ChartBarIcon className="h-5 w-5" />}
            color="blue"
          />
          <MetricCard
            title="Solicitudes Aprobadas"
            value={stats.applications?.approved || 0}
            previousValue={stats.previousMonthApproved}
            icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />}
            color="green"
          />
          <MetricCard
            title="Monto Promedio"
            value={stats.avgAmount}
            formatValue={formatCurrency}
            icon={<CurrencyDollarIcon className="h-5 w-5" />}
            color="indigo"
          />
          {isAdvisorStats(stats) ? (
            <MetricCard
              title="Tasa de Conversión"
              value={stats.conversionRate}
              isPercentage={true}
              icon={<UserGroupIcon className="h-5 w-5" />}
              color="purple"
            />
          ) : (
            <MetricCard
              title="Total de Clientes"
              value={'totalClients' in stats ? Number(stats.totalClients) : 0}
              icon={<UserGroupIcon className="h-5 w-5" />}
              color="purple"
            />
          )}
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-lg font-semibold">Solicitudes por Mes</h2>
              {/* Validar que applicationsByMonth existe y es un array */}
              {stats.applicationsByMonth && Array.isArray(stats.applicationsByMonth) && (
                <MonthlyApplicationsChart
                  data={stats.applicationsByMonth.map(item => ({
                    month: String(item.month || ''),
                    count: Number(item.count || 0)
                  }))}
                  height={300}
                  title=""
                />
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-lg font-semibold">Distribución por Estado</h2>
              <StatusDistributionChart
                data={stats.applicationsByStatus.map(item => ({
                  status: String(item.status || ''),
                  count: Number(item.count || 0)
                }))}
                height={300}
                title=""
              />
            </div>
          </div>
        </div>

        {/* Gráficos secundarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-lg font-semibold">Distribución por Monto</h2>
              {stats.amountRanges && (
                <AmountRangeChart
                  data={stats.amountRanges}
                  height={300}
                  title=""
                />
              )}
            </div>
          </div>

          {/* Rendimiento de asesores (solo para admin y company_admin) */}
          {user?.role !== USER_ROLES.ADVISOR && (
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title text-lg font-semibold">Rendimiento de Asesores</h2>
                {stats.advisorPerformance && (
                  <AdvisorPerformanceChart
                    data={stats.advisorPerformance}
                    height={300}
                    title=""
                    maxBars={8}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabla de solicitudes recientes */}
        <div className="card bg-base-100 shadow-md mt-6">
          <div className="card-body">
            <h2 className="card-title text-lg font-semibold">Solicitudes Recientes</h2>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentApplications && stats.recentApplications.length > 0 ? (
                    stats.recentApplications.map((app, index) => (
                      <tr key={index} 
                          className="hover cursor-pointer"
                          onClick={() => navigate(`/applications/${app.id}`)}>
                        <td>{String(app.client_name || 'N/A')}</td>
                        <td>{String(app.application_type || 'N/A')}</td>
                        <td>{formatCurrency(Number(app.amount || 0))}</td>
                        <td>
                          <span className={`badge badge-${String(app.status) === 'approved' ? 'success' : 
                                                           String(app.status) === 'rejected' ? 'error' : 
                                                           String(app.status) === 'pending' ? 'warning' : 
                                                           String(app.status) === 'in_review' ? 'info' : 'ghost'}`}>
                            {String(app.status || 'N/A')}
                          </span>
                        </td>
                        <td>{app.created_at ? new Date(String(app.created_at)).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center">No hay solicitudes recientes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard; 