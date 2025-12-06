import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative bg-blue-700 h-screen flex items-center overflow-hidden pt-20">
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 py-12 sm:py-20 z-10 relative">
        {/* Left: Text & CTA */}
        <div className="max-w-2xl text-center lg:text-left mb-8 sm:mb-12 lg:mb-0 w-full lg:w-auto">
          <div className="flex items-center justify-center lg:justify-start mb-4 sm:mb-6">
            <div className="relative">
              <Image 
                src="/assets/loginpage/logo circle rounded.png" 
                alt="SIAS Logo" 
                width={60}
                height={60}
                className="drop-shadow-lg w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-[70px] lg:h-[70px]"
              />
            </div>
            <span className="ml-3 sm:ml-4 text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-wide drop-shadow-md">SIAS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white mb-4 sm:mb-6 leading-tight drop-shadow-lg">
            Sistem Informasi <br />
            <span className="text-green-300">Akademik Siswa</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
            Platform terintegrasi untuk memudahkan komunikasi antara orang tua, guru, dan siswa dalam memantau perkembangan akademik
          </p>
          <div className="flex justify-center lg:justify-start px-2 sm:px-0">
            <Link 
              href="/login" 
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-base sm:text-lg w-full sm:w-auto text-center"
            >
              Masuk Sekarang
            </Link>
          </div>
        </div>
        {/* Right: Illustration */}
        <div className="w-full lg:w-[500px] flex justify-center lg:justify-end mt-8 sm:mt-10 lg:mt-0">
          <div className="relative w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[450px]">
            <Image 
              src="/assets/loginpage/logo segi panjang.png" 
              alt="SIAS Illustration" 
              width={450} 
              height={450} 
              className="relative rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300 w-full h-auto"
            />
          </div>
        </div>
      </div>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 z-0">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
    </section>
  );
};

export default Hero;
