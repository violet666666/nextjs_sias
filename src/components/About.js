import Image from "next/image";

const About = () => {
  return (
    <section className="py-20 px-4 bg-white text-black">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-start gap-12">
        {/* Left Section: Illustration */}
        <div className="lg:w-1/2 flex justify-center">
          <Image
            src="/assets/loginpage/logo segi panjang.png"
            alt="SIAS Illustration"
            width={350}
            height={250}
            className="rounded-xl shadow-lg"
          />
        </div>
        {/* Right Section: Content */}
        <div className="lg:w-1/2">
          <h2 className="text-4xl font-bold mb-6 text-center lg:text-left text-blue-700">
            Tentang SIAS
          </h2>
          <p className="text-lg mb-8 text-center lg:text-left text-gray-700">
            SIAS merupakan platform berbasis aplikasi mobile dan website yang digunakan untuk memudahkan orang tua murid dan guru saling berinteraksi agar dapat memantau perkembangan siswa. Seluruh kegiatan yang diikuti oleh siswa dapat termonitor dalam sebuah aplikasi.
          </p>
          <div className="space-y-6">
            {/* Feature 1: Praktis */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow">
                  <span>💡</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Praktis</h3>
                <p className="text-gray-600">SIAS sangat praktis digunakan karena dapat digunakan kapan saja dengan menginstall aplikasinya pada gadget yang Anda miliki.</p>
              </div>
            </div>
            {/* Feature 2: Memudahkan */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow">
                  <span>🤝</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Memudahkan</h3>
                <p className="text-gray-600">SIAS juga memberikan kemudahan kepada orang tua dan guru untuk memonitor perkembangan siswa.</p>
              </div>
            </div>
            {/* Feature 3: Aman */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow">
                  <span>🔒</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Aman</h3>
                <p className="text-gray-600">Data dan interaksi di SIAS terjamin keamanannya untuk seluruh pengguna.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
