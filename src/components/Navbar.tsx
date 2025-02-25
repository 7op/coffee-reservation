import { Link } from 'react-router-dom'; // في حال كنت تستخدم React Router للانتقالات بين الصفحات
import { useState } from 'react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 fixed w-full top-0 left-0 shadow-lg z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* الشعار */}
        <div className="text-white text-4xl font-extrabold">
          <Link to="/">قهوة هيام</Link>
        </div>

        {/* قائمة التنقل للأجهزة الكبيرة */}
        <div className="hidden md:flex space-x-8 text-lg font-semibold text-white">
          <Link to="/" className="hover:text-yellow-300 transition-colors duration-300">الرئيسية</Link>
          <Link to="/booking" className="hover:text-yellow-300 transition-colors duration-300">الحجز</Link>
          <Link to="/about" className="hover:text-yellow-300 transition-colors duration-300">من نحن</Link>
          <Link to="/contact" className="hover:text-yellow-300 transition-colors duration-300">التواصل</Link>
        </div>

        {/* قائمة التنقل للأجهزة المحمولة */}
        <div className="md:hidden">
          <button onClick={toggleMobileMenu} className="text-white text-3xl focus:outline-none">
            {isMobileMenuOpen ? '×' : '☰'}
          </button>
        </div>
      </div>

      {/* القائمة المنبثقة للأجهزة المحمولة */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 mt-4 p-6 rounded-lg shadow-2xl">
          <div className="space-y-4">
            <Link to="/" className="block text-white text-xl font-semibold hover:text-yellow-300">الرئيسية</Link>
            <Link to="/booking" className="block text-white text-xl font-semibold hover:text-yellow-300">الحجز</Link>
            <Link to="/about" className="block text-white text-xl font-semibold hover:text-yellow-300">من نحن</Link>
            <Link to="/contact" className="block text-white text-xl font-semibold hover:text-yellow-300">التواصل</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
