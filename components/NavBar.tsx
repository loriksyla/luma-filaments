import React, { useState, useEffect } from 'react';
import { ShoppingCart, Hexagon, Sun, Moon, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavBarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  cartCount: number;
  onCartClick: () => void;
  onUserClick: () => void;
  onAdminClick: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ isDarkMode, toggleTheme, cartCount, onCartClick, onUserClick, onAdminClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md py-4 shadow-lg border-b border-slate-200 dark:border-transparent'
          : 'bg-transparent py-6'
        }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer select-none">
          <Hexagon className="text-slate-900 dark:text-white fill-slate-900/10 dark:fill-white/10" size={28} strokeWidth={1.5} />
          <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">LUMA</span>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user?.isAdmin && (
            <button
              onClick={onAdminClick}
              className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-full transition-colors"
            >
              <Shield size={20} />
              <span className="text-sm">Admin</span>
            </button>
          )}

          <button
            onClick={onUserClick}
            className={`flex items-center gap-2 transition-colors ${user ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
          >
            <UserIcon size={20} />
            {user && <span className="text-sm">{user.name.split(' ')[0]}</span>}
          </button>

          <button
            onClick={onCartClick}
            className="relative group text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-teal-600 dark:bg-teal-500 text-[10px] font-bold text-white dark:text-slate-900 w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={toggleTheme}
            className="text-slate-900 dark:text-white"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {user?.isAdmin && (
            <button
              onClick={onAdminClick}
              className="text-rose-600 dark:text-rose-400"
            >
              <Shield size={20} />
            </button>
          )}
          <button
            onClick={onUserClick}
            className={`text-slate-900 dark:text-white ${user ? 'text-teal-600 dark:text-teal-400' : ''}`}
          >
            <UserIcon size={20} />
          </button>
          <button
            onClick={onCartClick}
            className="relative text-slate-900 dark:text-white"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-teal-600 dark:bg-teal-500 text-[10px] font-bold text-white dark:text-slate-900 w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;