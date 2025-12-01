"use client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Footer from "@/components/Footer";
import LatestBulletins from "@/components/LatestBulletins";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <main>
        <Hero />
        <About />
        <LatestBulletins />
      </main>
      <Footer />
    </div>
  );
}
