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
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
           <Link href="/" className="font-bold text-xl hover:text-gray-200 transition-colors">
                4yrplan
              </Link>
              <div className="flex space-x-8">
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
        <div className="space-x-4">
          {user
            ? <>
                <span>Hi, {user.username}</span>
                <button onClick={logout} className="underline">Logout</button>
              </>
            : <>
                <Link href="/account/login">Login</Link>
                <Link href="/account/signup">Sign Up</Link>
              </>
          }
        </div>
      </div>
    </nav>
  );
}
