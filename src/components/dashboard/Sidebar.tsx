'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const isBuyer = pathname?.startsWith('/buyer');

  const buyerMenuItems = [
    { name: 'Dashboard', href: '/buyer' },
    { name: 'Create RFP',href: '/buyer/create' },
    { name: 'Received Quotes',href: '/buyer/quote' },
    { name: 'Awarded Providers',href: '/buyer' },
    { name: 'Ongoing Projects',href: '/buyer' },
    { name: 'Invoices',href: '/buyer' },
  ];

  const providerMenuItems = [
    { name: 'Dashboard',href: '/provider' },
    { name: 'Available RFPs', href: '/provider/available' },
    { name: 'Submitted Quotes', href: '/provider/quote' },
    { name: 'Awarded Projects', href: '/provider' },
    { name: 'Ongoing Projects', href: '/provider' },
  ];

  const menuItems = isBuyer ? buyerMenuItems : providerMenuItems;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/';   // Clean redirect to home
    } catch (err) {
      console.error(err);
      window.location.href = '/';
    }
  };

  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col sticky top-0 shadow-sm">
      <div className="px-6 py-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
          {isBuyer ? 'B' : 'P'}
        </div>
        <span className="font-bold text-xl text-gray-900 tracking-tight">
          {isBuyer ? 'BuyerHub' : 'ProviderHub'}
        </span>
      </div>

      <nav className="px-4 space-y-1 flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}