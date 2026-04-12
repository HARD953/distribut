"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Search, X, Save, Building2, Map, Globe, AlertTriangle } from 'lucide-react';

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
  const [districts, setDistricts] = useState<District[]>([
    { id: 1, nom: 'Abidjan', villes_count: 5, date_creation: '2024-01-15' },
    { id: 2, nom: 'Bouaké', villes_count: 3, date_creation: '2024-01-16' },
    { id: 3, nom: 'Yamoussoukro', villes_count: 4, date_creation: '2024-01-17' },
  ]);
  const [villes, setVilles] = useState<Ville[]>([
    { id: 1, nom: 'Cocody', district: 1, district_nom: 'Abidjan', quartiers_count: 8, date_creation: '2024-01-17' },
    { id: 2, nom: 'Yopougon', district: 1, district_nom: 'Abidjan', quartiers_count: 12, date_creation: '2024-01-18' },
    { id: 3, nom: 'Plateau', district: 1, district_nom: 'Abidjan', quartiers_count: 6, date_creation: '2024-01-19' },
  ]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([
    { id: 1, nom: 'Angré', ville: 1, ville_nom: 'Cocody', district_nom: 'Abidjan', date_creation: '2024-01-19' },
    { id: 2, nom: 'Riviera', ville: 1, ville_nom: 'Cocody', district_nom: 'Abidjan', date_creation: '2024-01-20' },
    { id: 3, nom: 'Ananeraie', ville: 2, ville_nom: 'Yopougon', district_nom: 'Abidjan', date_creation: '2024-01-21' },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    nom: '',
    district: '',
    ville: ''
  });

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

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setShowForm(false);
      setLoading(false);
    }, 1000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
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

  const tabInfo = {
    districts: { label: 'Districts', count: districts.length, icon: Globe, color: '#2D5A3D' },
    villes: { label: 'Villes', count: villes.length, icon: Building2, color: '#C07A2F' },
    quartiers: { label: 'Quartiers', count: quartiers.length, icon: MapPin, color: '#9A5E1A' }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#FAF7F0' }}>
      {/* Kente top accent */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-50"
        style={{
          background: 'linear-gradient(90deg,#9A5E1A 0%,#D4A843 25%,#9A5E1A 50%,#D4A843 75%,#9A5E1A 100%)',
        }}
      />

      {/* Header avec motif africain */}
      <div className="relative overflow-hidden rounded-2xl p-8 mb-6" style={{ background: '#2D5A3D' }}>
        {/* Pattern de fond */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.07 }}>
          <defs>
            <pattern id="kdia2" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#FAF7F0" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kdia2)" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#C07A2F' }}>
                <Map size={20} style={{ color: '#FAF7F0' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#FAF7F0' }}>
                  Découpage territorial
                </h1>
                <p className="text-sm" style={{ color: 'rgba(250,247,240,.5)' }}>
                  Gérez les districts, villes et quartiers de Côte d'Ivoire
                </p>
              </div>
            </div>
            {/* Accent bar */}
            <div className="w-16 h-1 rounded-full" style={{ background: '#F0C878' }} />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: '#A89880' }} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl border-0 text-sm w-64"
                style={{
                  background: '#F2EDE0',
                  color: '#2A1A08',
                  outline: 'none'
                }}
              />
            </div>
            
            {/* Add button */}
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
              style={{ background: '#C07A2F', color: 'white' }}
            >
              <Plus size={18} />
              <span>Ajouter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs avec style africain */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden" style={{ border: '1px solid #E8D9B8' }}>
        <div className="flex border-b" style={{ borderColor: '#E8D9B8' }}>
          {(Object.keys(tabInfo) as Array<keyof typeof tabInfo>).map((tabKey) => {
            const tab = tabInfo[tabKey];
            const Icon = tab.icon;
            const isActive = activeTab === tabKey;
            
            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className="flex-1 flex items-center justify-center gap-3 py-4 px-6 font-medium text-sm transition-all relative"
                style={{
                  color: isActive ? tab.color : '#A89880',
                  background: isActive ? '#F2EDE0' : 'transparent'
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: isActive ? tab.color : '#E8D9B8',
                    color: isActive ? 'white' : '#7A6A52'
                  }}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ background: tab.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Form avec style africain */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" style={{ border: '2px solid #D4C4A0' }}>
            {/* Header avec kente */}
            <div className="relative overflow-hidden rounded-t-2xl p-6" style={{ background: '#2D5A3D' }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{
                background: 'linear-gradient(90deg,#9A5E1A 0%,#D4A843 50%,#9A5E1A 100%)',
              }} />
              
              <div className="relative flex justify-between items-center">
                <h3 className="text-xl font-bold" style={{ color: '#FAF7F0' }}>
                  {editingItem ? 'Modifier' : 'Nouveau'} {activeTab.slice(0, -1)}
                </h3>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: '#FAF7F0' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Form content */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A6A52' }}>
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-0 text-sm"
                  style={{
                    background: '#F2EDE0',
                    color: '#2A1A08',
                    outline: 'none'
                  }}
                  placeholder="Entrez le nom..."
                />
              </div>
              
              {activeTab === 'villes' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A6A52' }}>
                    District
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-0 text-sm"
                    style={{
                      background: '#F2EDE0',
                      color: '#2A1A08',
                      outline: 'none'
                    }}
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
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A6A52' }}>
                    Ville
                  </label>
                  <select
                    value={formData.ville}
                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-0 text-sm"
                    style={{
                      background: '#F2EDE0',
                      color: '#2A1A08',
                      outline: 'none'
                    }}
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
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: '#F2EDE0',
                    color: '#7A6A52',
                    border: '1px solid #E8D9B8'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 disabled:opacity-50"
                  style={{
                    background: '#2D5A3D',
                    color: 'white'
                  }}
                >
                  <Save size={18} />
                  <span>{editingItem ? 'Modifier' : 'Créer'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table avec style africain */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #E8D9B8' }}>
        {loading ? (
          <div className="flex flex-col justify-center items-center p-12">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#C07A2F', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: '#A89880' }}>Chargement en cours...</p>
          </div>
        ) : filteredData[activeTab].length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#F2EDE0' }}>
              <MapPin size={32} style={{ color: '#C07A2F' }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: '#2A1A08' }}>Aucun résultat</p>
            <p className="text-sm" style={{ color: '#A89880' }}>
              Aucun {activeTab.slice(0, -1)} trouvé
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: '#F2EDE0' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A6A52' }}>
                    Nom
                  </th>
                  {activeTab === 'villes' && (
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A6A52' }}>
                      District
                    </th>
                  )}
                  {activeTab === 'quartiers' && (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A6A52' }}>
                        Ville
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A6A52' }}>
                        District
                      </th>
                    </>
                  )}
                  {(activeTab === 'districts' || activeTab === 'villes') && (
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A6A52' }}>
                      {activeTab === 'districts' ? 'Villes' : 'Quartiers'}
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A6A52' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData[activeTab].map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className="transition-colors"
                    style={{ 
                      borderBottom: '1px solid #E8D9B8',
                      background: idx % 2 === 0 ? 'white' : '#FDFCF9'
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F2EDE0' }}>
                          <MapPin size={18} style={{ color: '#C07A2F' }} />
                        </div>
                        <span className="font-semibold" style={{ color: '#2A1A08' }}>
                          {item.nom}
                        </span>
                      </div>
                    </td>
                    
                    {activeTab === 'villes' && (
                      <td className="px-6 py-4 text-sm" style={{ color: '#7A6A52' }}>
                        {(item as Ville).district_nom}
                      </td>
                    )}
                    
                    {activeTab === 'quartiers' && (
                      <>
                        <td className="px-6 py-4 text-sm" style={{ color: '#7A6A52' }}>
                          {(item as Quartier).ville_nom}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#7A6A52' }}>
                          {(item as Quartier).district_nom}
                        </td>
                      </>
                    )}
                    
                    {(activeTab === 'districts' || activeTab === 'villes') && (
                      <td className="px-6 py-4">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ 
                            background: '#EAF2EC',
                            color: '#2D5A3D'
                          }}
                        >
                          {activeTab === 'districts' 
                            ? (item as District).villes_count 
                            : (item as Ville).quartiers_count
                          }
                        </span>
                      </td>
                    )}
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{ background: '#F2EDE0', color: '#2D5A3D' }}
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{ background: '#FFF3E8', color: '#9A5E1A' }}
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
      </div>

      {/* Footer avec motif */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: '#F2EDE0' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#C07A2F' }} />
          <p className="text-xs" style={{ color: '#7A6A52' }}>
            © 2024 LanfiaLink · Découpage territorial Côte d'Ivoire
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocalisationManagement;