"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from './ApiService';
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify token by fetching user profile or dashboard data
      const response = await apiService.get('/dashboard/');
      if (response.ok) {
        // Token is valid, set user from stored data or fetch user info
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Fetch user data from the backend
          const userResponse = await apiService.get('/users/');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            localStorage.setItem('user_data', JSON.stringify(userData));
            setUser(userData);
          }
        }
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user_data');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user_data');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.post('/token/', {
        username,
        password
      });

      if (!response.ok) {
        throw new Error('Identifiants invalides');
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('access', data.access);
      if (data.refresh) {
        localStorage.setItem('refresh', data.refresh);
      }

      // Fetch user data from the backend
      const userResponse = await apiService.get('/users/');
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await userResponse.json();

      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);

      return { success: true, data: userData };
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Erreur de connexion');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user_data');
    setUser(null);
    setError(null);
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post('/token/refresh/', {
        refresh: refreshToken
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('access', data.access);

      return data.access;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};