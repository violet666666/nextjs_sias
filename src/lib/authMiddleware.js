import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import User from '@/lib/models/userModel'; // Untuk mengambil detail user jika perlu

// Role hierarchy - higher roles have access to lower roles
export const ROLE_HIERARCHY = {
  'admin': 4,
  'guru': 3,
  'orangtua': 2,
  'siswa': 1
};

// Route permissions configuration
export const ROUTE_PERMISSIONS = {
  // Admin only routes
  '/cpanel/user-management': ['admin'],
  '/cpanel/audit-logs': ['admin'],
  '/cpanel/system-settings': ['admin'],
  
  // Teacher and Admin routes
  '/cpanel/classes': ['admin', 'guru'],
  '/cpanel/task-management': ['admin', 'guru'],
  '/cpanel/attendance-management': ['admin', 'guru'],
  '/cpanel/grades': ['admin', 'guru'],
  '/cpanel/bulletin-management': ['admin', 'guru'],
  
  // Student routes
  '/cpanel/tasks': ['siswa'],
  '/cpanel/attendance': ['siswa'],
  '/cpanel/grades': ['siswa'],
  
  // Parent routes
  '/cpanel/orangtua-link': ['orangtua'],
  '/cpanel/monitoring': ['orangtua'],
  
  // Common routes (all authenticated users)
  '/cpanel/profile': ['admin', 'guru', 'siswa', 'orangtua'],
  '/cpanel/dashboard': ['admin', 'guru', 'siswa', 'orangtua'],
};

export function hasPermission(userRole, requiredRoles) {
  if (!userRole || !requiredRoles) return false;
  
  // Check if user's role is in the required roles
  if (requiredRoles.includes(userRole)) return true;
  
  // Check role hierarchy (higher roles can access lower role resources)
  const userRoleLevel = ROLE_HIERARCHY[userRole];
  const requiredRoleLevel = Math.min(...requiredRoles.map(role => ROLE_HIERARCHY[role]));
  
  return userRoleLevel >= requiredRoleLevel;
}

export function getRoutePermissions(path) {
  // Find exact match first
  if (ROUTE_PERMISSIONS[path]) {
    return ROUTE_PERMISSIONS[path];
  }
  
  // Check for partial matches (for dynamic routes)
  for (const route in ROUTE_PERMISSIONS) {
    if (path.startsWith(route)) {
      return ROUTE_PERMISSIONS[route];
    }
  }
  
  // Default to requiring authentication
  return ['admin', 'guru', 'siswa', 'orangtua'];
}

// Client-side auth utilities
export function verifyToken(token) {
  if (!token) return { success: false, error: 'No token provided' };
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, decoded };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function canAccessRoute(userRole, path) {
  const requiredRoles = getRoutePermissions(path);
  return hasPermission(userRole, requiredRoles);
}

// Client-side auth check
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  const { success } = verifyToken(token);
  return success;
}

// HOC for role-based access control
export function withRoleCheck(Component, requiredRoles) {
  return function RoleCheckedComponent({ user, ...props }) {
    if (!user || !hasPermission(user.role, requiredRoles)) {
      return null;
    }
    return <Component user={user} {...props} />;
  };
}

// Filter navigation items based on user role
export function filterNavigationByRole(navigationItems, userRole) {
  if (!userRole) return [];
  
  return navigationItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    return hasPermission(userRole, item.roles);
  });
}

export async function authenticateAndAuthorize(request, allowedRoles = []) {
  const token = request.headers.get('authorization')?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return { error: 'Akses ditolak: Token tidak ditemukan.', status: 401, user: null };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Opsional: Ambil user dari DB untuk memastikan user masih valid/ada
    // const user = await User.findById(decoded.id).lean();
    // if (!user) {
    //   return { error: 'Akses ditolak: User tidak valid.', status: 401, user: null };
    // }

    // Cek peran jika allowedRoles disediakan
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      return { error: 'Akses ditolak: Peran tidak diizinkan.', status: 403, user: decoded };
    }

    // request.user = decoded; // Baris ini tidak diperlukan karena kita mengembalikan user
    return { user: decoded, error: null, status: 200 };

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { error: 'Akses ditolak: Token kadaluwarsa.', status: 401, user: null };
    }
    console.error('JWT Verification Error:', error);
    return { error: 'Akses ditolak: Token tidak valid.', status: 401, user: null };
  }
}