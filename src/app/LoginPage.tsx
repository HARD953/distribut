"use client";
import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { 
  Eye, EyeOff, User, Lock, ArrowRight, Loader2, 
  Shield, Zap, Globe, Users, CheckCircle, AlertTriangle,
  Building2, Smartphone, Mail, MapPin
} from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const { login, isLoading, error } = useAuth();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '' 
      }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.username.trim()) {
      newErrors.username = "L'identifiant est requis";
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    return newErrors;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setErrors({ general: result.error || 'Identifiants invalides. Veuillez réessayer.' });
      }
    } catch (error) {
      setErrors({ general: 'Erreur de connexion. Veuillez réessayer.' });
    }
  }, [formData, login, router, validateForm]);

  const features = useMemo(() => [
    {
      icon: Shield,
      title: 'Sécurité Entreprise',
      description: 'Chiffrement AES-256 et authentification multi-facteurs',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Performance Optimale',
      description: 'Temps de réponse < 100ms pour toutes les opérations',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: Globe,
      title: 'Couverture Nationale',
      description: 'Plus de 500 points de vente couverts en Côte d\'Ivoire',
      color: 'from-emerald-500 to-green-500'
    },
    {
      icon: Users,
      title: 'Gestion Centralisée',
      description: 'Supervisez tous vos canaux de distribution en temps réel',
      color: 'from-purple-500 to-pink-500'
    }
  ], []);

  const stats = useMemo(() => [
    { value: '500+', label: 'Points de Vente' },
    { value: '24/7', label: 'Disponibilité' },
    { value: '99.9%', label: 'Uptime' }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            animation: 'pan 20s linear infinite'
          }}
        />
        
        {/* Floating Shapes */}
        <div className="absolute top-1/4 -left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        
        {/* Animated Orbs */}
        <div className="absolute top-20 right-20 w-4 h-4 bg-blue-400 rounded-full animate-ping" />
        <div className="absolute bottom-40 left-40 w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute top-60 right-60 w-2 h-2 bg-emerald-400 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Enhanced Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between py-12 px-12 xl:px-16">
          <div className="max-w-2xl">
            {/* Enhanced Header */}
            <div className="mb-12">
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg border border-white/20">
                  <Building2 className="text-white" size={28} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-1">LanfiaLink.com</h1>
                  <p className="text-white/80 text-lg font-light">Plateforme de Gestion Distribution</p>
                </div>
              </div>
              
              <h2 className="text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
                Excellence en 
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Supply Chain</span>
              </h2>
              
              <p className="text-xl text-white/90 mb-8 leading-relaxed font-light">
                Solution complète de gestion des canaux de distribution, optimisation des stocks et connectivité multi-points de vente en Côte d'Ivoire.
              </p>
            </div>

            {/* Enhanced Features Grid */}
            <div className="grid grid-cols-1 gap-6 mb-12">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:transform hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="flex items-start">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-white/70 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex space-x-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/60 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/50 text-sm">
            <p>© 2024 LanfiaLink.com Côte d'Ivoire. Système certifié ISO 27001.</p>
          </div>
        </div>

        {/* Right Side - Enhanced Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <Building2 className="text-white" size={24} />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-white">LanfiaLink.com</h1>
                  <p className="text-white/70 text-sm">Distribution CI</p>
                </div>
              </div>
            </div>

            {/* Enhanced Login Card */}
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:shadow-3xl transition-all duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Lock className="text-white" size={28} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Accès Sécurisé</h2>
                <p className="text-white/70">Authentifiez-vous pour accéder au tableau de bord</p>
              </div>

              {/* Error Display */}
              {(errors.general || error) && (
                <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-start">
                  <AlertTriangle className="text-red-300 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-red-200 font-medium text-sm">Erreur d'authentification</p>
                    <p className="text-red-200/80 text-sm mt-1">{errors.general || error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div>
                  <label className="block text-white/90 text-sm font-semibold mb-3 uppercase tracking-wide text-xs">
                    Identifiant Professionnel
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-white/50 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm border-2 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-4 transition-all duration-300 group ${
                        errors.username 
                          ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' 
                          : 'border-white/10 focus:border-blue-400/50 focus:ring-blue-400/20'
                      }`}
                      placeholder="ex: admin.distribution"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-red-300 text-sm flex items-center">
                      <AlertTriangle size={14} className="mr-1" />
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-white/90 text-sm font-semibold mb-3 uppercase tracking-wide text-xs">
                    Mot de Passe
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/50 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-4 bg-white/5 backdrop-blur-sm border-2 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-4 transition-all duration-300 group ${
                        errors.password 
                          ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' 
                          : 'border-white/10 focus:border-blue-400/50 focus:ring-blue-400/20'
                      }`}
                      placeholder="Votre mot de passe sécurisé"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors hover:text-white/80"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-white/50" />
                      ) : (
                        <Eye className="h-5 w-5 text-white/50" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-red-300 text-sm flex items-center">
                      <AlertTriangle size={14} className="mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Options */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        disabled={isLoading}
                      />
                      <div className="w-5 h-5 bg-white/10 border-2 border-white/20 rounded group-hover:border-white/30 transition-colors flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white opacity-0 transition-opacity" />
                      </div>
                    </div>
                    <span className="text-white/80 text-sm font-medium">Maintenir la connexion</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-white/60 hover:text-white transition-colors font-medium hover:underline"
                    disabled={isLoading}
                  >
                    Assistance mot de passe ?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span className="font-medium">Authentification en cours...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Accéder au Dashboard</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Enhanced Demo Credentials */}
              <div className="mt-8 p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mr-3">
                    <CheckCircle className="text-white" size={14} />
                  </div>
                  <span className="text-white font-semibold text-sm">Accès Démonstration</span>
                </div>
                <div className="text-white/70 text-sm space-y-2">
                  <div className="flex items-center">
                    <User size={12} className="mr-2" />
                    <span>Utilisez vos identifiants d'entreprise</span>
                  </div>
                  <div className="flex items-center">
                    <Lock size={12} className="mr-2" />
                    <span>Mot de passe fourni par l'administrateur</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="lg:hidden text-center mt-8">
              <div className="text-white/50 text-sm space-y-1">
                <p>© 2024 LanfiaLink.com Côte d'Ivoire</p>
                <p className="text-xs">Système sécurisé - v2.4.1</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pan {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;