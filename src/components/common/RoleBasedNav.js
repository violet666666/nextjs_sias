'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  BookOpen, 
  FileText, 
  Calendar, 
  BarChart3, 
  Settings, 
  Bell, 
  User, 
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

const navigationConfig = {
  admin: [
    {
      title: 'Dashboard',
      href: '/cpanel/dashboard',
      icon: Home,
      description: 'Overview and analytics'
    },
    {
      title: 'User Management',
      href: '/cpanel/user-management',
      icon: Users,
      description: 'Manage students, teachers, and parents'
    },
    {
      title: 'Classes',
      href: '/cpanel/classes',
      icon: BookOpen,
      description: 'Manage class information'
    },
    {
      title: 'Task Management',
      href: '/cpanel/task-management',
      icon: FileText,
      description: 'Create and manage assignments'
    },
    {
      title: 'Attendance Management',
      href: '/cpanel/attendance-management',
      icon: Calendar,
      description: 'Track student attendance'
    },
    {
      title: 'Bulletin Management',
      href: '/cpanel/bulletin-management',
      icon: Bell,
      description: 'Manage announcements'
    },
    {
      title: 'Analytics',
      href: '/cpanel/analytics',
      icon: BarChart3,
      description: 'View reports and statistics'
    },
    {
      title: 'Audit Logs',
      href: '/cpanel/audit-logs',
      icon: Settings,
      description: 'System activity logs'
    },
    {
      title: 'Hubungkan Orangtua & Siswa',
      href: '/cpanel/orangtua-link',
      icon: Users,
      description: 'Kelola relasi orangtua-anak'
    }
  ],
  guru: [
    {
      title: 'Dashboard',
      href: '/cpanel/dashboard',
      icon: Home,
      description: 'Overview dan analitik'
    },
    {
      title: 'Kelas Saya',
      href: '/cpanel/classes',
      icon: BookOpen,
      description: 'Lihat dan kelola kelas yang diajar'
    },
    {
      title: 'Manajemen Tugas',
      href: '/cpanel/task-management',
      icon: FileText,
      description: 'Buat dan kelola tugas'
    },
    {
      title: 'Manajemen Kehadiran',
      href: '/cpanel/attendance-management',
      icon: Calendar,
      description: 'Pantau kehadiran siswa'
    },
    {
      title: 'Nilai',
      href: '/cpanel/grades',
      icon: BarChart3,
      description: 'Kelola nilai siswa'
    },
    {
      title: 'Pengumuman',
      href: '/cpanel/bulletin',
      icon: Bell,
      description: 'Lihat dan buat pengumuman'
    }
  ],
  siswa: [
    {
      title: 'Dashboard',
      href: '/cpanel/dashboard',
      icon: Home,
      description: 'Ringkasan dan progres'
    },
    {
      title: 'Kelas Saya',
      href: '/cpanel/classes',
      icon: BookOpen,
      description: 'Lihat kelas yang diikuti'
    },
    {
      title: 'Tugas',
      href: '/cpanel/tasks',
      icon: FileText,
      description: 'Lihat dan kumpulkan tugas'
    },
    {
      title: 'Kehadiran',
      href: '/cpanel/attendance',
      icon: Calendar,
      description: 'Lihat riwayat kehadiran'
    },
    {
      title: 'Nilai',
      href: '/cpanel/grades',
      icon: BarChart3,
      description: 'Lihat nilai dan progres'
    },
    {
      title: 'Pengumuman',
      href: '/cpanel/bulletin',
      icon: Bell,
      description: 'Lihat pengumuman'
    }
  ],
  orangtua: [
    {
      title: 'Dashboard',
      href: '/cpanel/dashboard',
      icon: Home,
      description: 'Ringkasan anak'
    },
    {
      title: 'Monitoring Anak',
      href: '/cpanel/children',
      icon: Users,
      description: 'Pantau perkembangan anak'
    },
    {
      title: 'Nilai Anak',
      href: '/cpanel/grades',
      icon: BarChart3,
      description: 'Lihat nilai anak'
    },
    {
      title: 'Kehadiran Anak',
      href: '/cpanel/attendance',
      icon: Calendar,
      description: 'Lihat kehadiran anak'
    },
    {
      title: 'Pengumuman',
      href: '/cpanel/bulletin',
      icon: Bell,
      description: 'Lihat pengumuman'
    }
  ]
};

const RoleBasedNav = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef();
  const pathname = usePathname();

  const navigationItems = navigationConfig[user?.role] || [];

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  };

  const isActiveLink = (href) => {
    if (href === '/cpanel/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        setSearchResults(data.results || []);
        setShowDropdown(true);
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [search]);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link href="/cpanel/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900">SIAS</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                      isActiveLink(item.href)
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Searchbar */}
          <div className="relative w-64 hidden md:block">
            <input
              ref={searchRef}
              type="search"
              className="w-full border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cari user, kelas, tugas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => search.length > 1 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {showDropdown && (
              <div className="absolute left-0 mt-1 w-full bg-white border rounded shadow z-50 max-h-64 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-2 text-gray-500">Mencari...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-2 text-gray-500">Tidak ada hasil</div>
                ) : (
                  searchResults.map((item, idx) => (
                    <Link
                      key={item.href || idx}
                      href={item.href || '#'}
                      className="block px-4 py-2 hover:bg-blue-50 text-gray-800"
                      onClick={() => setShowDropdown(false)}
                    >
                      {item.label || item.nama || item.title || item.email}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right side - Profile and Mobile menu */}
          <div className="flex items-center">
            {/* Profile Dropdown */}
            <div className="hidden md:ml-4 md:flex md:items-center">
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user?.nama?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="ml-2 text-gray-700">{user?.nama}</span>
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      href="/cpanel/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-base font-medium transition-colors duration-200 ${
                    isActiveLink(item.href)
                      ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.title}
                </Link>
              );
            })}
          </div>
          
          {/* Mobile profile section */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.nama?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.nama}</div>
                <div className="text-sm font-medium text-gray-500 capitalize">{user?.role}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/cpanel/profile"
                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="h-5 w-5 mr-3" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default RoleBasedNav; 