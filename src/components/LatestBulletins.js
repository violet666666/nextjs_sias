"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useBulletins from "@/lib/hooks/useBulletins";
import { Newspaper, Calendar, ArrowRight } from "lucide-react";

export default function LatestBulletins() {
  const { buletins, loading, error } = useBulletins(3);

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-600 rounded-full mb-3 sm:mb-4">
            <Newspaper className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-blue-700 px-2">Buletin Terbaru</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            Dapatkan informasi terbaru seputar kegiatan akademik dan pengumuman penting
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-500">Memuat buletin...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-red-500 text-lg mb-2">⚠️</div>
            <p className="text-sm sm:text-base text-red-500">{error}</p>
          </div>
        ) : buletins.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-md mx-2 sm:mx-0">
            <Newspaper className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-base sm:text-lg text-gray-500">Belum ada buletin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {buletins.map((b) => (
              <div 
                key={b._id} 
                className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col justify-between border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    <p className="text-xs text-gray-500">{new Date(b.tanggal).toLocaleDateString("id-ID", { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-blue-800 mb-2 sm:mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {b.judul}
                  </h3>
                  <p className="text-gray-700 mb-3 sm:mb-4 line-clamp-3 text-xs sm:text-sm leading-relaxed">
                    {b.isi.slice(0, 120)}{b.isi.length > 120 ? "..." : ""}
                  </p>
                </div>
                <Link 
                  href="/bulletin" 
                  className="inline-flex items-center justify-center gap-2 mt-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group-hover:gap-3 text-sm sm:text-base"
                >
                  Baca Selengkapnya
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        )}
        
        {buletins.length > 0 && (
          <div className="text-center mt-6 sm:mt-8">
            <Link 
              href="/bulletin"
              className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-semibold text-base sm:text-lg transition-colors"
            >
              Lihat Semua Buletin
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
} 