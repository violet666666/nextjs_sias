import Link from "next/link";

export default function QuickActions({ user, role }) {
  const getQuickActions = () => {
    switch (role) {
      case "admin":
        return [
          {
            title: "Tambah User",
            description: "Buat akun baru",
            icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
            href: "/cpanel/users",
            color: "blue"
          },
          {
            title: "Buat Kelas",
            description: "Tambah kelas baru",
            icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
            href: "/cpanel/classes",
            color: "green"
          },
          {
            title: "Lihat Laporan",
            description: "Analisis data",
            icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
            href: "/cpanel/analytics",
            color: "purple"
          },
          {
            title: "Audit Log",
            description: "Riwayat aktivitas",
            icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            href: "/cpanel/audit-logs",
            color: "orange"
          }
        ];
      case "guru":
        return [
          {
            title: "Buat Tugas",
            description: "Tambah tugas baru",
            icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            href: "/cpanel/tasks",
            color: "blue"
          },
          {
            title: "Mulai Absensi",
            description: "Buat sesi kehadiran",
            icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
            href: "/cpanel/attendance",
            color: "green"
          },
          {
            title: "Input Nilai",
            description: "Berikan penilaian",
            icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
            href: "/cpanel/grades",
            color: "purple"
          },
          {
            title: "Lihat Kelas",
            description: "Kelola kelas",
            icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
            href: "/cpanel/classes",
            color: "orange"
          }
        ];
      case "siswa":
        return [
          {
            title: "Lihat Tugas",
            description: "Daftar tugas",
            icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            href: "/cpanel/tasks",
            color: "blue"
          },
          {
            title: "Cek Nilai",
            description: "Lihat penilaian",
            icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
            href: "/cpanel/grades",
            color: "green"
          },
          {
            title: "Kehadiran",
            description: "Riwayat absensi",
            icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
            href: "/cpanel/attendance",
            color: "purple"
          },
          {
            title: "Kelas Saya",
            description: "Daftar kelas",
            icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
            href: "/cpanel/classes",
            color: "orange"
          }
        ];
      case "orangtua":
        return [
          {
            title: "Monitor Anak",
            description: "Lihat perkembangan",
            icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
            href: "/cpanel/children",
            color: "blue"
          },
          {
            title: "Nilai Anak",
            description: "Lihat penilaian",
            icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
            href: "/cpanel/grades",
            color: "green"
          },
          {
            title: "Kehadiran",
            description: "Riwayat absensi",
            icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
            href: "/cpanel/attendance",
            color: "purple"
          },
          {
            title: "Profil",
            description: "Update informasi",
            icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
            href: "/cpanel/profile",
            color: "orange"
          }
        ];
      default:
        return [];
    }
  };

  const getColorClasses = (color) => {
    switch (color) {
      case "blue":
        return "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700";
      case "green":
        return "bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700";
      case "purple":
        return "bg-purple-500 dark:bg-purple-600 hover:bg-purple-600 dark:hover:bg-purple-700";
      case "orange":
        return "bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-700";
      default:
        return "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700";
    }
  };

  const actions = getQuickActions();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Aksi Cepat</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="group block"
          >
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105">
              <div className={`w-12 h-12 rounded-lg ${getColorClasses(action.color)} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.icon} />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                {action.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 