
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from './icons/LogoutIcon';
import UsersIcon from './icons/UsersIcon';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, children }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-neutral-800 shadow-sm sticky top-0 z-20">
      <div className="max-w-full mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        
        <div className="flex items-center space-x-4">
          {children}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                aria-label="User menu"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center text-white font-bold">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-semibold">{user.firstName} {user.lastName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</span>
                </div>
              </button>

              {dropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-neutral-800 ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-neutral-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white" role="none">
                          Signed in as
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate" role="none">
                          {user.email}
                      </p>
                  </div>
                  <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700" role="menuitem">
                    <LogoutIcon className="w-5 h-5 mr-2" />
                    Logout
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
