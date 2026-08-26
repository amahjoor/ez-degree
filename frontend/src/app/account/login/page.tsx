'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [error, setError] = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(u, p);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-gray-600">
              Sign in to save your plan
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900">
            <p className="font-medium mb-1">Judge demo account</p>
            <p>Username: <span className="font-mono">judge</span></p>
            <p>Password: <span className="font-mono">MasonPride2026</span></p>
          </div>

          {/* Form */}
          <form onSubmit={handle} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={u}
                onChange={(e) => setU(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password" 
                type="password"
                value={p}
                onChange={(e) => setP(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary-blue hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
            >
              Sign In
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              New here?{' '}
              <Link 
                href="/account/signup" 
                className="text-primary-blue hover:text-blue-600 font-medium underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
