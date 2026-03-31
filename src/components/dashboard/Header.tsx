'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function DashboardHeader() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/';   // Full redirect to home (cleanest)
    } catch (err) {
      console.error(err);
      window.location.href = '/';
    }
  };

  const displayName = user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={user?.user_type === 'buyer' ? '/buyer' : user?.user_type === 'provider' ? '/provider' : '/'}>
          <h1 className="text-3xl font-bold text-gray-800 cursor-pointer">
            GIS Marketplace
          </h1>
        </Link>

        <div className="relative">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-md cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {loading ? '..' : initials}
          </div>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl py-2 text-sm border border-gray-100">
              <div className="px-4 py-3 border-b">
                <p className="font-medium text-black">{displayName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              <Link
                href="/dashboard/profile"
                className="block px-4 py-2.5 text-black hover:bg-gray-50"
                onClick={() => setIsDropdownOpen(false)}
              >
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-red-600 font-medium"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}