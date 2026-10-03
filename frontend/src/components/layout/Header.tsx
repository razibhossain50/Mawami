"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Layout, Menu, X, User, ChevronDown, LogIn, UserPlus, Settings, LogOut, UserRoundPen, LayoutDashboard, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRegularAuth } from '@/context/RegularAuthContext';
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { useBiodataStatus } from '@/hooks/useBiodataStatus';

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  // The signed-in user's own biodata (shared, cached query)
  const { statusInfo, loading: biodataLoading } = useBiodataStatus();
  const biodataId = statusInfo?.id ?? null;
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useRegularAuth();

  const navItems = [
    { label: 'Find your partner', href: '/', active: true }
  ];


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header>
      <nav className="  bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left section */}
            <div className="flex items-center md:hidden">
              {/* Mobile menu button */}
              <div className="" ref={mobileMenuRef}>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-brand-600 hover:bg-gradient-to-r hover:from-brand-50 hover:to-rose-50 focus:outline-none transition-all duration-200 dark:text-gray-300 dark:hover:text-brand-400"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" />
                  ) : (
                    <Menu className="block h-6 w-6" />
                  )}
                </button>

                {/* Mobile menu dropdown */}
                <div
                  className={`absolute left-0 mt-2 w-full px-2 pt-2 pb-3 bg-white shadow-lg rounded-md transition-all duration-200 transform ${isMobileMenuOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
                >
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${item.active
                        ? 'text-indigo-700 bg-indigo-50'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                        }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle section - Navigation Items (hidden on mobile) */}
            <div className="md:order-2 hidden md:flex items-center justify-center space-x-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out group ${item.active
                    ? 'text-brand-700 bg-gradient-to-r from-brand-50 to-rose-50 dark:from-brand-900/20 dark:to-rose-900/20 dark:text-brand-300'
                    : 'text-gray-700 hover:text-brand-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-brand-50/50 dark:text-gray-300 dark:hover:text-brand-400'
                    }`}
                >
                  {item.active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-purple-500/10 rounded-lg"></div>
                  )}
                  <span className="relative">{item.label}</span>
                </a>
              ))}
            </div>

             {/* Logo */}
            <div className="order-2 md:order-1 flex-1 md:flex-0 text-center">
              <Link href="/" className="inline-block px-4 w-[180px]">
                  <Image
                    src="/images/logo/logo.png"
                    alt="Mawami logo"
                    width={240}
                    height={80}
                    priority
                  />
                  <span className="sr-only">Mawami</span>
              </Link>
            </div>

            {/* Right section */}
            <div className="order-3 flex items-center space-x-4">
              {/* Auth Buttons (hidden on mobile) */}
              {!isAuthenticated && (
                <div className="hidden md:flex items-center space-x-3">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-all duration-200 ease-in-out hover:bg-brand-50/50 rounded-lg dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="relative px-4 py-2 text-sm font-medium text-rose-500 hover:text-white bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative">Sign Up</span>
                  </Link>
                </div>
              )}

              {/* User Info (when authenticated) */}
              {isAuthenticated && (
                <div className="hidden md:flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.fullName || user?.email}
                  </span>
                </div>
              )}

              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-1 p-2 rounded-lg text-gray-700 hover:text-brand-600 hover:bg-gradient-to-r hover:from-brand-50 hover:to-rose-50 focus:outline-none transition-all duration-200 dark:text-gray-300 dark:hover:text-brand-400 group"
                >
                  <div className="relative">
                    <User className="h-5 w-5" />
                    {isAuthenticated && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* Profile Dropdown */}
                <div
                  className={`user-profile-dropdown absolute right-0 z-50 mt-2 w-56 rounded-xl shadow-xl py-2 bg-white/95 backdrop-blur-sm border border-gray-100 dark:bg-gray-900/95 dark:border-gray-800 transition-all duration-200 ease-in-out transform origin-top-right ${isProfileMenuOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
                >
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Account</div>
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-brand-50 hover:to-rose-50 hover:text-brand-700 rounded-lg mx-2 transition-all duration-200 dark:text-gray-300 dark:hover:text-brand-400 dark:hover:from-brand-900/20 dark:hover:to-rose-900/20"
                      >
                        <LayoutDashboard className="mr-3 h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        href={biodataId ? `/profile/biodatas/edit/${biodataId}` : '/profile/biodatas/edit/new'}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-brand-50 hover:to-rose-50 hover:text-brand-700 rounded-lg mx-2 transition-all duration-200 dark:text-gray-300 dark:hover:text-brand-400 dark:hover:from-brand-900/20 dark:hover:to-rose-900/20"
                      >
                        <UserRoundPen className="mr-3 h-4 w-4" />
                        {biodataId ? 'Edit Biodata' : 'Create Biodata'}
                        {biodataLoading && (
                          <div className="ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-brand-50 hover:to-rose-50 hover:text-brand-700 rounded-lg mx-2 transition-all duration-200 dark:text-gray-300 dark:hover:text-brand-400 dark:hover:from-brand-900/20 dark:hover:to-rose-900/20"
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                      <div className="border-t border-gray-100 dark:border-gray-800 my-2 mx-2"></div>
                      <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg mx-2 transition-all duration-200 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Get Started</div>
                      <Link
                        href="/auth/login"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-brand-50 hover:to-rose-50 hover:text-brand-700 rounded-lg mx-2 transition-all duration-200 dark:text-gray-300 dark:hover:text-brand-400 dark:hover:from-brand-900/20 dark:hover:to-rose-900/20"
                      >
                        <LogIn className="mr-3 h-4 w-4" />
                        Login
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="flex items-center px-4 py-2.5 text-sm text-rose-500 hover:text-white hover:bg-rose-500 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 rounded-lg mx-2 transition-all duration-200"
                      >
                        <UserPlus className="mr-3 h-4 w-4" />
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;