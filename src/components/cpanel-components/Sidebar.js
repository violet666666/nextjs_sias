import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const SIDEBAR_MENUS = {
  siswa: [
    { name: "Dashboard", href: "/cpanel/dashboard", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" },
    { name: "Kelas Saya", href: "/cpanel/classes", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { name: "Tugas", href: "/cpanel/tasks", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", hasNotification: true },
    { name: "Nilai", href: "/cpanel/grades", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { name: "Kehadiran", href: "/cpanel/attendance", icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { name: "Profil", href: "/cpanel/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ],
  guru: [
    { name: "Dashboard", href: "/cpanel/dashboard", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" },
    { name: "Kelas Saya (Wali Kelas)", href: "/cpanel/classes", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { name: "Mata Pelajaran", href: "/cpanel/my-subjects", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { name: "Tugas", href: "/cpanel/task-management", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { name: "Nilai", href: "/cpanel/grades", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { name: "Kehadiran", href: "/cpanel/attendance", icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", hasNotification: true },
    { name: "Profil", href: "/cpanel/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { name: "Tambah Buletin", href: "/cpanel/bulletin/add", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
  ],
  orangtua: [
    { name: "Dashboard", href: "/cpanel/dashboard", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" },
    { name: "Anak Saya", href: "/cpanel/children", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { name: "Kelas Anak", href: "/cpanel/classes", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { name: "Nilai Anak", href: "/cpanel/grades", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { name: "Kehadiran Anak", href: "/cpanel/attendance", icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { name: "Rekap Nilai", href: "/cpanel/rekap-nilai", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { name: "Rekap Absensi", href: "/cpanel/rekap-absensi", icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { name: "Pengumuman", href: "/cpanel/bulletin", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
    { name: "Notifikasi", href: "/cpanel/notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
    { name: "Profil", href: "/cpanel/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ],
  admin: [
    { name: "Dashboard", href: "/cpanel/dashboard", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" },
    { name: "Manajemen Pengguna", href: "/cpanel/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
    { name: "Kelas", href: "/cpanel/classes", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { name: "Tambah Buletin", href: "/cpanel/bulletin/add", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
  ],
};

const ADMIN_SECTIONS = [
  {
    header: "Dashboard",
    items: [
      { name: "Dashboard", href: "/cpanel/dashboard", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" },
      { name: "Analitik", href: "/cpanel/analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    ],
  },
  {
    header: "Manajemen Pengguna",
    items: [
      { name: "User Management", href: "/cpanel/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
      { name: "Hubungkan Orangtua & Siswa", href: "/cpanel/orangtua-link", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
    ],
  },
  {
    header: "Akademik",
    items: [
      { name: "Kelas", href: "/cpanel/classes", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
      { name: "Mata Pelajaran", href: "/cpanel/subjects", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
      { name: "Tugas", href: "/cpanel/tasks", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
      { name: "Nilai", href: "/cpanel/grades", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    ],
  },
  {
    header: "Informasi",
    items: [
      { name: "Tambah Buletin", href: "/cpanel/bulletin/add", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
    ],
  },
  {
    header: "Kehadiran",
    items: [
      { name: "Sesi Kehadiran", href: "/cpanel/attendance", icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
      { name: "Laporan Kehadiran", href: "/cpanel/attendance-reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ],
  },
  {
    header: "Sistem",
    items: [
      { name: "Pengaturan", href: "/cpanel/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
      { name: "Log Audit", href: "/cpanel/audit-logs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
      { name: "Cadangan", href: "/cpanel/backup", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    ],
  },
];

const roleIdToKey = {
  1: "siswa",
  2: "guru",
  3: "orangtua",
  4: "admin"
};

const Sidebar = ({ roleId = 1 }) => {
  const [notifications, setNotifications] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch notifications for badge indicators
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetchWithAuth("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          const unreadCounts = {};
          
          // Ensure data.notifications is an array before using forEach
          const notifications = data.notifications || [];
          
          // Count unread notifications by type
          notifications.forEach(notif => {
            if (!notif.read) {
              const type = notif.type || 'general';
              unreadCounts[type] = (unreadCounts[type] || 0) + 1;
            }
          });
          
          setNotifications(unreadCounts);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationCount = (menuName) => {
    const typeMap = {
      'Tugas': 'assignment',
      'Kehadiran': 'attendance',
      'Nilai': 'grade',
      'Sesi Kehadiran': 'attendance'
    };
    
    const type = typeMap[menuName];
    return type ? notifications[type] || 0 : 0;
  };

  // Admin: custom grouped sidebar
  if (roleId === 4) {
    return (
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 h-screen fixed top-0 left-0 flex flex-col shadow-lg border-r border-gray-200 dark:border-slate-700 transition-all duration-300 z-30`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          {!isCollapsed && (
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">SIAS Admin</div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>
        
        <nav className="flex-grow overflow-y-auto p-4">
          {ADMIN_SECTIONS.map((section) => (
            <div key={section.header} className="mb-6">
              {!isCollapsed && (
                <div className="uppercase text-xs font-bold tracking-wider mb-2 px-4 text-gray-500 dark:text-slate-400">
                  {section.header}
                </div>
              )}
              <ul className="space-y-1 px-2">
                {section.items.map((item) => {
                  const notificationCount = getNotificationCount(item.name);
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="flex items-center p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 group relative"
                      >
                        <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                        </svg>
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{item.name}</span>
                            {notificationCount > 0 && (
                              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center animate-pulse">
                                {notificationCount > 99 ? '99+' : notificationCount}
                              </span>
                            )}
                          </>
                        )}
                        {isCollapsed && notificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center animate-pulse">
                            {notificationCount > 9 ? '9+' : notificationCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    );
  }

  // Other roles: simple sidebar
  const navItems = SIDEBAR_MENUS[roleIdToKey[roleId]] || SIDEBAR_MENUS.siswa;

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 h-screen fixed top-0 left-0 flex flex-col shadow-lg border-r border-gray-200 dark:border-slate-700 transition-all duration-300 z-30`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        {!isCollapsed && (
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {roleId === 1 ? "SIAS Siswa" : roleId === 2 ? "SIAS Guru" : "SIAS Orang Tua"}
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
          </svg>
        </button>
      </div>
      
      <nav className="flex-grow overflow-y-auto">
        <ul className="space-y-2 p-4">
          {navItems.map((item) => {
            const notificationCount = getNotificationCount(item.name);
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span className="flex items-center p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 group relative">
                    <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {notificationCount > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center animate-pulse">
                            {notificationCount > 99 ? '99+' : notificationCount}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center animate-pulse">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
