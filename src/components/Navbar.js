import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="w-full bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="flex justify-between h-16 items-center text-white">
          <Link href="/">
            <span className="flex-shrink-0 flex items-center cursor-pointer">
              <Image
                src="/assets/loginpage/logo segi panjang.png"
                alt="SIAS"
                width={100}
                height={24}
                className="invert"
              />
            </span>
          </Link>

          <div className="hidden sm:flex sm:space-x-8 items-center">
            <Link
              href="/"
              className="text-white hover:text-blue-400 px-3 py-2 text-sm font-medium"
            >
              Home
            </Link>
            <Link
              href="/bulletin"
              className="text-white hover:text-blue-400 px-3 py-2 text-sm font-medium"
            >
              Buletin
            </Link>
            <Link
              href="/search"
              className="text-white hover:text-blue-400 px-3 py-2 text-sm font-medium flex items-center gap-1"
            >
              <Search className="h-4 w-4" />
              Search
            </Link>
            <Link
              href="/login"
              className="ml-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-semibold shadow transition-colors duration-200"
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
