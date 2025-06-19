// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function SignUpPage() {
  const { signup } = useAuth();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [p2, setP2] = useState('');
  const [error, setError] = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (p !== p2) return setError('Passwords must match');
    try {
      await signup(u, p);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
      <form onSubmit={handle} className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl p-8 w-full max-w-md space-y-6 text-white">
        <h1 className="text-3xl font-bold text-center">📝 Sign Up</h1>

        <input
          value={u}
          onChange={(e) => setU(e.target.value)}
          placeholder="Username"
          required
          className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          placeholder="Password"
          required
          className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="password"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          placeholder="Confirm Password"
          required
          className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-blue-500 hover:to-cyan-400 rounded-lg text-white font-semibold transition-all duration-300"
        >
          Register
        </button>
      </form>
    </div>
  );
}
