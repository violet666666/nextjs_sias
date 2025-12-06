import Image from "next/image";
import { Lightbulb, Users, Shield, Clock, CheckCircle, BarChart3 } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Lightbulb,
      title: "Praktis",
      description: "SIAS sangat praktis digunakan karena dapat diakses kapan saja dan di mana saja melalui aplikasi mobile atau website.",
      color: "bg-blue-600"
    },
    {
      icon: Users,
      title: "Memudahkan",
      description: "Memberikan kemudahan kepada orang tua dan guru untuk memonitor perkembangan akademik siswa secara real-time.",
      color: "bg-green-500"
    },
    {
      icon: Shield,
      title: "Aman",
      description: "Data dan interaksi di SIAS terjamin keamanannya dengan sistem enkripsi modern untuk seluruh pengguna.",
      color: "bg-blue-600"
    },
    {
      icon: Clock,
      title: "Real-time",
      description: "Update informasi akademik, tugas, dan kehadiran secara langsung tanpa delay.",
      color: "bg-green-500"
    },
    {
      icon: CheckCircle,
      title: "Terintegrasi",
      description: "Sistem terintegrasi yang menghubungkan siswa, guru, orang tua, dan admin dalam satu platform.",
      color: "bg-blue-600"
    },
    {
      icon: BarChart3,
      title: "Analitik",
      description: "Laporan dan analitik lengkap untuk memantau perkembangan akademik siswa secara detail.",
      color: "bg-green-500"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-gradient-to-b from-white to-blue-50 text-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-blue-700 px-2">
            Tentang SIAS
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
            SIAS merupakan platform berbasis aplikasi mobile dan website yang digunakan untuk memudahkan orang tua murid dan guru saling berinteraksi agar dapat memantau perkembangan siswa. Seluruh kegiatan yang diikuti oleh siswa dapat termonitor dalam sebuah aplikasi.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12 md:mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 ${feature.color} rounded-lg flex items-center justify-center mb-3 sm:mb-4 shadow-md`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Additional Info Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 text-white shadow-2xl">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 px-2">
              Satu Platform untuk Semua Kebutuhan Akademik
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-4 sm:mb-6 px-2">
              Dari tugas, nilai, kehadiran, hingga komunikasi - semua ada di SIAS
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">Akses Kapan Saja</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-3xl font-bold mb-2">100%</div>
                <div className="text-blue-100">Data Terenkripsi</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-3xl font-bold mb-2">Real-time</div>
                <div className="text-blue-100">Update Instan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
