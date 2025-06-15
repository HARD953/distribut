"use client"
import React, { useState, useMemo } from 'react';
import { 
  MapPin, Plus, Search, Filter, Edit3, Trash2, Eye, 
  Phone, Mail, User, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Clock, Star, MoreVertical, Download,
  Navigation, Building2, Users, ChevronLeft, X
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Chargement dynamique de la carte pour éviter les problèmes SSR
const MapWithNoSSR = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg animate-pulse">
      <div className="text-center space-y-2">
        <Navigation size={48} className="text-blue-500 mx-auto" />
        <p className="text-blue-700 font-medium">Chargement de la carte...</p>
      </div>
    </div>
  )
});

const PointsVenteManagement = () => {
  const [activeView, setActiveView] = useState('liste');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('tous');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Données d'exemple pour les points de vente
  const [pointsVente, setPointsVente] = useState([
    {
      id: 1,
      nom: "Supermarché Plateau",
      proprietaire: "Jean Kouadio",
      telephone: "+225 07 12 34 56 78",
      email: "plateau@supermarket.ci",
      adresse: "Boulevard Clozel, Plateau, Abidjan",
      type: "Supermarché",
      statut: "actif",
      dateInscription: "2024-01-15",
      chiffreAffaires: 2500000,
      commandesMois: 45,
      noteEvaluation: 4.8,
      latitude: 5.3197,
      longitude: -4.0267
    },
    {
      id: 2,
      nom: "Boutique Cocody",
      proprietaire: "Marie Diabaté",
      telephone: "+225 05 87 65 43 21",
      email: "cocody@boutique.ci",
      adresse: "Riviera M'Badon, Cocody, Abidjan",
      type: "Boutique",
      statut: "actif",
      dateInscription: "2024-02-20",
      chiffreAffaires: 850000,
      commandesMois: 28,
      noteEvaluation: 4.5,
      latitude: 5.3440,
      longitude: -3.9866
    },
    {
      id: 3,
      nom: "Grossiste Adjamé",
      proprietaire: "Amadou Traoré",
      telephone: "+225 01 23 45 67 89",
      email: "adjame@grossiste.ci",
      adresse: "Marché d'Adjamé, Adjamé, Abidjan",
      type: "Grossiste",
      statut: "suspendu",
      dateInscription: "2023-11-10",
      chiffreAffaires: 4200000,
      commandesMois: 12,
      noteEvaluation: 3.8,
      latitude: 5.3719,
      longitude: -4.0228
    },
    {
      id: 4,
      nom: "Épicerie Yopougon",
      proprietaire: "Fatou Ouattara",
      telephone: "+225 09 88 77 66 55",
      email: "yopougon@epicerie.ci",
      adresse: "Quartier Sicogi, Yopougon, Abidjan",
      type: "Épicerie",
      statut: "en_attente",
      dateInscription: "2024-05-01",
      chiffreAffaires: 320000,
      commandesMois: 8,
      noteEvaluation: 4.2,
      latitude: 5.3364,
      longitude: -4.0677
    }
  ]);

  const [newPoint, setNewPoint] = useState({
    nom: '',
    proprietaire: '',
    telephone: '',
    email: '',
    adresse: '',
    type: 'Boutique'
  });

  // Nouvelle palette de couleurs plus vibrantes
  const colors = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
    secondary: 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border border-gray-200',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white',
    warning: 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white',
    info: 'bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white',
    purple: 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white'
  };

  // Statistiques avec des dégradés plus vibrants
  const stats = [
    {
      title: 'Total Points de Vente',
      value: pointsVente.length.toString(),
      change: '+12%',
      bg: 'bg-gradient-to-br from-indigo-600 to-blue-500',
      border: 'border-indigo-500',
      textColor: 'text-white',
      icon: Building2,
      iconColor: 'text-indigo-200'
    },
    {
      title: 'Points Actifs',
      value: pointsVente.filter(p => p.statut === 'actif').length.toString(),
      change: '+8%',
      bg: 'bg-gradient-to-br from-emerald-600 to-teal-500',
      border: 'border-emerald-500',
      textColor: 'text-white',
      icon: CheckCircle,
      iconColor: 'text-emerald-200'
    },
    {
      title: 'En Attente',
      value: pointsVente.filter(p => p.statut === 'en_attente').length.toString(),
      change: '+2',
      bg: 'bg-gradient-to-br from-amber-500 to-yellow-400',
      border: 'border-amber-400',
      textColor: 'text-white',
      icon: Clock,
      iconColor: 'text-amber-200'
    },
    {
      title: 'CA Moyen/Mois',
      value: '₣ 1.97M',
      change: '+15%',
      bg: 'bg-gradient-to-br from-rose-500 to-pink-500',
      border: 'border-rose-400',
      textColor: 'text-white',
      icon: TrendingUp,
      iconColor: 'text-rose-200'
    }
  ];

  // Filtrer les points de vente
  const filteredPoints = useMemo(() => {
    return pointsVente.filter(point => {
      const matchesSearch = point.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           point.proprietaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           point.adresse.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'tous' || point.statut === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [pointsVente, searchTerm, filterStatus]);

  // Fonction pour obtenir le style du statut
  const getStatusStyle = (statut) => {
    switch (statut) {
      case 'actif':
        return 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border-emerald-200';
      case 'suspendu':
        return 'bg-gradient-to-r from-red-100 to-rose-50 text-red-800 border-red-200';
      case 'en_attente':
        return 'bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800 border-amber-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-200';
    }
  };

  // Fonction pour obtenir l'icône du statut
  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'actif':
        return <CheckCircle size={14} className="text-emerald-500" />;
      case 'suspendu':
        return <AlertCircle size={14} className="text-red-500" />;
      case 'en_attente':
        return <Clock size={14} className="text-amber-500" />;
      default:
        return null;
    }
  };

  // Gérer l'ajout d'un nouveau point de vente
  const handleAddPoint = () => {
    if (newPoint.nom && newPoint.proprietaire && newPoint.telephone && newPoint.email && newPoint.adresse) {
      const newId = Math.max(...pointsVente.map(p => p.id)) + 1;
      const nouveauPoint = {
        ...newPoint,
        id: newId,
        statut: 'en_attente',
        dateInscription: new Date().toISOString().split('T')[0],
        chiffreAffaires: 0,
        commandesMois: 0,
        noteEvaluation: 0,
        latitude: 5.3197 + (Math.random() - 0.5) * 0.1,
        longitude: -4.0267 + (Math.random() - 0.5) * 0.1
      };
      
      setPointsVente([...pointsVente, nouveauPoint]);
      setNewPoint({
        nom: '',
        proprietaire: '',
        telephone: '',
        email: '',
        adresse: '',
        type: 'Boutique'
      });
      setShowAddModal(false);
    }
  };

  // Vue Liste
  const ListView = () => (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`p-5 rounded-xl border ${stat.bg} ${stat.border} shadow-md transition-all hover:shadow-lg hover:scale-[1.02]`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className={`p-2 rounded-full ${stat.iconColor} bg-white/10`}>
                  <stat.icon size={20} />
                </div>
                <div className={`text-xs font-semibold ${stat.textColor}`}>{stat.change}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barre d'outils */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher un point de vente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="suspendu">Suspendus</option>
              <option value="en_attente">En attente</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveView('carte')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${colors.secondary} hover:shadow-md hover:bg-gray-100`}
            >
              <Navigation size={16} className="text-blue-600" />
              <span>Vue Carte</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${colors.primary} hover:shadow-lg shadow-blue-500/20`}
            >
              <Plus size={16} />
              <span>Ajouter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Liste des points de vente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Point de Vente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Propriétaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  CA/Mois
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPoints.map((point) => (
                <tr key={point.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center shadow-sm">
                        <MapPin className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{point.nom}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Navigation size={12} className="mr-1 text-blue-400" />
                          {point.adresse.split(',')[0]}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{point.proprietaire}</div>
                      <div className="text-xs text-gray-500">{point.telephone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border border-indigo-200">
                      {point.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(point.statut)}`}>
                      {getStatusIcon(point.statut)}
                      <span className="capitalize">{point.statut.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ₣ {(point.chiffreAffaires / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-500">{point.commandesMois} commandes</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400 fill-current" size={14} />
                      <span className="text-sm font-medium text-gray-900">{point.noteEvaluation}</span>
                      <span className="text-xs text-gray-400">/5</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedPoint(point)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hover:shadow-sm"
                        title="Voir détails"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors hover:shadow-sm" 
                        title="Modifier"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:shadow-sm" 
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
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

  // Vue Carte
  const MapView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Carte des Points de Vente</h3>
        <button 
          onClick={() => setActiveView('liste')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${colors.secondary} hover:shadow-md hover:bg-gray-100`}
        >
          <ChevronLeft size={16} className="text-gray-600" />
          <span>Retour à la liste</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[600px]">
        <MapWithNoSSR 
          points={filteredPoints} 
          center={[5.3197, -4.0267]} 
          zoom={12} 
          onPointClick={setSelectedPoint}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPoints.slice(0, 4).map((point) => (
          <div 
            key={point.id} 
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group hover:border-blue-200"
            onClick={() => setSelectedPoint(point)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${getStatusStyle(point.statut)} shadow-sm`}>
                <MapPin size={16} className={point.statut === 'actif' ? 'text-emerald-500' : point.statut === 'suspendu' ? 'text-red-500' : 'text-amber-500'} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{point.nom}</h4>
                <p className="text-xs text-gray-500">{point.type}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 truncate">{point.adresse.split(',')[0]}</div>
            <div className="flex items-center justify-between mt-3">
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(point.statut)}`}>
                {point.statut.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-1">
                <Star className="text-yellow-400 fill-current" size={14} />
                <span className="text-xs font-medium">{point.noteEvaluation}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Gestion des Points de Vente
        </h1>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:shadow-sm transition-all">
            <Download size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:shadow-sm transition-all">
            <Filter size={20} />
          </button>
        </div>
      </header>

      {activeView === 'liste' ? <ListView /> : <MapView />}

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white">Ajouter un Point de Vente</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du Point de Vente <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={newPoint.nom}
                    onChange={(e) => setNewPoint({...newPoint, nom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ex: Supermarché Central"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du Propriétaire <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={newPoint.proprietaire}
                    onChange={(e) => setNewPoint({...newPoint, proprietaire: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ex: Jean Kouadio"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel"
                    value={newPoint.telephone}
                    onChange={(e) => setNewPoint({...newPoint, telephone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="+225 XX XX XX XX XX"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email"
                    value={newPoint.email}
                    onChange={(e) => setNewPoint({...newPoint, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de Commerce
                  </label>
                  <select 
                    value={newPoint.type}
                    onChange={(e) => setNewPoint({...newPoint, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                  >
                    <option value="Boutique">Boutique</option>
                    <option value="Supermarché">Supermarché</option>
                    <option value="Épicerie">Épicerie</option>
                    <option value="Grossiste">Grossiste</option>
                    <option value="Pharmacie">Pharmacie</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse Complète <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={newPoint.adresse}
                  onChange={(e) => setNewPoint({...newPoint, adresse: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Adresse complète avec quartier, commune, ville"
                  required
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-lg transition-all ${colors.secondary} hover:shadow-md`}
              >
                Annuler
              </button>
              <button 
                onClick={handleAddPoint}
                className={`px-4 py-2 rounded-lg transition-all ${colors.primary} hover:shadow-lg shadow-blue-500/20`}
                disabled={!newPoint.nom || !newPoint.proprietaire || !newPoint.telephone || !newPoint.email || !newPoint.adresse}
              >
                Ajouter le Point de Vente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {selectedPoint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusStyle(selectedPoint.statut)}`}>
                  <MapPin size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">{selectedPoint.nom}</h3>
              </div>
              <button 
                onClick={() => setSelectedPoint(null)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">Informations Générales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Propriétaire</p>
                          <p className="font-medium">{selectedPoint.proprietaire}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Phone size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Téléphone</p>
                          <p className="font-medium">{selectedPoint.telephone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Mail size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{selectedPoint.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Building2 size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-medium">{selectedPoint.type}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">Localisation</h4>
                    <div className="h-48 rounded-lg overflow-hidden border border-gray-200">
                      <MapWithNoSSR 
                        points={[selectedPoint]} 
                        center={[selectedPoint.latitude, selectedPoint.longitude]} 
                        zoom={15} 
                        singleMarker
                      />
                    </div>
                    <div className="mt-3 text-sm text-gray-600 flex items-start gap-2">
                      <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{selectedPoint.adresse}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-4">Statistiques</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          ₣ {(selectedPoint.chiffreAffaires / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-sm text-gray-600">Chiffre d'affaires mensuel</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">{selectedPoint.commandesMois}</div>
                        <div className="text-sm text-gray-600">Commandes ce mois</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">Évaluation</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1,2,3,4,5].map((star) => (
                          <Star 
                            key={star} 
                            size={20} 
                            className={`${star <= selectedPoint.noteEvaluation ? 'text-yellow-400 fill-current' : 'text-gray-300'} transition-colors`} 
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold">{selectedPoint.noteEvaluation}/5</span>
                    </div>
                    <div className="text-sm text-gray-600">Basé sur 24 avis clients</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">Informations Complémentaires</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Date d'inscription</p>
                        <p className="font-medium">{selectedPoint.dateInscription}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Statut</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(selectedPoint.statut)}`}>
                          {getStatusIcon(selectedPoint.statut)}
                          <span className="capitalize">{selectedPoint.statut.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPoint(null)}
                className={`px-4 py-2 rounded-lg transition-all ${colors.secondary} hover:shadow-md`}
              >
                Fermer
              </button>
              <button className={`px-4 py-2 rounded-lg transition-all ${colors.primary} hover:shadow-lg shadow-blue-500/20`}>
                Modifier les informations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsVenteManagement;