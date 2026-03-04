"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import LoginPage from '../LoginPage';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <span className="text-gray-600">Redirection...</span>
        </div>
      </div>
    );
  }

  return <LoginPage />;
}