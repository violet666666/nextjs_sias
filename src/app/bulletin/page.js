"use client";
import { useEffect, useState } from "react";
import useBulletins from "@/lib/hooks/useBulletins";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Calendar, User, Search, ArrowRight } from "lucide-react";

export default function BulletinPage() {
  const { buletins, loading, error } = useBulletins();
  const [searchTerm, setSearchTerm] = useState("");

  // Ambil 3 berita terbaru untuk sidebar (opsional jika layout berubah)
  // Untuk desain baru, kita gunakan featured item (index 0) dan grid (index 1+)
  const featuredBulletin = buletins[0];
  const otherBulletins = buletins.slice(1);

  // Filter bulletin
  const filteredBulletins = buletins.filter(b =>
    b.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.isi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Decide what to render based on search
  const isSearching = searchTerm.length > 0;
  const contentToRender = isSearching ? filteredBulletins : otherBulletins;


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <Navbar />
      <main className="flex-1 pb-20">
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
              Papan Pengumuman & Berita
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
              Informasi terkini seputar kegiatan akademik, prestasi, dan pengumuman penting sekolah.
            </p>

            <div className="max-w-lg mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Cari berita atau pengumuman..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500">Memuat berita terbaru...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-red-500 font-semibold">{error}</p>
            </div>
          ) : buletins.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Belum ada berita</h3>
              <p className="text-slate-500 mt-2">Cek kembali nanti untuk update terbaru.</p>
            </div>
          ) : (
            <>
              {/* Featured Article (Only show if not searching) */}
              {!isSearching && featuredBulletin && (
                <div className="mb-16">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                    Highlight Utama
                  </h2>
                  <div className="grid md:grid-cols-12 gap-8 bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden group">
                    <div className="md:col-span-7 relative h-64 md:h-auto rounded-2xl overflow-hidden">
                      <Image
                        src={featuredBulletin.gambar || "/assets/loginpage/pancake.png"} // Fallback image
                        alt={featuredBulletin.judul}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
                    </div>
                    <div className="md:col-span-5 flex flex-col justify-center">
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                        <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(featuredBulletin.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                        <Link href={`/bulletin/${featuredBulletin._id}`}>
                          {featuredBulletin.judul}
                        </Link>
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed">
                        {featuredBulletin.isi}
                      </p>
                      <div className="mt-auto">
                        <Link
                          href={`/bulletin/${featuredBulletin._id}`}
                          className="inline-flex items-center text-blue-600 font-semibold hover:gap-2 transition-all gap-1"
                        >
                          Baca Selengkapnya <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid List */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                  {isSearching ? `Hasil Pencarian: "${searchTerm}"` : 'Berita Lainnya'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(isSearching ? filteredBulletins : otherBulletins).map((bulletin) => (
                    <article key={bulletin._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                        <Image
                          src={bulletin.gambar || "/assets/loginpage/pancake.png"}
                          alt={bulletin.judul}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(bulletin.tanggal).toLocaleDateString("id-ID")}
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <User className="w-3.5 h-3.5 ml-1" />
                          {bulletin.author?.nama || "Admin"}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                          <Link href={`/bulletin/${bulletin._id}`}>
                            {bulletin.judul}
                          </Link>
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-4 flex-1">
                          {bulletin.isi}
                        </p>
                        <Link
                          href={`/bulletin/${bulletin._id}`}
                          className="text-blue-600 font-semibold text-sm hover:underline mt-auto inline-block"
                        >
                          Baca Selengkapnya
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}