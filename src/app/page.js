"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LatestBulletins from "@/components/LatestBulletins";
import Link from "next/link";
import { ArrowRight, BookOpen, Users, BarChart3, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white selection:bg-blue-200 selection:text-blue-900">
      <Navbar />
      <main>
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-32 lg:pt-32 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-8 animate-fade-in border border-blue-100 dark:border-blue-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Sistem Informasi Akademik Terintegrasi (Version 2.0)
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 dark:text-white animate-slide-in">
              Transformasi Digital <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Pendidikan Masa Depan
              </span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in animation-delay-500">
              Platform manajemen sekolah yang modern, efisien, dan transparan.
              Menghubungkan guru, siswa, dan orang tua dalam satu ekosistem digital yang harmonis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-bounce-in">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 group"
              >
                Mulai Sekarang
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 dark:text-slate-200 transition-all duration-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Pelajari Lebih Lanjut
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 bg-slate-50 dark:bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Fitur Unggulan</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Solusi lengkap untuk kebutuhan administrasi dan pembelajaran sekolah Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
                  title: "Analitik Data",
                  desc: "Pantau perkembangan nilai dan kehadiran siswa dengan dashboard interaktif real-time."
                },
                {
                  icon: <BookOpen className="w-8 h-8 text-blue-600" />,
                  title: "Manajemen Tugas",
                  desc: "Guru dapat memberikan tugas dan siswa mengumpulkan secara online dengan mudah."
                },
                {
                  icon: <Users className="w-8 h-8 text-blue-600" />,
                  title: "Portal Orang Tua",
                  desc: "Orang tua dapat memantau aktivitas akademik anak secara transparan dari mana saja."
                },
                {
                  icon: <ShieldCheck className="w-8 h-8 text-blue-600" />,
                  title: "Akses Aman",
                  desc: "Sistem autentikasi berlapis memastikan data sekolah tetap aman dan terlindungi."
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LATEST BULLETINS COMPONENT - Reusing existing component but wrapped nicely */}
        <section className="py-24 bg-white dark:bg-slate-900">
          <LatestBulletins />
        </section>

        {/* CTA SECTION */}
        <section className="py-20 bg-blue-600 relative overflow-hidden">
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('/assets/grid-pattern.png')] bg-repeat"></div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Siap untuk Transformasi Digital Sekolah Anda?</h2>
            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan siswa dan guru yang telah merasakan kemudahan sistem akademik terintegrasi.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-blue-600 transition-all duration-200 bg-white border border-transparent rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white shadow-xl"
            >
              Akses Portal Sekarang
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
