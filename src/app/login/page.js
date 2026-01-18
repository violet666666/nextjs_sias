"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background shapes - Placeholder for abstract background from image */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400 transform rotate-45 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500 transform -rotate-30 translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-600 transform rotate-60 -translate-y-1/2"></div>
        <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-blue-400 transform -rotate-15 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden max-w-4xl w-full">
        {/* Left section: Image Placeholder */}
        <div className="lg:w-1/2 bg-gray-300 dark:bg-gray-600 flex items-center justify-center p-8 lg:flex">
          <div className="w-full h-full bg-gray-400 dark:bg-gray-500 rounded-lg flex items-center justify-center text-gray-700 dark:text-gray-200 text-center">
            <Image
              src="/assets/loginpage/pancake.png"
              alt="Pancakes"
              width={300}
              height={300}
              className="object-contain rounded-lg shadow-md"
              priority
            />
          </div>
        </div>

        {/* Right section: Login Form */}
        <div className="lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/assets/loginpage/logo segi panjang.png"
              alt="SIAS Logo"
              width={120}
              height={40}
              priority
            />
          </div>

          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Sign In
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="sr-only">
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                placeholder="Password"
              />
            </div>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <a
              href="#"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
