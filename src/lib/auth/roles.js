'use client';

// Role hierarchy
export const ROLE_HIERARCHY = {
  admin: 4,
  guru: 3,
  orangtua: 2,
  siswa: 1
};

// Route permissions
export const ROUTE_PERMISSIONS = {
  '/cpanel/dashboard': ['admin', 'guru', 'siswa', 'orangtua'],
  '/cpanel/user-management': ['admin'],
  '/cpanel/classes': ['admin', 'guru'],
  '/cpanel/tasks': ['siswa'],
  '/cpanel/task-management': ['admin', 'guru'],
  '/cpanel/subjects': ['admin', 'guru'],
  '/cpanel/orangtua-link': ['orangtua', 'admin'],
  '/cpanel/settings': ['admin']
};

export function hasPermission(userRole, requiredRoles) {
  if (!userRole || !requiredRoles) return false;
  if (requiredRoles.includes(userRole)) return true;
  
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = Math.min(...requiredRoles.map(role => ROLE_HIERARCHY[role] || 0));
  
  return userLevel >= requiredLevel;
}

export function canAccessRoute(userRole, path) {
  const requiredRoles = ROUTE_PERMISSIONS[path];
  if (!requiredRoles) return true; // If no specific permissions, allow access
  return hasPermission(userRole, requiredRoles);
} 