import { LogIn, User, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import NotificationBell from './NotificationBell';
import logo from '../../assets/logo4.png';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = Boolean(user?.role && typeof user.role === 'string' && user.role.toLowerCase().includes('admin'));

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-md shadow sticky top-0 z-50">

      {/* Logo */}
      <Link to="/">
        <img src={logo} className="h-12" />
      </Link>

      {/* Desktop */}
      <DesktopNav />

      {/* Mobile */}
      <MobileNav />

      <div className="flex items-center gap-4">
      {/* Weather notifications — logged-in customers only */}
      {user && !isAdmin && <NotificationBell />}

      {/* Authentication Section */}
      {user ? (
        <div className="relative group flex items-center gap-3 cursor-pointer p-2 rounded-full hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EF8354] text-white shadow-md">
            <User size={18} />
          </div>
          <span className="hidden sm:block font-bold text-[#1a1a1c] text-sm">{user.name}</span>
          <ChevronDown size={14} className="text-gray-400 group-hover:rotate-180 transition-transform duration-500 ease-in-out" />
          
           {/* Profile Dropdown */}
           <div className="absolute top-[120%] right-0 w-48 bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl py-2 
                          opacity-0 invisible translate-y-4 scale-95
                          group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 
                          transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-50">
            <div className="flex flex-col">
                {isAdmin ? (
                 <Link to="/admin/admin-dashboard" className="px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-[#EF8354]/10 hover:text-[#EF8354] transition-colors rounded-lg mx-2">
                    Admin Dashboard
                 </Link>
              ) : (
                 <Link to="/user/profile" className="px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-[#EF8354]/10 hover:text-[#EF8354] transition-colors rounded-lg mx-2">
                    My Profile
                 </Link>
              )}
              <div className="h-px bg-gray-100 my-1 mx-3 border-0"></div>
              <button onClick={handleLogout} className="text-left px-5 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors rounded-lg mx-2 flex gap-2 items-center">
                  <LogIn size={16} className="rotate-180" /> Logout
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Link to="/login" className="relative flex items-center gap-2 bg-[#1a1a1c] text-white px-7 py-3 rounded-full text-sm font-semibold 
                          overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-[#EF8354]/20 active:scale-95">
          <LogIn size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
             <span className="z-10">Login</span>
          {/* Subtle Shine Effect */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></span>
        </Link>
      )}
      </div>

  

    </nav>
  );
};

export default Navbar;