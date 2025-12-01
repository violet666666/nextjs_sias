'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { canAccessRoute } from '@/lib/auth/middleware';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useAuth } from '@/lib/AuthContext';

// Role hierarchy untuk pengecekan akses
const ROLE_HIERARCHY = {
  'admin': 4,
  'guru': 3,
  'orangtua': 2,
  'siswa': 1
};

// Fungsi helper untuk cek permission
function hasPermission(userRole, requiredRoles) {
  if (!userRole || !requiredRoles || requiredRoles.length === 0) return true;
  
  if (requiredRoles.includes(userRole)) return true;
  
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = Math.min(...requiredRoles.map(role => ROLE_HIERARCHY[role] || 0));
  
  return userLevel >= requiredLevel;
}

const lastVerifyKey = '__lastVerifyTime';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  fallback = null,
  redirectTo = '/login' 
}) => {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push(redirectTo);
          return;
        }
        // Cegah verifikasi berulang dalam 2 detik
        const now = Date.now();
        const last = Number(sessionStorage.getItem(lastVerifyKey) || 0);
        if (now - last < 2000 && user) {
          setIsLoading(false);
          setHasAccess(hasPermission(user.role, requiredRoles));
          return;
        }
        sessionStorage.setItem(lastVerifyKey, String(now));
        // Verify token and get user info
        const response = await fetchWithAuth('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          // Hanya update jika user berbeda
          if (!user || JSON.stringify(user) !== JSON.stringify(userData)) {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
          // Check role permissions
          if (hasPermission(userData.role, requiredRoles)) {
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
        } else {
          // Token is invalid, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, redirectTo, requiredRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/cpanel/dashboard')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute; 