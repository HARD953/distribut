"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiService } from "./ApiService";

// ✅ Typage de l'utilisateur (à adapter selon tes données réelles)
interface User {
  id: number;
  username: string;
  email: string;
  // Ajoute ici d'autres champs selon la réponse de ton backend
}

// ✅ Typage du contexte
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; data?: User; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<string>;
  checkAuthStatus: () => Promise<void>;
}

// ✅ Création du contexte avec un type explicite
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Hook pour utiliser le contexte
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ✅ Props de AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await apiService.get("/dashboard/");
      if (response.ok) {
        const storedUser = localStorage.getItem("user_data");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          const userResponse = await apiService.get("/users/");
          if (userResponse.ok) {
            const userData: User = await userResponse.json();
            localStorage.setItem("user_data", JSON.stringify(userData));
            setUser(userData);
          }
        }
      } else {
        localStorage.clear();
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      localStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; data?: User; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.post("/token/", { username, password });

      if (!response.ok) {
        throw new Error("Identifiants invalides");
      }

      const data = await response.json();
      localStorage.setItem("access", data.access);
      if (data.refresh) {
        localStorage.setItem("refresh", data.refresh);
      }

      const userResponse = await apiService.get("/users/");
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData: User = await userResponse.json();
      localStorage.setItem("user_data", JSON.stringify(userData));
      setUser(userData);

      return { success: true, data: userData };
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Erreur de connexion");
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setError(null);
  };

  const refreshToken = async (): Promise<string> => {
    try {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) throw new Error("No refresh token available");

      const response = await apiService.post("/token/refresh/", { refresh });

      if (!response.ok) throw new Error("Token refresh failed");

      const data = await response.json();
      localStorage.setItem("access", data.access);

      return data.access;
    } catch (err) {
      console.error("Token refresh failed:", err);
      logout();
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
