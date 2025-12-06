import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <Image
                src="/assets/loginpage/logo circle rounded.png"
                alt="SIAS Logo"
                width={40}
                height={40}
              />
              <span className="ml-2 text-xl font-bold text-white">SIAS</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Sistem Informasi Akademik Siswa - Platform terintegrasi untuk manajemen akademik digital.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-blue-400 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-pink-600 hover:bg-pink-700 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Tautan Cepat</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-blue-400 transition-colors">Beranda</Link>
              </li>
              <li>
                <Link href="/bulletin" className="hover:text-blue-400 transition-colors">Buletin</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-400 transition-colors">Masuk</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-400 transition-colors">Daftar</Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-4">Fitur</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">Manajemen Kelas</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">Tugas & Penilaian</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">Kehadiran</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">Laporan Nilai</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontak</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>info@sias.ac.id</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>+62 123 456 789</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 mt-1" />
                <span>Jl. Pendidikan No. 123, Jakarta</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} SIAS. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0 text-sm">
              <Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
