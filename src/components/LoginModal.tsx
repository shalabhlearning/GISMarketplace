'use client';

import { useState, useEffect, useRef } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
}: LoginModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!identifier.trim()) {
      setMessage('Provide an email or phone number');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Login successful! Redirecting...');

        // Updated Redirection Logic
        setTimeout(() => {
          if (data.user?.userType === 'provider') {
            window.location.href = '/dashboard/provider';
          } else if (data.user?.userType === 'buyer') {
            window.location.href = '/dashboard/buyer';
          } else {
            window.location.href = '/';
          }
        }, 800);
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-2xl"
      >
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 text-center w-full">Welcome back</h2>
            <button onClick={onClose} className="p-1 text-xl text-gray-400 hover:text-gray-600">×</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Email or Phone Number</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="your@email.com or +1234567890"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-black text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white uppercase rounded-xl bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          {message && (
            <p className={`mt-4 text-xs font-medium text-center p-2 rounded-lg ${message.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </p>
          )}

          <p className="mt-4 text-xs text-center text-gray-600">
            Don’t have an account?{' '}
            <button onClick={onSwitchToRegister} className="font-medium text-blue-600 hover:underline">Register</button>
          </p>
        </div>
      </div>
    </div>
  );
}