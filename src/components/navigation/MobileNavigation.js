'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  FileText, 
  Users, 
  Calendar, 
  MessageSquare,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Mobile Navigation Component
export const MobileNavigation = ({ user, sidebarItems = [] }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const drawerRef = useRef(null);
  const searchRef = useRef(null);

  // Close drawer when route changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Handle swipe gestures
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;

      // Only handle horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && !isDrawerOpen) {
          // Swipe left to open drawer
          setIsDrawerOpen(true);
        } else if (diffX < 0 && isDrawerOpen) {
          // Swipe right to close drawer
          setIsDrawerOpen(false);
        }
        isDragging = false;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawerOpen]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search functionality
    console.log('Searching for:', query);
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'home', label: 'Home', icon: Home, href: '/cpanel/dashboard' },
      { id: 'classes', label: 'Classes', icon: BookOpen, href: '/cpanel/kelas' },
      { id: 'tasks', label: 'Tasks', icon: FileText, href: '/cpanel/tugas' },
      { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/cpanel/calendar' },
    ];

    if (user?.role === 'admin') {
      baseItems.push(
        { id: 'users', label: 'Users', icon: Users, href: '/cpanel/users' },
        { id: 'settings', label: 'Settings', icon: Settings, href: '/cpanel/settings' }
      );
    }

    if (user?.role === 'guru') {
      baseItems.push(
        { id: 'students', label: 'Siswa', icon: Users, href: '/cpanel/students' },
        { id: 'settings', label: 'Pengaturan', icon: Settings, href: '/cpanel/settings' }
      );
    }

    if (user?.role === 'siswa') {
      baseItems.push(
        { id: 'chat', label: 'Chat', icon: MessageSquare, href: '/cpanel/chat' },
        { id: 'profile', label: 'Profil', icon: User, href: '/cpanel/profile' }
      );
    }

    if (user?.role === 'orangtua') {
      baseItems.push(
        { id: 'children', label: 'Anak Saya', icon: Users, href: '/cpanel/children' },
        { id: 'profile', label: 'Profil', icon: User, href: '/cpanel/profile' }
      );
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">SIAS</span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            <Link
              href="/cpanel/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      <div
        ref={drawerRef}
        className={`fixed inset-0 z-50 lg:hidden ${
          isDrawerOpen ? 'block' : 'hidden'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsDrawerOpen(false)}
        />

        {/* Drawer Content */}
        <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out">
          {/* Drawer Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">SIAS</span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {user.nama?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.nama}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsDrawerOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors duration-200
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile */}
      <div className="h-20 lg:hidden" />
    </>
  );
};

// Mobile Tab Navigation Component
export const MobileTabNavigation = ({ tabs, activeTab, onTabChange }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);
    
    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  return (
    <div className="relative">
      {/* Scroll Buttons */}
      {scrollPosition > 0 && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      )}
      
      {scrollPosition < (scrollContainerRef.current?.scrollWidth - scrollContainerRef.current?.clientWidth) && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Tabs */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-1 overflow-x-auto scrollbar-hide px-4"
        onScroll={(e) => setScrollPosition(e.target.scrollLeft)}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Mobile Action Button Component
export const MobileActionButton = ({ icon: Icon, onClick, label, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    red: 'bg-red-600 hover:bg-red-700 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white'
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-30
        ${colorClasses[color]}
      `}
      title={label}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
};

// Mobile Swipeable Cards Component
export const MobileSwipeableCards = ({ cards, onCardAction }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    const diffX = startX - currentX;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentIndex < cards.length - 1) {
        // Swipe left - next card
        setCurrentIndex(currentIndex + 1);
      } else if (diffX < 0 && currentIndex > 0) {
        // Swipe right - previous card
        setCurrentIndex(currentIndex - 1);
      }
    }

    setStartX(0);
    setCurrentX(0);
  };

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {cards.map((card, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0 px-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {card.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {card.description}
              </p>
              {card.action && (
                <button
                  onClick={() => onCardAction(card, index)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {card.action}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      {cards.length > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileNavigation; 