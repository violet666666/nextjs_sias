import Image from "next/image";

const UnderDevelopment = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-6 text-center bg-gray-100 text-gray-800">
      <p className="text-xl md:text-2xl font-semibold mb-8">
        Mohon maaf, halaman ini masih dalam tahap pengembangan.
      </p>
      <div
        className="relative w-full max-w-2xl mx-auto"
        style={{ aspectRatio: "1.5 / 1" }}
      >
        {/* Main Illustration Placeholder */}
        <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
          <p>Illustration: Person working at desk</p>
        </div>
        {/* Details Placeholders - can be more specific if desired */}
        {/* Lamp */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-24 h-24 bg-orange-400 rounded-b-full flex items-center justify-center text-white font-bold text-xs">
          Lamp
        </div>
        {/* Light beam */}
        <div
          className="absolute top-[15%] left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-200 opacity-50 blur-sm"
          style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
        ></div>
        {/* Bookshelf */}
        <div className="absolute top-[30%] left-[10%] w-32 h-24 bg-gray-300 rounded flex items-center justify-center text-gray-600 font-bold text-xs">
          Books
        </div>
        {/* Clock */}
        <div className="absolute top-[25%] right-[10%] w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
          Clock
        </div>
        {/* Desk items (bottle, cup, etc.) */}
        <div className="absolute bottom-[10%] left-[20%] w-48 h-16 bg-gray-300 rounded flex items-center justify-center text-gray-600 font-bold text-xs">
          Desk Items
        </div>
      </div>
    </div>
  );
};

export default UnderDevelopment;
