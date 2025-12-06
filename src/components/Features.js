import { BookOpen, FileText, Users, Calendar, Award, MessageSquare, BarChart3, Bell } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Manajemen Mata Pelajaran",
      description: "Kelola mata pelajaran dengan mudah, termasuk jadwal, materi, dan informasi kelas.",
      color: "text-blue-600"
    },
    {
      icon: FileText,
      title: "Sistem Tugas & Penilaian",
      description: "Buat, kirim, dan nilai tugas secara digital dengan feedback langsung untuk siswa.",
      color: "text-green-600"
    },
    {
      icon: Users,
      title: "Manajemen Kelas",
      description: "Kelola kelas, siswa, dan guru dengan sistem yang terorganisir dan efisien.",
      color: "text-blue-600"
    },
    {
      icon: Calendar,
      title: "Kehadiran Digital",
      description: "Catat dan pantau kehadiran siswa secara real-time dengan laporan otomatis.",
      color: "text-green-600"
    },
    {
      icon: Award,
      title: "Laporan Nilai",
      description: "Akses laporan nilai lengkap dengan grafik dan analitik perkembangan siswa.",
      color: "text-blue-600"
    },
    {
      icon: MessageSquare,
      title: "Komunikasi Terintegrasi",
      description: "Komunikasi langsung antara guru, siswa, dan orang tua dalam satu platform.",
      color: "text-green-600"
    },
    {
      icon: BarChart3,
      title: "Dashboard Analitik",
      description: "Pantau statistik dan performa akademik dengan dashboard yang informatif.",
      color: "text-blue-600"
    },
    {
      icon: Bell,
      title: "Notifikasi Real-time",
      description: "Dapatkan notifikasi instan untuk tugas baru, nilai, dan pengumuman penting.",
      color: "text-green-600"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-white text-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-blue-700 px-2">
            Fitur Unggulan
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            Platform lengkap dengan fitur-fitur canggih untuk mendukung proses pembelajaran digital
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="group bg-gradient-to-br from-white to-blue-50 rounded-xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${feature.color} mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform`}>
                  <Icon className="w-full h-full" />
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

