"use client";
import { useEffect, useState } from "react";
import useBulletins from "@/lib/hooks/useBulletins";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function BulletinPage() {
  const { buletins, loading, error } = useBulletins();

  // Ambil 3 berita terbaru untuk sidebar
  const recent = buletins.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-12 px-4 text-black">
          <h1 className="text-4xl font-bold mb-10 text-blue-700 text-center">Buletin</h1>
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Main Bulletin List */}
            <div className="flex-1 space-y-8">
              {loading ? (
                <div className="text-gray-500">Memuat buletin...</div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : buletins.length === 0 ? (
                <div className="text-gray-500">Belum ada buletin.</div>
              ) : (
                buletins.map((b) => (
                  <div key={b._id} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row gap-6 border border-blue-100 hover:shadow-xl transition">
                    {/* Gambar jika ada */}
                    {b.gambar && (
                      <div className="w-full md:w-48 flex-shrink-0 flex items-center justify-center">
                        <Image src={b.gambar} alt={b.judul} width={180} height={120} className="rounded-lg object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link href={`/bulletin/${b._id}`} className="text-2xl font-bold text-blue-800 mb-2 hover:underline block">{b.judul}</Link>
                      <p className="text-xs text-gray-500 mb-2">{new Date(b.tanggal).toLocaleDateString("id-ID")} oleh {b.author?.nama || "Admin"}</p>
                      <p className="text-gray-700 mb-4 whitespace-pre-line">{b.isi.length > 200 ? b.isi.slice(0, 200) + "..." : b.isi}</p>
                      {b.lampiran && (
                        <a href={b.lampiran} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Lihat Lampiran</a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Sidebar: Berita Terkini */}
            <aside className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-blue-50 rounded-2xl shadow p-6">
                <h3 className="text-xl font-bold text-blue-700 mb-4">Berita Terkini</h3>
                <div className="space-y-4">
                  {recent.map((b) => (
                    <div key={b._id} className="flex gap-3 items-center bg-white rounded-lg shadow-sm p-3 border border-blue-100">
                      {/* Gambar kecil jika ada, jika tidak pakai pancake.png */}
                      <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        <Image src={b.gambar || "/assets/loginpage/pancake.png"} alt={b.judul} width={56} height={56} className="object-cover" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{new Date(b.tanggal).toLocaleDateString("id-ID")}</p>
                        <Link href={`/bulletin/${b._id}`} className="text-sm font-semibold text-blue-800 line-clamp-2 hover:underline">{b.judul}</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 