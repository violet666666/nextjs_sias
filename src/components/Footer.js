const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-700 py-6 text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} SIAS. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
