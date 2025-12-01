"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function BulletinDetailPage() {
  const { id } = useParams();
  const [buletin, setBuletin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/buletin`)
      .then(res => res.json())
      .then(data => {
        const found = Array.isArray(data) ? data.find(b => b._id === id) : null;
        if (!found) setError("Buletin tidak ditemukan");
        setBuletin(found);
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat buletin");
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto py-12 px-4 text-black">
          {loading ? (
            <div className="text-gray-500">Memuat buletin...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : !buletin ? (
            <div className="text-gray-500">Buletin tidak ditemukan.</div>
          ) : (
            <article>
              <h1 className="text-3xl font-bold mb-4 text-blue-800">{buletin.judul}</h1>
              <div className="text-xs text-gray-500 mb-4">
                {new Date(buletin.tanggal).toLocaleDateString("id-ID")} oleh {buletin.author?.nama || "Admin"}
              </div>
              {buletin.gambar && (
                <div className="mb-6">
                  <Image src={buletin.gambar} alt={buletin.judul} width={600} height={320} className="rounded-lg object-cover w-full max-h-80" />
                </div>
              )}
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: buletin.isi }} />
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 