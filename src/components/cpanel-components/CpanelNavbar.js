"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { io } from "socket.io-client";
import Toast from "@/components/common/Toast";
import { useUserStatus } from "@/lib/hooks/useUserStatus";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

const CpanelNavbar = ({ onRoleChange }) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [toast, setToast] = useState({ message: "", type: "success" });
  const notifRef = useRef();

  // Real-time user status
  const { onlineUsers, userActivity, logActivity } = useUserStatus();

  // Get user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Dark mode management
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen((open) => !open);
  };
  const toggleNotif = () => {
    setNotifOpen((open) => !open);
  };

  // Search functionality
  useEffect(() => {
    if (debouncedSearch.length > 2) {
      setSearchLoading(true);
      fetchWithAuth(`/api/search?q=${debouncedSearch}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.results || []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setNotifLoading(true);
      try {
        const res = await fetchWithAuth("/api/notifications?limit=5");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setNotifLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const handleLogout = async () => {
    try {
      await fetchWithAuth("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API fails
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <Link
                  key={result._id}
                  href={result.link || "#"}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {result.title}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {result.description}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Center - Real-time Status */}
        <div className="flex items-center space-x-4 mx-4">
          {/* Online Users Status */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{onlineUsers.length} online</span>
            </div>
          </div>

          {/* Recent Activity Indicator */}
          {userActivity.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>{userActivity.length} activities</span>
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? (
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              onClick={toggleNotif}
              aria-label="Notifikasi"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-bold">Notifikasi</div>
                {notifLoading ? (
                  <div className="p-4 text-gray-500">Memuat...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-gray-500">Tidak ada notifikasi.</div>
                ) : (
                  <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.map((notif) => (
                      <li key={notif._id} className={`p-4 ${notif.read ? '' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                        <div className="font-semibold">{notif.title || notif.text || 'Notifikasi'}</div>
                        <div className="text-xs text-gray-500 mt-1">{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={toggleUserDropdown}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {user?.nama?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                {user?.nama || "User"}
              </span>
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.nama}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                </div>
                <div className="p-2">
                  <Link
                    href="/cpanel/profile"
                    className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </nav>
  );
};

export default CpanelNavbar;
