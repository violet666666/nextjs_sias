import Image from "next/image";

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-700 to-blue-500 min-h-[80vh] flex items-center overflow-hidden">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-6 py-16 z-10 relative">
        {/* Left: Text & CTA */}
        <div className="max-w-xl text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-6">
            <Image src="/assets/loginpage/logo circle rounded.png" alt="SIAS Logo" width={60} height={60} />
            <span className="ml-3 text-3xl font-bold text-white tracking-wide">SIAS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
            Build Your Landing Page <br /> With <span className="text-green-300 underline">SIAS</span>
          </h1>
          <p className="text-lg text-blue-100 mb-8">
            We are team of talented designers making websites
          </p>
          <a href="/register" className="inline-block bg-green-400 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-lg shadow transition mb-4">
            Get Started
          </a>
        </div>
        {/* Right: Illustration */}
        <div className="w-full md:w-[400px] flex justify-center mt-10 md:mt-0">
          <Image src="/assets/loginpage/logo segi panjang.png" alt="SIAS Illustration" width={350} height={350} className="rounded-xl shadow-lg" />
        </div>
      </div>
      {/* Decorative shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-300 opacity-20 rounded-full blur-3xl z-0" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-300 opacity-10 rounded-full blur-3xl z-0" />
    </section>
  );
};

export default Hero;
