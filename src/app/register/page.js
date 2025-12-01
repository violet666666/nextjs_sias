"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    nama: "", // Ganti username menjadi nama agar sesuai dengan backend
    email: "",
    password: "",
    role: "siswa", // Default role siswa, atau sesuaikan
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Register success! You can now login.");
    setForm({ nama: "", email: "", password: "", role: "siswa" });
      } else {
        setError(data.message || "Register failed");
      }
    } catch (err) {
      setError("Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-black flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Register Akun
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
        <input // Seharusnya ini adalah 'Nama Lengkap'
              type="text"
          name="nama" // Ganti name menjadi nama
          value={form.nama}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required // Role sebaiknya required
            >
          <option value="siswa">Siswa</option>
          {/* Tambahkan role lain jika registrasi publik diizinkan untuk role tersebut */}
          {/* <option value="guru">Guru</option> */}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        {message && (
          <div className="mt-4 text-green-600 text-center">{message}</div>
        )}
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
      </div>
    </div>
  );
}
