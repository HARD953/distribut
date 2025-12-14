"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Search, X, Save, ChevronDown } from 'lucide-react';

interface District {
  id: number;
  nom: string;
  villes_count: number;
  date_creation: string;
}

interface Ville {
  id: number;
  nom: string;
  district: number;
  district_nom: string;
  quartiers_count: number;
  date_creation: string;
}

interface Quartier {
  id: number;
  nom: string;
  ville: number;
  ville_nom: string;
  district_nom: string;
  date_creation: string;
}

const LocalisationManagement = () => {
  const [activeTab, setActiveTab] = useState<'districts' | 'villes' | 'quartiers'>('districts');
  const [districts, setDistricts] = useState<District[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  
  // États pour les formulaires
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    nom: '',
    district: '',
    ville: ''
  });

  // Charger les données
  useEffect(() => {
    loadDistricts();
    loadVilles();
    loadQuartiers();
  }, []);

  const loadDistricts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access');
      const response = await fetch('https://api.lanfialink.com/api/districts/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDistricts(data);
      }
    } catch (error) {
      console.error('Erreur chargement districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVilles = async (districtId?: number) => {
    try {
      const token = localStorage.getItem('access');
      let url = 'https://api.lanfialink.com/api/villes/';
      if (districtId) {
        url += `?district=${districtId}`;
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVilles(data);
      } 
    } catch (error) {
      console.error('Erreur chargement villes:', error);
    }
  };

  const loadQuartiers = async (villeId?: number) => {
    try {
      const token = localStorage.getItem('access');
      let url = 'https://api.lanfialink.com/api/quartiers/';
      if (villeId) {
        url += `?ville=${villeId}`;
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setQuartiers(data);
      }
    } catch (error) {
      console.error('Erreur chargement quartiers:', error);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ nom: '', district: '', ville: '' });
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      nom: item.nom,
      district: item.district?.toString() || '',
      ville: item.ville?.toString() || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('access');
      const url = editingItem 
        ? `https://api.lanfialink.com/api/${activeTab}/${editingItem.id}/`
        : `https://api.lanfialink.com/api/${activeTab}/`;
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const payload: any = { nom: formData.nom };
      if (activeTab === 'villes') {
        payload.district = parseInt(formData.district);
      } else if (activeTab === 'quartiers') {
        payload.ville = parseInt(formData.ville);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowForm(false);
        // Recharger les données
        loadDistricts();
        loadVilles();
        loadQuartiers();
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    
    try {
      const token = localStorage.getItem('access');
      const response = await fetch(`https://api.lanfialink.com/api/${activeTab}/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Recharger les données
        loadDistricts();
        loadVilles();
        loadQuartiers();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const filteredData = {
    districts: districts.filter(d => 
      d.nom.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    villes: villes.filter(v => 
      v.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.district_nom.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    quartiers: quartiers.filter(q =>
      q.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.ville_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.district_nom.toLowerCase().includes(searchTerm.toLowerCase())
    )
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion Localisation</h1>
          <p className="text-gray-600">Gérez les districts, villes et quartiers</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'districts', label: 'Districts', count: districts.length },
            { id: 'villes', label: 'Villes', count: villes.length },
            { id: 'quartiers', label: 'Quartiers', count: quartiers.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? 'Modifier' : 'Nouveau'} {activeTab.slice(0, -1)}
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {activeTab === 'villes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <select
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Sélectionner un district</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {activeTab === 'quartiers' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <select
                    required
                    value={formData.ville}
                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Sélectionner une ville</option>
                    {villes.map(ville => (
                      <option key={ville.id} value={ville.id}>
                        {ville.nom} - {ville.district_nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Save size={20} />
                  <span>{editingItem ? 'Modifier' : 'Créer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau de données */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  {activeTab === 'villes' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District
                    </th>
                  )}
                  {activeTab === 'quartiers' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ville
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        District
                      </th>
                    </>
                  )}
                  {(activeTab === 'districts' || activeTab === 'villes') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {activeTab === 'districts' ? 'Villes' : 'Quartiers'}
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData[activeTab].map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {item.nom}
                        </span>
                      </div>
                    </td>
                    
                    {activeTab === 'villes' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {(item as Ville).district_nom}
                      </td>
                    )}
                    
                    {activeTab === 'quartiers' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {(item as Quartier).ville_nom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {(item as Quartier).district_nom}
                        </td>
                      </>
                    )}
                    
                    {(activeTab === 'districts' || activeTab === 'villes') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {activeTab === 'districts' 
                          ? (item as District).villes_count 
                          : (item as Ville).quartiers_count
                        }
                      </td>
                    )}
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
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
        )}
        
        {filteredData[activeTab].length === 0 && !loading && (
          <div className="text-center py-8">
            <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Aucun {activeTab.slice(0, -1)} trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalisationManagement;