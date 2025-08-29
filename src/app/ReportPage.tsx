"use client";
import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Filter, Calendar, BarChart2, PieChart as PieChartIcon, 
  LineChart as LineChartIcon, Table, Printer, ChevronDown, Loader2, X, Check,
  Users, Package, ShoppingCart, CreditCard, Warehouse, Tag, Box, ShoppingBag,
  Truck, Share2  // Add these imports
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line,
  AreaChart, Area
} from 'recharts';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

  // Données fictives basées sur les modèles
  useEffect(() => {
    const mockPointsOfSale = [
      { id: 1, name: "Supermarché Abidjan", commune: "Cocody", type: "supermarche" },
      { id: 2, name: "Boutique Yopougon", commune: "Yopougon", type: "boutique" },
      { id: 3, name: "Grossiste Adjamé", commune: "Adjamé", type: "grossiste" }
    ];

    const mockCategories = [
      { id: 1, name: "Céréales" },
      { id: 2, name: "Huiles" },
      { id: 3, name: "Épicerie" },
      { id: 4, name: "Boissons" }
    ];

    const mockReports: Report[] = [
      {
        id: 1,
        title: "Rapport des ventes mensuelles",
        type: "ventes",
        period: "Mai 2023",
        generated_at: "2023-05-31T14:30:00Z",
        download_url: "#",
        size: "1.2 MB",
        data: {
          total: 125000,
          evolution: "+12%",
          pointOfSale: "Supermarché Abidjan",
          chartData: [
            { name: 'Sem 1', ventes: 25000 },
            { name: 'Sem 2', ventes: 30000 },
            { name: 'Sem 3', ventes: 35000 },
            { name: 'Sem 4', ventes: 35000 }
          ],
          byProduct: [
            { name: 'Riz 5kg', value: 40000, category: "Céréales" },
            { name: 'Huile 1L', value: 35000, category: "Huiles" },
            { name: 'Sucre 1kg', value: 30000, category: "Épicerie" },
            { name: 'Lait 500ml', value: 20000, category: "Boissons" }
          ],
          byCategory: [
            { name: 'Céréales', value: 40 },
            { name: 'Huiles', value: 28 },
            { name: 'Épicerie', value: 24 },
            { name: 'Boissons', value: 8 }
          ],
          tableData: [
            { id: 1, produit: 'Riz 5kg', quantite: 120, montant: 40000, category: "Céréales" },
            { id: 2, produit: 'Huile 1L', quantite: 100, montant: 35000, category: "Huiles" },
            { id: 3, produit: 'Sucre 1kg', quantite: 85, montant: 30000, category: "Épicerie" },
            { id: 4, produit: 'Lait 500ml', quantite: 60, montant: 20000, category: "Boissons" }
          ]
        }
      },
      {
        id: 2,
        title: "État des stocks",
        type: "stocks",
        period: "Juin 2023",
        generated_at: "2023-06-15T09:15:00Z",
        download_url: "#",
        size: "0.8 MB",
        data: {
          totalProducts: 42,
          lowStock: 5,
          pointOfSale: "Boutique Yopougon",
          chartData: [
            { name: 'Riz 5kg', stock: 120, seuil: 30, category: "Céréales" },
            { name: 'Huile 1L', stock: 85, seuil: 25, category: "Huiles" },
            { name: 'Sucre 1kg', stock: 45, seuil: 20, category: "Épicerie" },
            { name: 'Lait 500ml', stock: 18, seuil: 15, category: "Boissons" }
          ],
          byCategory: [
            { name: 'Céréales', value: 45 },
            { name: 'Huiles', value: 30 },
            { name: 'Épicerie', value: 15 },
            { name: 'Boissons', value: 10 }
          ],
          statusDistribution: [
            { name: 'En stock', value: 30 },
            { name: 'Stock faible', value: 5 },
            { name: 'Rupture', value: 7 }
          ]
        }
      },
      {
        id: 3,
        title: "Analyse clientèle",
        type: "clients",
        period: "Trimestre 2 2023",
        generated_at: "2023-07-05T16:45:00Z",
        download_url: "#",
        size: "2.1 MB",
        data: {
          newClients: 84,
          returningClients: 156,
          pointOfSale: "Grossiste Adjamé",
          chartData: [
            { name: 'Avr', nouveaux: 25, retours: 40 },
            { name: 'Mai', nouveaux: 30, retours: 52 },
            { name: 'Juin', nouveaux: 29, retours: 64 }
          ],
          byRegion: [
            { name: 'Abidjan', value: 45 },
            { name: 'Bouaké', value: 30 },
            { name: 'San Pedro', value: 15 },
            { name: 'Autres', value: 10 }
          ],
          byCommune: [
            { name: 'Cocody', value: 35 },
            { name: 'Yopougon', value: 25 },
            { name: 'Adjamé', value: 20 },
            { name: 'Autres', value: 20 }
          ]
        }
      },
      {
        id: 4,
        title: "Rapport des commandes",
        type: "commandes",
        period: "Juin 2023",
        generated_at: "2023-06-30T18:20:00Z",
        download_url: "#",
        size: "1.5 MB",
        data: {
          totalOrders: 156,
          completed: 120,
          pending: 20,
          cancelled: 16,
          pointOfSale: "Supermarché Abidjan",
          totalRevenue: 4500000,
          averageOrderValue: 28846,
          chartData: [
            { name: 'Sem 1', commandes: 35, revenu: 1200000 },
            { name: 'Sem 2', commandes: 42, revenu: 1500000 },
            { name: 'Sem 3', commandes: 40, revenu: 1100000 },
            { name: 'Sem 4', commandes: 39, revenu: 700000 }
          ],
          byStatus: [
            { name: 'Livrées', value: 120 },
            { name: 'En attente', value: 20 },
            { name: 'Annulées', value: 16 }
          ],
          byCategory: [
            { name: 'Céréales', value: 45, revenu: 2025000 },
            { name: 'Huiles', value: 30, revenu: 1350000 },
            { name: 'Épicerie', value: 15, revenu: 675000 },
            { name: 'Boissons', value: 10, revenu: 450000 }
          ]
        }
      },
      {
        id: 5,
        title: "Analyse fournisseurs",
        type: "fournisseurs",
        period: "Semestre 1 2023",
        generated_at: "2023-07-10T11:10:00Z",
        download_url: "#",
        size: "1.8 MB",
        data: {
          totalSuppliers: 12,
          activeSuppliers: 8,
          totalProducts: 156,
          pointOfSale: "Supermarché Abidjan",
          chartData: [
            { name: 'Jan', commandes: 15, produits: 45 },
            { name: 'Fév', commandes: 18, produits: 52 },
            { name: 'Mar', commandes: 22, produits: 68 },
            { name: 'Avr', commandes: 25, produits: 72 },
            { name: 'Mai', commandes: 28, produits: 85 },
            { name: 'Juin', commandes: 30, produits: 92 }
          ],
          bySupplier: [
            { name: 'Importateur Adjamé', value: 35, produits: 45 },
            { name: 'Huilerie Locale', value: 25, produits: 32 },
            { name: 'Grossiste Yopougon', value: 20, produits: 28 },
            { name: 'Autres', value: 20, produits: 51 }
          ],
          byCategory: [
            { name: 'Céréales', value: 45, fournisseurs: 4 },
            { name: 'Huiles', value: 30, fournisseurs: 3 },
            { name: 'Épicerie', value: 15, fournisseurs: 3 },
            { name: 'Boissons', value: 10, fournisseurs: 2 }
          ]
        }
      }
    ];

    setPointsOfSale(mockPointsOfSale);
    setCategories(mockCategories);
    setReports(mockReports);
    setIsLoading(false);
  }, []);

  // Filtrage des rapports
  const filteredReports = reports.filter(report => {
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
  const generateReport = (type: string) => {
    setIsGenerating(true);
    
    // Simulation de génération
    setTimeout(() => {
      const newReport: Report = {
        id: reports.length + 1,
        title: `Nouveau rapport ${type}`,
        type: type as 'ventes' | 'stocks' | 'clients' | 'performance' | 'commandes' | 'fournisseurs',
        period: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        generated_at: new Date().toISOString(),
        download_url: "#",
        size: `${Math.random().toFixed(1)} MB`,
        data: {}
      };
      
      setReports([newReport, ...reports]);
      setIsGenerating(false);
    }, 2000);
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
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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

        {report.type === 'ventes' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-700">Total des ventes</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {report.data.total.toLocaleString('fr-FR')} FCFA
                </p>
                <p className={`text-sm ${report.data.evolution.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {report.data.evolution} vs période précédente
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-lg font-semibold text-gray-700">Produit le plus vendu</h3>
                <p className="text-2xl font-bold text-green-600">
                  {report.data.byProduct[0].name}
                </p>
                <p className="text-sm text-gray-600">
                  {report.data.byProduct[0].value.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-700">Catégorie principale</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {report.data.byCategory[0].name}
                </p>
                <p className="text-sm text-gray-600">
                  {report.data.byCategory[0].value}% des ventes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Ventes par semaine</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} FCFA`, 'Ventes']}
                        labelFormatter={(label) => `Semaine ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="ventes" fill="#8884d8" name="Ventes" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Répartition par catégorie</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={report.data.byCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {report.data.byCategory.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Part']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Détail des ventes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.data.tableData.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.produit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{item.category}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantite}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.montant.toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {report.type === 'stocks' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-700">Produits en stock</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {report.data.totalProducts}
                </p>
                <p className="text-sm text-gray-600">Références différentes</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h3 className="text-lg font-semibold text-gray-700">Stocks critiques</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {report.data.lowStock}
                </p>
                <p className="text-sm text-gray-600">Produits sous le seuil</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-lg font-semibold text-gray-700">Catégorie principale</h3>
                <p className="text-2xl font-bold text-green-600">
                  {report.data.byCategory[0].name}
                </p>
                <p className="text-sm text-gray-600">
                  {report.data.byCategory[0].value}% du stock total
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Niveaux de stock</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="stock" fill="#8884d8" name="Stock actuel" />
                      <Bar dataKey="seuil" fill="#ff8042" name="Seuil minimum" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Statut des produits</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={report.data.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {report.data.statusDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} produits`, 'Quantité']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Stock par catégorie</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={report.data.byCategory}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {report.type === 'clients' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-700">Clients actifs</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {report.data.newClients + report.data.returningClients}
                </p>
                <p className="text-sm text-gray-600">Sur la période</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-700">Nouveaux clients</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {report.data.newClients}
                </p>
                <p className="text-sm text-gray-600">Première commande</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-lg font-semibold text-gray-700">Clients fidèles</h3>
                <p className="text-3xl font-bold text-green-600">
                  {report.data.returningClients}
                </p>
                <p className="text-sm text-gray-600">Commandes répétées</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Évolution mensuelle</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={report.data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="nouveaux" stroke="#8884d8" name="Nouveaux" />
                      <Line type="monotone" dataKey="retours" stroke="#82ca9d" name="Clients fidèles" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Répartition géographique</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={report.data.byRegion}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {report.data.byRegion.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Part']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Clients par commune</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.data.byCommune}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Clients" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {report.type === 'commandes' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-700">Total commandes</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {report.data.totalOrders}
                </p>
                <p className="text-sm text-gray-600">Sur la période</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-lg font-semibold text-gray-700">Revenu total</h3>
                <p className="text-3xl font-bold text-green-600">
                  {report.data.totalRevenue.toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-sm text-gray-600">Chiffre d'affaires</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-700">Valeur moyenne</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {report.data.averageOrderValue.toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-sm text-gray-600">Par commande</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Commandes par semaine</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="commandes" fill="#8884d8" name="Commandes" />
                      <Line yAxisId="right" type="monotone" dataKey="revenu" stroke="#82ca9d" name="Revenu (FCFA)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Statut des commandes</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={report.data.byStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {report.data.byStatus.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} commandes`, 'Quantité']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Revenu par catégorie</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.data.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} FCFA`, 'Revenu']} />
                    <Legend />
                    <Bar dataKey="revenu" fill="#8884d8" name="Revenu (FCFA)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {report.type === 'fournisseurs' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-700">Fournisseurs</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {report.data.totalSuppliers}
                </p>
                <p className="text-sm text-gray-600">Dont {report.data.activeSuppliers} actifs</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-lg font-semibold text-gray-700">Produits fournis</h3>
                <p className="text-3xl font-bold text-green-600">
                  {report.data.totalProducts}
                </p>
                <p className="text-sm text-gray-600">Références différentes</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-700">Fournisseur principal</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {report.data.bySupplier[0].name}
                </p>
                <p className="text-sm text-gray-600">
                  {report.data.bySupplier[0].value}% des approvisionnements
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Activité mensuelle</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="commandes" fill="#8884d8" name="Commandes" />
                      <Line yAxisId="right" type="monotone" dataKey="produits" stroke="#82ca9d" name="Produits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Répartition par fournisseur</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={report.data.bySupplier}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {report.data.bySupplier.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Part']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Produits par catégorie</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.data.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Part des produits (%)" />
                    <Bar dataKey="fournisseurs" fill="#82ca9d" name="Nombre de fournisseurs" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
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
          
          <div className="relative">
            <button
              disabled={isGenerating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              <FileText size={16} className="mr-2" />
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
                  <option key={pos.id} value={pos.name}>{pos.name}</option>
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
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Rapports par type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Ventes', value: reports.filter(r => r.type === 'ventes').length, icon: <ShoppingBag /> },
                      { name: 'Stocks', value: reports.filter(r => r.type === 'stocks').length, icon: <Package /> },
                      { name: 'Clients', value: reports.filter(r => r.type === 'clients').length, icon: <Users /> },
                      { name: 'Commandes', value: reports.filter(r => r.type === 'commandes').length, icon: <ShoppingCart /> },
                      { name: 'Fournisseurs', value: reports.filter(r => r.type === 'fournisseurs').length, icon: <Truck /> }
                    ]}
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
                  data={[
                    { name: 'Mai', générés: 3, téléchargés: 8 },
                    { name: 'Juin', générés: 5, téléchargés: 12 },
                    { name: 'Juil', générés: 2, téléchargés: 6 },
                    { name: 'Août', générés: 4, téléchargés: 9 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
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
                  {reports.slice(0, 5).map((report) => (
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
                        {report.data.pointOfSale || 'Tous'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.period}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.generated_at).toLocaleDateString('fr-FR')}
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
      )}
    </div>
  );
};

export default ReportPage;