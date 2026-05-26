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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          const userType = data?.user?.userType;
          if (userType === 'admin') window.location.assign('/admin');
          else if (userType === 'provider') window.location.assign('/provider');
          else if (userType === 'buyer') window.location.assign('/buyer');
          else window.location.assign('/');
        }, 800);
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="your@email.com or +1234567890"
                className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-semibold bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-70"
            >
              {loading ? 'Logging in…' : 'Sign In'}
            </button>
          </form>

          {message && (
            <p
              className={`mt-4 text-sm text-center p-3 rounded-2xl font-medium ${
                message.includes('successful')
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don’t have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-primary font-medium hover:underline"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}