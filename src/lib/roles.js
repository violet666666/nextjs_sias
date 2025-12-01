'use client';

// Role hierarchy untuk pengecekan akses
export const ROLE_HIERARCHY = {
  'admin': 4,
  'guru': 3,
  'orangtua': 2,
  'siswa': 1
};

// Fungsi helper untuk cek permission
export function hasPermission(userRole, requiredRoles) {
  if (!userRole || !requiredRoles || requiredRoles.length === 0) return true;
  
  if (requiredRoles.includes(userRole)) return true;
  
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = Math.min(...requiredRoles.map(role => ROLE_HIERARCHY[role] || 0));
  
  return userLevel >= requiredLevel;
}

// Route permissions configuration
export const ROUTE_PERMISSIONS = {
  // Admin only routes
  '/cpanel/user-management': ['admin'],
  '/cpanel/audit-logs': ['admin'],
  '/cpanel/system-settings': ['admin'],
  
  // Teacher and Admin routes
  '/cpanel/classes': ['admin', 'guru'],
  '/cpanel/my-subjects': ['guru'],
  '/cpanel/task-management': ['admin', 'guru'],
  '/cpanel/attendance-management': ['admin', 'guru'],
  '/cpanel/grades': ['admin', 'guru'],
  '/cpanel/bulletin-management': ['admin', 'guru'],
  
  // Student routes
  '/cpanel/tasks': ['siswa', 'admin'],
  '/cpanel/task': ['admin', 'guru'], // Admin and teacher can access task management
  '/cpanel/attendance': ['siswa'],
  '/cpanel/grades': ['siswa'],
  
  // Parent routes
  '/cpanel/orangtua-link': ['admin'], // Hanya admin yang bisa manage relasi
  '/cpanel/children': ['orangtua'], // Orangtua bisa akses halaman anak saya
  // '/cpanel/monitoring': ['orangtua'], // Dihapus - data tidak sinkron
  
  // Common routes (all authenticated users)
  '/cpanel/profile': ['admin', 'guru', 'siswa', 'orangtua'],
  '/cpanel/dashboard': ['admin', 'guru', 'siswa', 'orangtua'],
}; 