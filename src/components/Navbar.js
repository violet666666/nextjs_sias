import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-700 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex-shrink-0 flex items-center cursor-pointer transition-transform group-hover:scale-105">
              <Image
                src="/assets/loginpage/logoNavbarBaru.png"
                alt="SIAS"
                width={110}
                height={28}
                className="dark:invert-0"
              />
            </span>
          </Link>

          <div className="hidden sm:flex sm:space-x-8 items-center">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/bulletin"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Buletin
            </Link>
            <Link
              href="/search"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <Search className="h-4 w-4" />
              Search
            </Link>
            <Link
              href="/login"
              className="ml-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
