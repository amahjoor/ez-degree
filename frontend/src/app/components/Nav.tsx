// src/components/Nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../account/AuthContext';

export function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-primary-blue text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center">
        {/* Left side: Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="font-bold text-xl hover:text-gray-200 transition-colors">
            ez.degree
          </Link>
          
          <div className="flex space-x-6">
            <Link 
              href="/search" 
              className={`font-medium text-lg hover:text-gray-200 transition-colors relative ${
                pathname.startsWith('/search') ? 'font-bold' : ''
              }`}
            >
              Search
              {pathname.startsWith('/search') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></span>
              )}
            </Link>
            <Link 
              href="/plan" 
              className={`font-medium text-lg hover:text-gray-200 transition-colors relative ${
                pathname.startsWith('/plan') ? 'font-bold' : ''
              }`}
            >
              Plan
              {pathname.startsWith('/plan') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></span>
              )}
            </Link>
            <Link 
              href="/see" 
              className={`font-medium text-lg hover:text-gray-200 transition-colors relative ${
                pathname.startsWith('/see') ? 'font-bold' : ''
              }`}
            >
              See
              {pathname.startsWith('/see') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></span>
              )}
            </Link>
          </div>
        </div>

        {/* Right side: Authentication */}
        <div className="ml-auto">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-200">Hi, {user.username}</span>
              <button 
                onClick={logout} 
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end space-y-1">
              <Link 
                href="/account/login"
                className="bg-white text-primary-blue hover:bg-gray-100 px-6 py-2 rounded-lg transition-colors font-medium shadow-sm"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
