"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useBulletins from "@/lib/hooks/useBulletins";

export default function LatestBulletins() {
  const { buletins, loading, error } = useBulletins(3);

  return (
    <section className="max-w-6xl mx-auto my-16 px-4">
      <h2 className="text-3xl font-bold mb-8 text-blue-700 text-center">Buletin Terbaru</h2>
      {loading ? (
        <div className="text-gray-500 text-center">Memuat buletin...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : buletins.length === 0 ? (
        <div className="text-gray-500 text-center">Belum ada buletin.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {buletins.map((b) => (
            <div key={b._id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between border border-blue-100 hover:shadow-xl transition">
              <div>
                <h3 className="text-lg font-bold text-blue-800 mb-2 line-clamp-2">{b.judul}</h3>
                <p className="text-xs text-gray-500 mb-2">{new Date(b.tanggal).toLocaleDateString("id-ID")}</p>
                <p className="text-gray-700 mb-4 line-clamp-3">{b.isi.slice(0, 100)}{b.isi.length > 100 ? "..." : ""}</p>
              </div>
              <Link href="/bulletin" className="inline-block mt-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition text-center">Read More</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
} 