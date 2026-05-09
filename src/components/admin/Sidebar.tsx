'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

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

  return (
    <aside className="w-72 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0 shadow-sm overflow-y-auto">
      {/* Logo */}
      <div className="px-8 py-7 border-b border-gray-100 flex-shrink-0">
        <h1 className="text-3xl font-bold text-blue-600">AdminGate</h1>
      </div>

      {/* Menu */}
      <nav className="px-6 py-8 flex-1">
        <div className="space-y-1">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
              pathname === '/admin'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            RFP Review Queue
          </Link>

          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
              pathname === '/admin/dashboard'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Bottom Section - Logout */}
      <div className="mt-auto border-t border-gray-100 p-4 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 text-sm font-medium text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}