// StatisticsDashboard.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, MapPin, Package, ShoppingCart, 
  DollarSign, Download, Filter, ArrowUp, ArrowDown, AlertCircle,
  RefreshCw, BarChart, PieChart, LineChart, FileText, Settings,
  ShoppingBag, ChevronLeft, ChevronRight
} from 'lucide-react';
import { apiService } from './ApiService';

// Import Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData as ChartJSData,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Types TypeScript
interface StatCardProps {
  title: string;
  value: string;
  growth?: number;
  icon: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

interface ProgressBarProps {
  value: number;
  max: number;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

interface POSStat {
  id: number;
  name: string;
  type: string;
  region: string;
  commune: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  mobile_vendors_count: number;
  performance_score: number;
  turnover: number;
  sales_growth?: number;
}

interface VendorStat {
  id: number;
  full_name: string;
  phone: string;
  status: string;
  vehicle_type: string;
  total_sales: number;
  total_purchases: number;
  average_purchase_value: number;
  active_days: number;
  efficiency_rate: number;
  performance: number;
  sales_growth?: number;
}

interface ProductStat {
  id: number;
  name: string;
  sku: string;
  category: string;
  status: string;
  total_quantity_sold: number;
  total_revenue: number;
  average_price: number;
  stock_rotation: number;
  revenue_growth?: number;
}

interface PurchaseStat {
  id: number;
  vendor_name: string;
  first_name: string;
  last_name: string;
  zone: string;
  base: string;
  purchase_count: number;
  total_amount: number;
  purchase_date: string;
}

// Nouveaux types pour Pushcart
interface TopPurchaseVendor {
  vendor_id: number;
  vendor_full_name: string;
  vendor_phone: string;
  vendor_status: string;
  point_of_sale: string;
  total_purchase_amount: number;
  total_purchase_count: number;
  average_purchase_value: number;
  total_sales_from_purchases: number;
  total_sales_count: number;
  purchase_to_sales_efficiency: number;
  top_purchases: TopPurchase[];
}

interface TopPurchase {
  id: number;
  full_name: string;
  zone: string;
  purchase_amount: number;
  sales_amount: number;
  efficiency: number;
}

interface PurchaseDetail {
  purchase_id: number;
  purchase_full_name: string;
  purchase_zone: string;
  purchase_amount: number;
  purchase_date: string;
  purchase_base: string;
  purchase_pushcard_type: string;
  purchase_phone: string;
  total_sales_amount: number;
  total_sales_count: number;
  sales_efficiency: number;
  main_mobile_vendor: {
    id: number;
    full_name: string;
    phone: string;
    total_sales_to_purchase: number;
    sales_count_to_purchase: number;
  };
  main_vendor_ratio: number;
  latitude: number;
  longitude: number;
}

interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

interface PerformanceMetrics {
  conversion_rate: number;
  vendor_utilization_rate: number;
  stock_rotation_rate: number;
  average_delivery_time_days: number;
  order_fulfillment_rate: number;
}

interface DashboardSummary {
  total_sales: number;
  total_orders: number;
  total_mobile_vendors: number;
  total_points_of_sale: number;
  active_purchases: number;
  sales_growth: number;
  revenue_growth: number;
  period?: string;
  start_date?: string;
  end_date?: string;
}

// Types corrigés pour Chart.js
interface CustomChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string | string[];
  yAxisID?: string;
}

interface ChartData {
  labels: string[];
  datasets: CustomChartDataset[];
}

interface FilterState {
  start_date?: string;
  end_date?: string;
  period?: string;
  point_of_sale?: number[];
  vendor?: number[];
  category?: number[];
  region?: string[];
  zone?: string[];
  group_by?: string;
}

interface StatsState {
  summary: DashboardSummary | null;
  posStats: POSStat[];
  vendorStats: VendorStat[];
  productStats: ProductStat[];
  purchaseStats: PurchaseStat[];
  topPurchaseVendors: TopPurchaseVendor[];
  purchaseDetails: PurchaseDetail[];
  salesTrend: TimeSeriesData[];
  performance: PerformanceMetrics | null;
  salesChart: ChartData | null;
  performanceChart: ChartData | null;
}

const StatisticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    period: '30',
    group_by: 'day'
  });
  const [stats, setStats] = useState<StatsState>({
    summary: null,
    posStats: [],
    vendorStats: [],
    productStats: [],
    purchaseStats: [],
    topPurchaseVendors: [],
    purchaseDetails: [],
    salesTrend: [],
    performance: null,
    salesChart: null,
    performanceChart: null
  });

  // État pour la pagination des détails d'achats
  const [purchaseDetailsPage, setPurchaseDetailsPage] = useState(1);
  const [purchaseDetailsPerPage, setPurchaseDetailsPerPage] = useState(10);

  // Options pour Chart.js
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Évolution des Ventes',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'XOF'
            }).format(value);
          }
        }
      }
    }
  };

  const performanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const loadStatistics = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Appliquer les filtres
      const currentFilters = {
        ...filters,
        period: timeRange
      };

      // Utiliser Promise.allSettled pour gérer les APIs qui pourraient échouer
      const [
        summaryResponse,
        posStatsResponse,
        vendorStatsResponse,
        productStatsResponse,
        topPurchaseResponse,
        purchaseStatsResponse,
        salesTrendResponse,
        performanceResponse,
        salesChartResponse,
        performanceChartResponse
      ] = await Promise.allSettled([
        apiService.getDashboardSummary(currentFilters),
        apiService.getPOSStatistics(currentFilters),
        apiService.getMobileVendorStatistics(timeRange, currentFilters),
        apiService.getProductStatistics(timeRange, currentFilters),
        apiService.get('/statistics/top_purchase/', currentFilters),
        apiService.get('/statistics/purchase_stat/', currentFilters),
        apiService.getSalesTimeSeries('month', 'day', currentFilters),
        apiService.getPerformanceMetrics(),
        apiService.getSalesChart(currentFilters),
        apiService.getPerformanceChart('vendors', currentFilters)
      ]);

      // Traiter les réponses
      const processResponse = async (response: PromiseSettledResult<Response>) => {
        if (response.status === 'fulfilled') {
          try {
            const data = await response.value.json();
            return data;
          } catch (e) {
            console.error('Error parsing JSON:', e);
            return null;
          }
        }
        return null;
      };

      const summary = await processResponse(summaryResponse);
      const posStats = await processResponse(posStatsResponse) || [];
      const vendorStats = await processResponse(vendorStatsResponse) || [];
      const productStats = await processResponse(productStatsResponse) || [];
      const topPurchaseVendors = await processResponse(topPurchaseResponse) || [];
      const purchaseDetails = await processResponse(purchaseStatsResponse) || [];
      const salesTrend = await processResponse(salesTrendResponse) || [];
      const performance = await processResponse(performanceResponse);
      const salesChart = await processResponse(salesChartResponse);
      const performanceChart = await processResponse(performanceChartResponse);

      console.log('Sales Chart Data:', salesChart);
      console.log('Performance Chart Data:', performanceChart);

      // Formater les données pour Chart.js
      const formatChartData = (chartData: any): ChartData | null => {
        if (!chartData || !chartData.labels || !chartData.datasets) {
          console.log('Invalid chart data structure:', chartData);
          return null;
        }

        return {
          labels: chartData.labels,
          datasets: chartData.datasets.map((dataset: any, index: number) => ({
            label: dataset.label,
            data: dataset.data,
            backgroundColor: dataset.backgroundColor || 
              (index === 0 ? 'rgba(59, 130, 246, 0.8)' : 
               index === 1 ? 'rgba(16, 185, 129, 0.8)' : 
               `hsl(${index * 60}, 70%, 60%)`),
            borderColor: dataset.borderColor || 
              (index === 0 ? 'rgb(59, 130, 246)' : 
               index === 1 ? 'rgb(16, 185, 129)' : 
               `hsl(${index * 60}, 70%, 50%)`),
            borderWidth: 2,
            yAxisID: dataset.yAxisID || 'y'
          }))
        };
      };

      setStats({
        summary: summary || {
          total_sales: 0,
          total_orders: 0,
          total_mobile_vendors: 0,
          total_points_of_sale: 0,
          active_purchases: 0,
          sales_growth: 0,
          revenue_growth: 0
        },
        posStats: Array.isArray(posStats) ? posStats : [],
        vendorStats: Array.isArray(vendorStats) ? vendorStats : [],
        productStats: Array.isArray(productStats) ? productStats : [],
        purchaseStats: [],
        topPurchaseVendors: Array.isArray(topPurchaseVendors) ? topPurchaseVendors : [],
        purchaseDetails: Array.isArray(purchaseDetails) ? purchaseDetails : [],
        salesTrend: Array.isArray(salesTrend) ? salesTrend : [],
        performance: performance && !performance.error ? performance : null,
        salesChart: formatChartData(salesChart),
        performanceChart: formatChartData(performanceChart)
      });

    } catch (error: any) {
      console.error('Error loading statistics:', error);
      setError(error.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [timeRange, filters]);

const handleExport = async (reportType: string) => {
  try {
    console.log(`Exporting ${reportType} report...`);
    
    // Préparer les données pour l'export
    const exportData = {
      format: 'excel' as 'csv' | 'excel' | 'pdf',
      report_type: reportType,
      filters: {
        ...filters,
        period: timeRange
      },
      data: getExportData(reportType)
    };

    // Utiliser la méthode exportData existante
    const response = await apiService.exportData(exportData);
    
    if (response.ok) {
      const blob = await response.blob();
      
      // Vérifier si le blob n'est pas vide
      if (blob.size === 0) {
        throw new Error('Le fichier exporté est vide');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Déterminer l'extension du fichier selon le format
      const extension = exportData.format === 'excel' ? 'xlsx' : 
                       exportData.format === 'csv' ? 'csv' : 'pdf';
      
      a.download = `${reportType}_export_${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`Export ${reportType} réussi`);
    } else {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('Export error:', error);
    setError(`Erreur lors de l'export: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    
    // Fallback: créer un export basique si l'API échoue
    createFallbackExport(reportType);
  }
};

  // Fonction pour obtenir les données d'export
  const getExportData = (reportType: string) => {
    switch (reportType) {
      case 'sales':
        return {
          summary: stats.summary,
          sales_trend: stats.salesTrend,
          chart_data: stats.salesChart
        };
      case 'vendors':
        return {
          vendors: stats.vendorStats,
          top_vendors: stats.vendorStats.slice(0, 10)
        };
      case 'products':
        return {
          products: stats.productStats,
          top_products: stats.productStats.slice(0, 10)
        };
      case 'pos':
        return {
          points_of_sale: stats.posStats
        };
      case 'pushcart':
        return {
          top_purchase_vendors: stats.topPurchaseVendors,
          purchase_details: stats.purchaseDetails
        };
      case 'purchase-details':
        return {
          purchase_details: stats.purchaseDetails
        };
      case 'performance':
        return {
          performance_metrics: stats.performance,
          performance_chart: stats.performanceChart
        };
      case 'inventory':
        return {
          products: stats.productStats,
          stock_rotation: stats.productStats.map(p => ({
            product: p.name,
            sku: p.sku,
            stock_rotation: p.stock_rotation,
            quantity_sold: p.total_quantity_sold
          }))
        };
      default:
        return {};
    }
  };

  // Fallback export en CSV si l'API échoue
// Fallback export en CSV si l'API échoue
const createFallbackExport = (reportType: string) => {
  try {
    let csvContent = '';
    let filename = '';
    
    switch (reportType) {
      case 'sales':
        csvContent = 'Date,Ventes (FCFA)\n';
        stats.salesTrend.forEach(item => {
          csvContent += `${item.date},${item.value}\n`;
        });
        filename = `ventes_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'vendors':
        csvContent = 'Vendeur,Téléphone,Statut,Ventes Total (FCFA),Efficacité (%)\n';
        stats.vendorStats.forEach(vendor => {
          csvContent += `"${vendor.full_name}","${vendor.phone}","${vendor.status}",${vendor.total_sales},${vendor.efficiency_rate}\n`;
        });
        filename = `vendeurs_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'products':
        csvContent = 'Produit,SKU,Catégorie,Quantité Vendue,Revenu Total (FCFA),Prix Moyen (FCFA),Rotation\n';
        stats.productStats.forEach(product => {
          csvContent += `"${product.name}","${product.sku}","${product.category}",${product.total_quantity_sold},${product.total_revenue},${product.average_price},${product.stock_rotation}\n`;
        });
        filename = `produits_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'pos':
        csvContent = 'Point de Vente,Type,Région,Commune,Ventes (FCFA),Commandes,Performance (%)\n';
        stats.posStats.forEach(pos => {
          csvContent += `"${pos.name}","${pos.type}","${pos.region}","${pos.commune}",${pos.total_sales},${pos.total_orders},${pos.performance_score}\n`;
        });
        filename = `points_vente_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'pushcart':
        csvContent = 'Vendeur,Téléphone,Point de Vente,Montant Achats (FCFA),Nombre Achats,Ventes depuis Achats (FCFA),Efficacité (%)\n';
        stats.topPurchaseVendors.forEach(vendor => {
          csvContent += `"${vendor.vendor_full_name}","${vendor.vendor_phone}","${vendor.point_of_sale}",${vendor.total_purchase_amount},${vendor.total_purchase_count},${vendor.total_sales_from_purchases},${vendor.purchase_to_sales_efficiency}\n`;
        });
        filename = `pushcart_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'purchase-details':
        csvContent = 'Acheteur,Téléphone,Zone,Base,Type Pushcart,Montant Achat (FCFA),Ventes Générées (FCFA),Efficacité (%),Vendeur Principal\n';
        stats.purchaseDetails.forEach(purchase => {
          const vendorName = purchase.main_mobile_vendor ? purchase.main_mobile_vendor.full_name : 'Non assigné';
          csvContent += `"${purchase.purchase_full_name}","${purchase.purchase_phone}","${purchase.purchase_zone}","${purchase.purchase_base}","${purchase.purchase_pushcard_type}",${purchase.purchase_amount},${purchase.total_sales_amount},${purchase.sales_efficiency},"${vendorName}"\n`;
        });
        filename = `details_achats_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      default:
        csvContent = 'Données,Export\n';
        csvContent += `Type de rapport,${reportType}\n`;
        csvContent += `Date d'export,${new Date().toISOString().split('T')[0]}\n`;
        filename = `export_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Export fallback ${reportType} réussi`);
  } catch (error) {
    console.error('Fallback export error:', error);
    setError('Erreur lors de la création du fichier d\'export fallback');
  }
};

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, growth, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            {growth !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${
                growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {growth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span className="ml-1 font-medium">
                  {Math.abs(growth)}% vs période précédente
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    );
  };

  const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, color = 'blue' }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };

    return (
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 rounded-full ${colorClasses[color]} transition-all duration-500 ease-out shadow-md`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  const ChartComponent: React.FC<{ 
    chartData: ChartData | null; 
    title: string; 
    type?: 'bar' | 'line' | 'pie';
    height?: string;
  }> = ({ chartData, title, type = 'bar', height = '400px' }) => {
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg p-8" style={{ height }}>
          <BarChart size={48} className="mb-3 opacity-50" />
          <p className="text-lg font-medium mb-2">Aucune donnée disponible</p>
          <p className="text-sm text-gray-400">Les données pour "{title}" ne sont pas encore disponibles</p>
        </div>
      );
    }

    // Conversion vers le format Chart.js avec typage correct pour chaque type
    const renderChart = () => {
      switch (type) {
        case 'bar':
          const barData: ChartJSData<'bar', number[], string> = {
            labels: chartData.labels,
            datasets: chartData.datasets.map(dataset => ({
              label: dataset.label,
              data: dataset.data,
              backgroundColor: dataset.backgroundColor as string,
              borderColor: dataset.borderColor as string,
              borderWidth: 2,
              yAxisID: dataset.yAxisID
            }))
          };
          return <Bar data={barData} options={chartOptions} />;
        
        case 'line':
          const lineData: ChartJSData<'line', number[], string> = {
            labels: chartData.labels,
            datasets: chartData.datasets.map(dataset => ({
              label: dataset.label,
              data: dataset.data,
              backgroundColor: dataset.backgroundColor as string,
              borderColor: dataset.borderColor as string,
              borderWidth: 2,
              yAxisID: dataset.yAxisID
            }))
          };
          return <Line data={lineData} options={chartOptions} />;
        
        case 'pie':
          const pieData: ChartJSData<'pie', number[], string> = {
            labels: chartData.labels,
            datasets: chartData.datasets.map(dataset => ({
              label: dataset.label,
              data: dataset.data,
              backgroundColor: dataset.backgroundColor as string,
              borderColor: dataset.borderColor as string,
              borderWidth: 2
            }))
          };
          return <Pie data={pieData} options={performanceChartOptions} />;
        
        default:
          const defaultData: ChartJSData<'bar', number[], string> = {
            labels: chartData.labels,
            datasets: chartData.datasets.map(dataset => ({
              label: dataset.label,
              data: dataset.data,
              backgroundColor: dataset.backgroundColor as string,
              borderColor: dataset.borderColor as string,
              borderWidth: 2,
              yAxisID: dataset.yAxisID
            }))
          };
          return <Bar data={defaultData} options={chartOptions} />;
      }
    };

    return (
      <div style={{ height, position: 'relative' }}>
        {renderChart()}
      </div>
    );
  };

  const FilterPanel: React.FC = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-lg animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Filtres Avancés</h3>
          <button
            onClick={() => setShowFilters(false)}
            className="text-gray-500 hover:text-gray-700 text-xl transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => updateFilter('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => updateFilter('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Groupement
            </label>
            <select
              value={filters.group_by || 'day'}
              onChange={(e) => updateFilter('group_by', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="day">Par jour</option>
              <option value="week">Par semaine</option>
              <option value="month">Par mois</option>
            </select>
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              onClick={() => setFilters({ period: '30', group_by: 'day' })}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TopVendorsTable: React.FC<{ data: VendorStat[] }> = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Vendeurs</h3>
          <div className="text-center py-8 text-gray-500">
            <Users size={48} className="mx-auto mb-2 opacity-50" />
            <p>Aucun vendeur disponible</p>
          </div>
        </div>
      );
    }

    const topVendors = data.slice(0, 5);

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Top Vendeurs</h3>
          <button
            onClick={() => handleExport('vendors')}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <Download size={16} className="mr-1" />
            Exporter
          </button>
        </div>
        <div className="space-y-3">
          {topVendors.map((vendor, index) => (
            <div key={vendor.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md">
                  {index + 1}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">{vendor.full_name}</p>
                  <p className="text-xs text-gray-500">{vendor.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {(vendor.total_sales || 0).toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-xs text-gray-500">Efficacité: {(vendor.efficiency_rate || 0).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TopProductsTable: React.FC<{ data: ProductStat[] }> = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Produits</h3>
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-2 opacity-50" />
            <p>Aucun produit disponible</p>
          </div>
        </div>
      );
    }

    const topProducts = data.slice(0, 5);

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Top Produits</h3>
          <button
            onClick={() => handleExport('products')}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <Download size={16} className="mr-1" />
            Exporter
          </button>
        </div>
        <div className="space-y-3">
          {topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md">
                  {index + 1}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {(product.total_revenue || 0).toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-xs text-gray-500">{(product.total_quantity_sold || 0).toLocaleString('fr-FR')} unités</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Composant de pagination pour les détails d'achats
  const PurchaseDetailsPagination: React.FC<{
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (perPage: number) => void;
  }> = ({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mt-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Afficher</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-600">éléments par page</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} éléments
        </div>
      </div>
    );
  };

  const OverviewTab: React.FC = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center animate-fadeIn">
          <AlertCircle className="text-red-600 mr-3" size={20} />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Cartes de résumé */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventes Totales"
          value={stats.summary ? `${(stats.summary.total_sales || 0).toLocaleString('fr-FR')} FCFA` : '0 FCFA'}
          growth={stats.summary?.sales_growth}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Commandes"
          value={stats.summary ? (stats.summary.total_orders || 0).toLocaleString('fr-FR') : '0'}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Vendeurs Actifs"
          value={stats.summary ? (stats.summary.total_mobile_vendors || 0).toLocaleString('fr-FR') : '0'}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Points de Vente"
          value={stats.summary ? (stats.summary.total_points_of_sale || 0).toLocaleString('fr-FR') : '0'}
          icon={MapPin}
          color="orange"
        />
      </div>

      {/* Graphique des ventes et métriques */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Évolution des Ventes</h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleExport('sales')}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                <Download size={16} className="mr-1" />
                Exporter
              </button>
            </div>
          </div>
          <ChartComponent 
            chartData={stats.salesChart} 
            title="Ventes" 
            type="bar" 
            height="400px"
          />
        </div>

        {/* Métriques de performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Indicateurs de Performance</h3>
          <div className="space-y-4">
            {stats.performance ? (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Taux de conversion</span>
                    <span className="font-medium">{(stats.performance.conversion_rate || 0).toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={stats.performance.conversion_rate || 0} max={100} color="blue" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Utilisation vendeurs</span>
                    <span className="font-medium">{(stats.performance.vendor_utilization_rate || 0).toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={stats.performance.vendor_utilization_rate || 0} max={100} color="green" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Rotation stocks</span>
                    <span className="font-medium">{(stats.performance.stock_rotation_rate || 0).toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={stats.performance.stock_rotation_rate || 0} max={100} color="purple" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Taux de réalisation</span>
                    <span className="font-medium">{(stats.performance.order_fulfillment_rate || 0).toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={stats.performance.order_fulfillment_rate || 0} max={100} color="orange" />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                <p>Aucune métrique de performance disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Graphique de performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Performance par Vendeur</h3>
          <select 
            onChange={(e) => {
              apiService.getPerformanceChart(e.target.value, filters)
                .then(response => response.json())
                .then(data => {
                  setStats(prev => ({ ...prev, performanceChart: data }));
                })
                .catch(error => {
                  console.error('Error loading performance chart:', error);
                  setStats(prev => ({ ...prev, performanceChart: null }));
                });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="vendors">Vendeurs</option>
            <option value="products">Produits</option>
            <option value="pos">Points de vente</option>
          </select>
        </div>
        <ChartComponent 
          chartData={stats.performanceChart} 
          title="Performance" 
          type="bar" 
          height="400px"
        />
      </div>

      {/* Top vendeurs et produits */}
      <div className="grid lg:grid-cols-2 gap-6">
        <TopVendorsTable data={stats.vendorStats} />
        <TopProductsTable data={stats.productStats} />
      </div>
    </div>
  );

  const PointsOfSaleTab: React.FC = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Performance des Points de Vente</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{stats.posStats.length} points de vente</span>
            <button
              onClick={() => handleExport('pos')}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              <Download size={16} className="mr-1" />
              Exporter
            </button>
          </div>
        </div>
        {stats.posStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
            <p>Aucun point de vente disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Point de Vente</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Région</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ventes</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Commandes</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Performance</th>
                </tr>
              </thead>
              <tbody>
                {stats.posStats.map((pos) => (
                  <tr key={pos.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{pos.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">{pos.type}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{pos.region}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 text-right font-semibold">
                      {(pos.total_sales || 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{pos.total_orders || 0}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <span className={`text-sm font-medium ${
                          (pos.performance_score || 0) >= 80 ? 'text-green-600' :
                          (pos.performance_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(pos.performance_score || 0).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const VendorsTab: React.FC = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Performance des Vendeurs Ambulants</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{stats.vendorStats.length} vendeurs</span>
            <button
              onClick={() => handleExport('vendors')}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              <Download size={16} className="mr-1" />
              Exporter
            </button>
          </div>
        </div>
        {stats.vendorStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users size={48} className="mx-auto mb-2 opacity-50" />
            <p>Aucun vendeur ambulant disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Vendeur</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ventes</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Achats</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Efficacité</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Jours Actifs</th>
                </tr>
              </thead>
              <tbody>
                {stats.vendorStats.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{vendor.full_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{vendor.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vendor.status === 'actif' ? 'bg-green-100 text-green-800' :
                        vendor.status === 'inactif' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800 text-right font-semibold">
                      {(vendor.total_sales || 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{vendor.total_purchases || 0}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <span className={`text-sm font-medium ${
                          (vendor.efficiency_rate || 0) >= 80 ? 'text-green-600' :
                          (vendor.efficiency_rate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(vendor.efficiency_rate || 0).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{vendor.active_days || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const ProductsTab: React.FC = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Performance des Produits</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{stats.productStats.length} produits</span>
            <button
              onClick={() => handleExport('products')}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              <Download size={16} className="mr-1" />
              Exporter
            </button>
          </div>
        </div>
        {stats.productStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-2 opacity-50" />
            <p>Aucun produit disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Catégorie</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Quantité Vendue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Revenu</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Prix Moyen</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Rotation</th>
                </tr>
              </thead>
              <tbody>
                {stats.productStats.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{product.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{product.sku}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{product.category}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{(product.total_quantity_sold || 0).toLocaleString('fr-FR')}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 text-right font-semibold">
                      {(product.total_revenue || 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">
                      {(product.average_price || 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <span className={`text-sm font-medium ${
                          (product.stock_rotation || 0) >= 2 ? 'text-green-600' :
                          (product.stock_rotation || 0) >= 1 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(product.stock_rotation || 0).toFixed(1)}x
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const PushcartTab: React.FC = () => {
    // Pagination pour les détails d'achats
    const indexOfLastPurchase = purchaseDetailsPage * purchaseDetailsPerPage;
    const indexOfFirstPurchase = indexOfLastPurchase - purchaseDetailsPerPage;
    const currentPurchaseDetails = stats.purchaseDetails.slice(indexOfFirstPurchase, indexOfLastPurchase);
    const totalPurchaseDetailsPages = Math.ceil(stats.purchaseDetails.length / purchaseDetailsPerPage);

    // Trier les top achats par ventes générées (sales_amount)
    const sortedTopPurchases = stats.topPurchaseVendors
      .flatMap(vendor => vendor.top_purchases || [])
      .sort((a, b) => (b.sales_amount || 0) - (a.sales_amount || 0))
      .slice(0, 10); // Top 10 par ventes générées

    return (
      <div className="space-y-6">
        {/* Statistiques des vendeurs par achats */}
        {/* <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Performance des Vendeurs par Achats</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{stats.topPurchaseVendors.length} vendeurs</span>
              <button
                onClick={() => handleExport('pushcart')}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                <Download size={16} className="mr-1" />
                Exporter
              </button>
            </div>
          </div>
          {stats.topPurchaseVendors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag size={48} className="mx-auto mb-2 opacity-50" />
              <p>Aucune donnée de vendeur par achat disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Vendeur</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Téléphone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Point de Vente</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Montant Achats</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Nombre Achats</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ventes depuis Achats</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Efficacité</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topPurchaseVendors.map((vendor) => (
                    <tr key={vendor.vendor_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-800 font-medium">{vendor.vendor_full_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{vendor.vendor_phone}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{vendor.point_of_sale}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 text-right font-semibold">
                        {(vendor.total_purchase_amount || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">{vendor.total_purchase_count || 0}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 text-right">
                        {(vendor.total_sales_from_purchases || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <span className={`text-sm font-medium ${
                            (vendor.purchase_to_sales_efficiency || 0) >= 5000 ? 'text-green-600' :
                            (vendor.purchase_to_sales_efficiency || 0) >= 2000 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {(vendor.purchase_to_sales_efficiency || 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div> */}

        {/* Détails des achats avec pagination */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Détails des Achats</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{stats.purchaseDetails.length} achats</span>
              <button
                onClick={() => handleExport('purchase-details')}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                <Download size={16} className="mr-1" />
                Exporter
              </button>
            </div>
          </div>
          {stats.purchaseDetails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
              <p>Aucun détail d'achat disponible</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Acheteur</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Zone</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Base</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type Pushcart</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Montant Achat</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ventes Générées</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Efficacité</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Vendeur Principal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPurchaseDetails.map((purchase) => (
                      <tr key={purchase.purchase_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-800 font-medium">
                          <div>
                            <p>{purchase.purchase_full_name}</p>
                            <p className="text-xs text-gray-500">{purchase.purchase_phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{purchase.purchase_zone}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{purchase.purchase_base}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{purchase.purchase_pushcard_type}</td>
                        <td className="py-3 px-4 text-sm text-gray-800 text-right font-semibold">
                          {(purchase.purchase_amount || 0).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-800 text-right">
                          {(purchase.total_sales_amount || 0).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end">
                            <span className={`text-sm font-medium ${
                              (purchase.sales_efficiency || 0) >= 5000 ? 'text-green-600' :
                              (purchase.sales_efficiency || 0) >= 2000 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {(purchase.sales_efficiency || 0).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {purchase.main_mobile_vendor ? (
                            <div>
                              <p className="font-medium">{purchase.main_mobile_vendor.full_name}</p>
                              <p className="text-xs text-gray-500">{purchase.main_mobile_vendor.phone}</p>
                              <p className="text-xs text-gray-500">Ratio: {purchase.main_vendor_ratio}%</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Non assigné</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <PurchaseDetailsPagination
                currentPage={purchaseDetailsPage}
                totalItems={stats.purchaseDetails.length}
                itemsPerPage={purchaseDetailsPerPage}
                onPageChange={setPurchaseDetailsPage}
                onItemsPerPageChange={(perPage) => {
                  setPurchaseDetailsPerPage(perPage);
                  setPurchaseDetailsPage(1); // Reset à la première page quand on change le nombre d'éléments par page
                }}
              />
            </>
          )}
        </div>

        {/* Top achats par ventes générées */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Achats par Ventes Générées</h3>
          {sortedTopPurchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
              <p>Aucun top achat disponible</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedTopPurchases.map((purchase, index) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md">
                      {index + 1}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-800">{purchase.full_name}</p>
                      <p className="text-xs text-gray-500">{purchase.zone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">
                      Achat: {(purchase.purchase_amount || 0).toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      Ventes: {(purchase.sales_amount || 0).toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-xs text-gray-500">
                      Efficacité: {(purchase.efficiency || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const AnalyticsTab: React.FC = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Analytiques Avancées</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => handleExport('sales')}
            className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
          >
            <FileText className="mx-auto mb-3 text-blue-500 group-hover:text-blue-600" size={32} />
            <h4 className="font-semibold text-gray-800 group-hover:text-blue-600">Rapport des Ventes</h4>
            <p className="text-sm text-gray-600 mt-2">Export complet des ventes</p>
          </button>

          <button
            onClick={() => handleExport('inventory')}
            className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center group"
          >
            <Package className="mx-auto mb-3 text-green-500 group-hover:text-green-600" size={32} />
            <h4 className="font-semibold text-gray-800 group-hover:text-green-600">Rapport d'Inventaire</h4>
            <p className="text-sm text-gray-600 mt-2">État des stocks et rotation</p>
          </button>

          <button
            onClick={() => handleExport('performance')}
            className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center group"
          >
            <TrendingUp className="mx-auto mb-3 text-purple-500 group-hover:text-purple-600" size={32} />
            <h4 className="font-semibold text-gray-800 group-hover:text-purple-600">Rapport de Performance</h4>
            <p className="text-sm text-gray-600 mt-2">Performance globale</p>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Filtres Actifs</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (value && key !== 'period' && key !== 'group_by') {
                return (
                  <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {key}: {Array.isArray(value) ? value.join(', ') : value}
                  </span>
                );
              }
              return null;
            })}
            {Object.keys(filters).filter(key => filters[key as keyof FilterState] && key !== 'period' && key !== 'group_by').length === 0 && (
              <span className="text-gray-500 text-sm">Aucun filtre actif</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'points-of-sale', label: 'Points de Vente', icon: MapPin },
    { id: 'vendors', label: 'Vendeurs', icon: Users },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'pushcart', label: 'Pushcart', icon: ShoppingBag },
    { id: 'analytics', label: 'Analytiques', icon: TrendingUp }
  ];

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Chargement des statistiques...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tableau de Bord Statistiques
              </h1>
              <p className="text-gray-600 mt-2">
                Analyse complète de vos performances commerciales
                {stats.summary?.start_date && stats.summary?.end_date && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({new Date(stats.summary.start_date).toLocaleDateString('fr-FR')} - {new Date(stats.summary.end_date).toLocaleDateString('fr-FR')})
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
              >
                <Filter size={16} className="text-gray-500" />
                <span className="font-medium">Filtres</span>
              </button>

              <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                <Filter size={16} className="text-gray-500" />
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-sm font-medium"
                >
                  <option value="7">7 derniers jours</option>
                  <option value="30">30 derniers jours</option>
                  <option value="90">3 derniers mois</option>
                  <option value="365">1 an</option>
                </select>
              </div>
              
              <button 
                onClick={() => loadStatistics(true)}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panneau de filtres */}
        <FilterPanel />

        {/* Navigation par onglets */}
        <div className="bg-white rounded-xl border border-gray-200 p-2 mb-6 shadow-sm">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 font-medium whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  <IconComponent size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="animate-fadeIn">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'points-of-sale' && <PointsOfSaleTab />}
          {activeTab === 'vendors' && <VendorsTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'pushcart' && <PushcartTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StatisticsDashboard;