import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Lock, Bell, CreditCard, Globe, Database, 
  Mail, Shield, Info, Save, ChevronDown, Loader2,ChevronLeft,
} from 'lucide-react';

import { useAuth } from './AuthContext';
import { apiService } from './ApiService';


const ParametresManagement = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('compte');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notificationsEnabled: true,
    language: 'fr',
    timezone: 'Africa/Abidjan',
    currency: 'XOF',
  });

  // Sections disponibles
  const sections = [
    { id: 'compte', icon: User, label: 'Compte' },
    { id: 'securite', icon: Lock, label: 'Sécurité' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'paiement', icon: CreditCard, label: 'Paiement' },
    { id: 'international', icon: Globe, label: 'International' },
    { id: 'sauvegarde', icon: Database, label: 'Sauvegarde' },
    { id: 'confidentialite', icon: Shield, label: 'Confidentialité' },
    { id: 'apropos', icon: Info, label: 'À propos' },
  ];

  useEffect(() => {
    // Simuler le chargement des paramètres
    setIsLoading(true);
    setTimeout(() => {
      setSettings({
        language: 'fr',
        timezone: 'Africa/Abidjan',
        currency: 'XOF',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Ici, vous enverriez les données au backend
      // await apiService.patch('/settings/', formData);
      console.log('Settings to update:', formData);
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Paramètres mis à jour avec succès!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Une erreur est survenue lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'compte':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Informations du compte</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={user?.username || ''}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Photo de profil</h3>
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user?.email ? (
                    <span className="text-2xl font-bold text-gray-600">
                      {user.email.substring(0, 2).toUpperCase()}
                    </span>
                  ) : (
                    <User size={32} className="text-gray-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Changer la photo
                  </button>
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-800">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'securite':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Changer le mot de passe</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                  <input
                    type="password"
                    name="currentPassword"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    name="newPassword"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Authentification à deux facteurs</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Authentification 2FA</p>
                  <p className="text-sm text-gray-600">Ajoutez une couche de sécurité supplémentaire à votre compte</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Activer
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Préférences de notification</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications par email</p>
                    <p className="text-sm text-gray-600">Recevoir des notifications importantes par email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="notificationsEnabled"
                      className="sr-only peer" 
                      checked={formData.notificationsEnabled}
                      onChange={handleChange}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications SMS</p>
                    <p className="text-sm text-gray-600">Recevoir des alertes importantes par SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications push</p>
                    <p className="text-sm text-gray-600">Recevoir des notifications sur votre appareil</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Alertes de stock</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertes de rupture</p>
                    <p className="text-sm text-gray-600">Recevoir une alerte quand un produit est en rupture</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertes de stock faible</p>
                    <p className="text-sm text-gray-600">Recevoir une alerte quand un produit est en stock faible</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'international':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Langue et région</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
                  <select
                    name="language"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.language}
                    onChange={handleChange}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
                  <select
                    name="timezone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.timezone}
                    onChange={handleChange}
                  >
                    <option value="Africa/Abidjan">Abidjan (UTC+0)</option>
                    <option value="Africa/Lagos">Lagos (UTC+1)</option>
                    <option value="Europe/Paris">Paris (UTC+2)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select
                    name="currency"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.currency}
                    onChange={handleChange}
                  >
                    <option value="XOF">Franc CFA (XOF)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar US ($)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'confidentialite':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Paramètres de confidentialité</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Partage de données analytiques</p>
                    <p className="text-sm text-gray-600">Permettre le partage anonyme de données pour améliorer le service</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Publicité personnalisée</p>
                    <p className="text-sm text-gray-600">Permettre les publicités basées sur votre activité</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Export de données</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Vous pouvez demander une exportation de toutes vos données personnelles stockées dans notre système.
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Exporter mes données
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'apropos':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">LT</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">LanfiaTech</h3>
                  <p className="text-gray-600">Version 1.0.0</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">À propos</h4>
                  <p className="text-sm text-gray-600">
                    LanfiaTech est une plateforme de gestion complète pour les points de vente et distributeurs en Afrique.
                    Notre mission est de digitaliser et simplifier la gestion des petites et moyennes entreprises.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Conditions d'utilisation</h4>
                  <p className="text-sm text-gray-600">
                    En utilisant ce service, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                  </p>
                  <div className="flex space-x-4 mt-2">
                    <button className="text-blue-600 text-sm">Lire les conditions</button>
                    <button className="text-blue-600 text-sm">Politique de confidentialité</button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Support</h4>
                  <p className="text-sm text-gray-600">
                    Pour toute question ou problème, contactez notre équipe de support.
                  </p>
                  <button className="text-blue-600 text-sm mt-2">Contacter le support</button>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-4">{sections.find(s => s.id === activeSection)?.label}</h3>
              <p className="text-gray-600">
                Cette section est en cours de développement et sera disponible prochainement.
              </p>
            </div>
          </div>
        );
    }
  };

  if (isLoading && Object.keys(settings).length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="md:flex">
        
        {/* Sidebar */}
        <div className="md:w-64 border-r border-gray-200 bg-gray-50">
          <div className="p-6">
            <h2 className="text-xl font-bold flex items-center">
              <Settings className="mr-2" size={20} />
              Paramètres
            </h2>
          </div>
          
          <nav className="space-y-1 px-2 pb-6">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === section.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <section.icon size={18} className="flex-shrink-0" />
                <span className={`${activeSection === section.id ? 'font-medium' : 'font-normal'}`}>
                  {section.label}
                </span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <form onSubmit={handleSubmit}>
            {renderSectionContent()}
            
            {(activeSection !== 'apropos' && activeSection !== 'sauvegarde') && (
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={18} />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParametresManagement;