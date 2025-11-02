"use client";
import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { 
  Eye, EyeOff, User, Lock, ArrowRight, Loader2, 
  Shield, Zap, Globe, Users, CheckCircle, AlertTriangle
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
    
    if (!formData.username) {
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
      title: 'Sécurité Avancée',
      description: 'Protection des données avec cryptage de niveau bancaire'
    },
    {
      icon: Zap,
      title: 'Performance Optimale',
      description: 'Interface rapide et réactive pour une meilleure productivité'
    },
    {
      icon: Globe,
      title: 'Couverture Nationale',
      description: 'Gestion complète des points de vente en Côte d\'Ivoire'
    },
    {
      icon: Users,
      title: 'Collaboration Facile',
      description: 'Outils intégrés pour les équipes et partenaires'
    }
  ], []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
      
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse" 
        style={{ animationDuration: '4s' }} 
      />
      
      <div className="absolute inset-0">
        <div 
          className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-bounce" 
          style={{ animationDelay: '0s', animationDuration: '3s' }} 
        />
        <div 
          className="absolute top-40 right-32 w-24 h-24 bg-blue-400/20 rounded-full blur-lg animate-bounce" 
          style={{ animationDelay: '1s', animationDuration: '4s' }} 
        />
        <div 
          className="absolute bottom-32 left-40 w-40 h-40 bg-purple-400/15 rounded-full blur-2xl animate-bounce" 
          style={{ animationDelay: '2s', animationDuration: '5s' }} 
        />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-16">
          <div className="max-w-lg">
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 border border-white/30">
                  <span className="text-white font-bold text-xl">LT</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">FrieslandCampina</h1>
                  <p className="text-white/80 text-sm">Plateforme de Distribution</p>
                </div>
              </div>
              
              <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
                Révolutionnez votre 
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> Supply Chain</span>
              </h2>
              
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Gérez vos canaux de distribution, optimisez vos stocks et connectez tous vos points de vente en Côte d'Ivoire.
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <feature.icon className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                    <p className="text-white/80 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3 border border-white/30">
                  <span className="text-white font-bold text-xl">LT</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">LanfiaTech</h1>
                  <p className="text-white/80 text-sm">Admin Panel</p>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-white/15 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Connexion</h2>
                <p className="text-white/80">Accédez à votre tableau de bord</p>
              </div>

              {(errors.general || error) && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm flex items-center">
                  <AlertTriangle className="text-red-300 mr-2 flex-shrink-0" size={20} />
                  <p className="text-red-200 text-sm">{errors.general || error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Identifiant
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all ${
                        errors.username ? 'border-red-400' : 'border-white/30'
                      }`}
                      placeholder="admin123"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-red-300 text-sm">{errors.username}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all ${
                        errors.password ? 'border-red-400' : 'border-white/30'
                      }`}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-white/60 hover:text-white/80" />
                      ) : (
                        <Eye className="h-5 w-5 text-white/60 hover:text-white/80" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-red-300 text-sm">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-white/30 bg-white/10 text-white focus:ring-white/30"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-white/80">Se souvenir de moi</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-white/80 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Connexion...</span>
                    </>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="flex items-center mb-2">
                  <CheckCircle className="text-green-400 mr-2" size={16} />
                  <span className="text-white/90 text-sm font-medium">Identifiants de test :</span>
                </div>
                <div className="text-white/80 text-sm space-y-1">
                  <p>Identifiant : Utilisez vos identifiants fournis</p>
                  <p>Mot de passe : Votre mot de passe</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-white/60 text-sm">
                © 2024 LanfiaTech. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
