'use client';

import { useEffect, useState, useRef } from 'react';
import { UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHeader() {
  const [user, setUser] = useState<{ email?: string; user_type?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  const displayName = user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href={user?.user_type === 'buyer' ? '/Buyerpage' : '/Providerpage'}>
          <div className="flex items-center gap-3">
            {/* Your original empty div - kept exactly as you pasted */}
          </div>
        </Link>

        {/* Right: Profile Avatar + Clickable Dropdown */}
        <div className="relative">
          <div
            ref={avatarRef}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-md cursor-pointer"
            onClick={toggleDropdown}
          >
            {loading ? (
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            ) : (
              initials
            )}
          </div>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl py-2 text-sm text-gray-800 border border-gray-100 animate-fadeIn"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium truncate">{displayName}</p>
                <p className="text-xs text-gray-500 mt-1">{user?.email || 'Logged in'}</p>
              </div>

              <Link
                href="/dashboard/profile"
                className="block px-4 py-2.5 hover:bg-gray-50 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                Profile
              </Link>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-red-600 transition-colors font-medium"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Log Out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}