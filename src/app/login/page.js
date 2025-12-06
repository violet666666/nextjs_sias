"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

const ROLE_DASHBOARD = {
  admin: "/cpanel/dashboard", // bisa diubah sesuai kebutuhan
  guru: "/cpanel/dashboard",
  siswa: "/cpanel/dashboard",
  orangtua: "/cpanel/dashboard",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      // Simpan user ke localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token); // Simpan token
      // Redirect ke dashboard sesuai role
      const dashboard = ROLE_DASHBOARD[data.user.role] || "/cpanel/dashboard";
      router.push(dashboard);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button - Above container */}
      <div className="mb-4 sm:mb-6 w-full max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 lg:hidden" />
          <Home className="w-4 h-4 hidden lg:block" />
          Kembali ke Beranda
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row bg-white shadow-lg rounded-xl overflow-hidden max-w-5xl w-full border border-gray-200">
        {/* Left section: Logo & Branding - Hidden on mobile */}
        <div className="hidden lg:flex lg:w-1/2 bg-blue-700 flex-col items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 text-white">
          <div className="flex flex-col items-center text-center w-full">
            <div className="mb-4 sm:mb-6">
              <Image
                src="/assets/loginpage/logo circle rounded.png"
                alt="SIAS Logo"
                width={100}
                height={100}
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[120px] lg:h-[120px] drop-shadow-lg"
                priority
              />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 drop-shadow-md">
              SIAS
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-4 sm:mb-6 font-medium">
              Sistem Informasi Akademik Siswa
            </p>
            <div className="w-20 sm:w-24 h-1 bg-green-500 rounded-full mb-6 sm:mb-8"></div>
            <p className="text-blue-100 text-sm sm:text-base max-w-sm leading-relaxed px-2">
              Platform terintegrasi untuk manajemen akademik digital yang memudahkan komunikasi antara siswa, guru, dan orang tua.
            </p>
          </div>
        </div>

        {/* Right section: Login Form */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <Image
                  src="/assets/loginpage/logo circle rounded.png"
                  alt="SIAS Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                  priority
                />
                <span className="text-xl sm:text-2xl font-bold text-gray-900">SIAS</span>
              </div>
            </div>

            <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Masuk ke Akun
            </h2>
            <p className="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
              Silakan masuk dengan kredensial Anda
            </p>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-sm sm:text-base"
                  placeholder="Masukkan email Anda"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-sm sm:text-base"
                  placeholder="Masukkan password Anda"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 text-center">
                  {error}
                </div>
              )}
              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    "Masuk"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <a
                href="#"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Lupa password?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
