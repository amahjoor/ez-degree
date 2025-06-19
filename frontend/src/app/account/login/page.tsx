'use client';

import { useState } from 'react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-black">
      <form
        onSubmit={handle}
        className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200"
      >
        <h1 className="text-3xl font-extrabold text-center text-blue-800 mb-6 tracking-wide">
          Welcome Back
        </h1>

        <input
          value={u}
          onChange={(e) => setU(e.target.value)}
          placeholder="Username"
          required
          className="w-full mb-4 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />

        <input
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          placeholder="Password"
          required
          className="w-full mb-4 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />

        {error && (
          <p className="text-red-600 font-medium text-sm mb-4 text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition duration-300"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
