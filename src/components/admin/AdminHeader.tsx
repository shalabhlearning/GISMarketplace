'use client';

import { useEffect, useState } from 'react';

interface AdminHeaderProps {
  title?: string;
}

export default function AdminHeader({ title = "Admin Dashboard" }: AdminHeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      window.location.href = '/';
    }
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Admin';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b mb-2 border-gray-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        
        {/* Left Side - Dynamic Page Title */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">Administration Panel</p>
        </div>

        {/* Right Side - User Profile */}
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold text-lg shadow-md cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {loading ? '..' : initials}
          </div>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl py-2 text-sm border border-gray-100 z-30">
              <div className="px-5 py-4 border-b">
                <p className="font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                <p className="text-xs uppercase tracking-widest text-blue-600 mt-2">Administrator</p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-5 py-3 hover:bg-red-50 text-red-600 font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}