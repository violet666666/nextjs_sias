"use client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import LatestBulletins from "@/components/LatestBulletins";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <main className="overflow-hidden">
        <Hero />
        <About />
        <Features />
        <LatestBulletins />
      </main>
      <Footer />
    </div>
  );
}
