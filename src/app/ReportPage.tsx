"use client";
import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Filter, Calendar, BarChart2, PieChart as PieChartIcon, 
  LineChart as LineChartIcon, Table, Printer, ChevronDown, Loader2, X, Check,
  Users, Package, ShoppingCart, CreditCard, Warehouse, Tag, Box, ShoppingBag,
  Truck, Share2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line,
  AreaChart, Area
} from 'recharts';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiService } from './ApiService';

// Types
interface Report {
  id: number;
  title: string;
  type: 'ventes' | 'stocks' | 'clients' | 'performance' | 'commandes' | 'fournisseurs';
  period: string;
  generated_at: string;
  download_url: string;
  size: string;
  data: any;
}

interface FilterOptions {
  type: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  pointOfSale?: string;
  category?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C', '#D0ED57'];

const ReportPage = () => {
  // États
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOptions>({
    type: 'all',
    dateRange: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      end: new Date()
    }
  });
  const [activeTab, setActiveTab] = useState('list');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pointsOfSale, setPointsOfSale] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  

  // Charger les données initiales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Charger les points de vente
        const posResponse = await apiService.get('/points-vente/');
        if (posResponse.ok) {
          const posData = await posResponse.json();
          setPointsOfSale(posData.results || posData);
        }
        
        // Charger les catégories
        const catResponse = await apiService.get('/categories/');
        if (catResponse.ok) {
          const catData = await catResponse.json();
          setCategories(catData.results || catData);
        }
        
        // Charger les rapports existants
        await fetchReports();
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fonction pour récupérer les rapports
  const fetchReports = async () => {
    try {
      const response = await apiService.get('/reports/');
      if (response.ok) {
        const data = await response.json();
        // Ensure we always set an array, even if the response structure differs
        setReports(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      // Set empty array on error to prevent filter errors
      setReports([]);
    }
  };

  // Filtrage des rapports - ensure reports is always treated as array
  const filteredReports = (reports || []).filter(report => {
    const matchesType = filter.type === 'all' || report.type === filter.type;
    const reportDate = new Date(report.generated_at);
    const startDate = new Date(filter.dateRange.start);
    const endDate = new Date(filter.dateRange.end);
    endDate.setDate(endDate.getDate() + 1);
    
    const matchesPointOfSale = !filter.pointOfSale || report.data.pointOfSale === filter.pointOfSale;
    const matchesCategory = !filter.category || 
      (report.data.byCategory && report.data.byCategory.some((cat: any) => cat.name === filter.category)) ||
      (report.data.tableData && report.data.tableData.some((item: any) => item.category === filter.category));
    
    return matchesType && matchesPointOfSale && matchesCategory && 
      (reportDate >= startDate && reportDate <= endDate);
  });

  // Génération de rapport
  const generateReport = async (type: string) => {
    setIsGenerating(true);
    
    try {
      const reportData = {
        report_type: type,
        start_date: format(filter.dateRange.start, 'yyyy-MM-dd'),
        end_date: format(filter.dateRange.end, 'yyyy-MM-dd'),
        point_of_sale: filter.pointOfSale || null,
        category: filter.category || null
      };

      const response = await apiService.post('/reports/generate/', reportData);
      
      if (response.ok) {
        const newReport = await response.json();
        setReports([newReport, ...reports]);
      } else {
        console.error('Erreur lors de la génération du rapport');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Télécharger un rapport
  const downloadReport = async (reportId: number, reportTitle: string) => {
    try {
      const response = await apiService.get(`/reports/${reportId}/download/`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${reportTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  // Composant de visualisation de rapport
  const ReportView = ({ report }: { report: Report }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {report.type === 'ventes' && <ShoppingBag size={20} className="text-blue-600" />}
              {report.type === 'stocks' && <Package size={20} className="text-orange-600" />}
              {report.type === 'clients' && <Users size={20} className="text-purple-600" />}
              {report.type === 'commandes' && <ShoppingCart size={20} className="text-green-600" />}
              {report.type === 'fournisseurs' && <Truck size={20} className="text-red-600" />}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                report.type === 'ventes' ? 'bg-blue-100 text-blue-800' :
                report.type === 'stocks' ? 'bg-orange-100 text-orange-800' :
                report.type === 'clients' ? 'bg-purple-100 text-purple-800' :
                report.type === 'commandes' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {report.type}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mt-2">
              <span className="flex items-center">
                <Calendar size={14} className="mr-1" />
                Généré le: {new Date(report.generated_at).toLocaleDateString('fr-FR')}
              </span>
              <span>|</span>
              <span>Période: {report.period}</span>
              <span>|</span>
              <span>Point de vente: {report.data.pointOfSale || 'Tous'}</span>
              <span>|</span>
              <span>Taille: {report.size}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => downloadReport(report.id, report.title)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={16} className="mr-2" />
              Télécharger
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Printer size={16} className="mr-2" />
              Imprimer
            </button>
            <button className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
              <Share2 size={16} className="mr-2" />
              Partager
            </button>
          </div>
        </div>

        {/* Le reste du composant ReportView reste inchangé */}
        {/* ... (le code existant pour l'affichage des différents types de rapports) ... */}
      </div>
    );
  };

  // Composant de sélection de date
  const DateRangePicker = ({ onChange, ranges }: { onChange: any, ranges: any }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="flex items-center justify-between w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <span>
            {format(ranges.start, 'dd MMM yyyy', { locale: fr })} - {format(ranges.end, 'dd MMM yyyy', { locale: fr })}
          </span>
          <Calendar size={16} className="ml-2 text-gray-400" />
        </button>
        
        {showDatePicker && (
          <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md p-2">
            <DateRange
              editableDateInputs={true}
              onChange={onChange}
              moveRangeOnFirstSelection={false}
              ranges={[{
                startDate: ranges.start,
                endDate: ranges.end,
                key: 'selection'
              }]}
              locale={fr}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setShowDatePicker(false)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
              >
                Valider
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Rapports</h1>
          <p className="text-gray-600 mt-2">
            Consultez, générez et téléchargez les rapports d'activité de votre entreprise
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} className="mr-2" />
            Filtres
          </button>
          
          <div className="relative group">
            <button
              disabled={isGenerating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {isGenerating ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <FileText size={16} className="mr-2" />
              )}
              Nouveau rapport
              <ChevronDown size={16} className="ml-2" />
            </button>
            
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
              <div className="py-1">
                <button
                  onClick={() => generateReport('ventes')}
                  disabled={isGenerating}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <ShoppingBag size={14} className="mr-2" />
                  Ventes
                </button>
                <button
                  onClick={() => generateReport('stocks')}
                  disabled={isGenerating}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Package size={14} className="mr-2" />
                  Stocks
                </button>
                <button
                  onClick={() => generateReport('clients')}
                  disabled={isGenerating}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Users size={14} className="mr-2" />
                  Clients
                </button>
                <button
                  onClick={() => generateReport('commandes')}
                  disabled={isGenerating}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <ShoppingCart size={14} className="mr-2" />
                  Commandes
                </button>
                <button
                  onClick={() => generateReport('fournisseurs')}
                  disabled={isGenerating}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Truck size={14} className="mr-2" />
                  Fournisseurs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtrer les rapports</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de rapport</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({...filter, type: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="ventes">Ventes</option>
                <option value="stocks">Stocks</option>
                <option value="clients">Clients</option>
                <option value="commandes">Commandes</option>
                <option value="fournisseurs">Fournisseurs</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
              <DateRangePicker
                onChange={(item: any) => setFilter({
                  ...filter,
                  dateRange: {
                    start: item.selection.startDate,
                    end: item.selection.endDate
                  }
                })}
                ranges={{
                  start: filter.dateRange.start,
                  end: filter.dateRange.end
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Point de vente</label>
              <select
                value={filter.pointOfSale || ''}
                onChange={(e) => setFilter({...filter, pointOfSale: e.target.value || undefined})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les points de vente</option>
                {pointsOfSale.map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={filter.category || ''}
                onChange={(e) => setFilter({...filter, category: e.target.value || undefined})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4 space-x-3">
            <button
              onClick={() => {
                setFilter({
                  type: 'all',
                  dateRange: {
                    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                    end: new Date()
                  },
                  pointOfSale: undefined,
                  category: undefined
                });
              }}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}
    
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center justify-center ${
                activeTab === 'list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Table size={16} className="mr-2" />
              Liste des rapports
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center justify-center ${
                activeTab === 'charts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart2 size={16} className="mr-2" />
              Tableau de bord
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : filteredReports.length > 0 ? (
            filteredReports.map(report => (
              <ReportView key={report.id} report={report} />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun rapport trouvé</h3>
              <p className="text-gray-600 mb-4">
                Aucun rapport ne correspond à vos critères de recherche.
              </p>
              <button
                onClick={() => {
                  setFilter({
                    type: 'all',
                    dateRange: {
                      start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                      end: new Date()
                    },
                    pointOfSale: undefined,
                    category: undefined
                  });
                  setShowFilters(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Modifier les filtres
              </button>
            </div>
          )}
        </div>
      ) : (
        <DashboardView />
      )}
    </div>
  );
};

// Composant pour l'onglet Tableau de bord
const DashboardView = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiService.get('/reports/dashboard/');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du tableau de bord:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Rapports par type</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={dashboardData?.reports_by_type || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} rapports`, 'Quantité']} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dashboardData?.recent_activity || []}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="générés" fill="#8884d8" name="Rapports générés" />
              <Bar dataKey="téléchargés" fill="#82ca9d" name="Téléchargements" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Derniers rapports générés</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Point de vente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData?.recent_reports?.map((report: any) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {report.type === 'ventes' && <ShoppingBag size={16} className="flex-shrink-0 mr-2 text-blue-600" />}
                      {report.type === 'stocks' && <Package size={16} className="flex-shrink-0 mr-2 text-orange-600" />}
                      {report.type === 'clients' && <Users size={16} className="flex-shrink-0 mr-2 text-purple-600" />}
                      {report.type === 'commandes' && <ShoppingCart size={16} className="flex-shrink-0 mr-2 text-green-600" />}
                      {report.type === 'fournisseurs' && <Truck size={16} className="flex-shrink-0 mr-2 text-red-600" />}
                      <div className="text-sm font-medium text-gray-900">{report.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.type === 'ventes' ? 'bg-blue-100 text-blue-800' :
                      report.type === 'stocks' ? 'bg-orange-100 text-orange-800' :
                      report.type === 'clients' ? 'bg-purple-100 text-purple-800' :
                      report.type === 'commandes' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.point_of_sale || 'Tous'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.period}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button 
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Télécharger"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="Imprimer"
                      >
                        <Printer size={16} />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Partager"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;