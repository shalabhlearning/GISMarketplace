'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTransition } from 'react';
import {
  Home,
  FileText,
  CheckSquare,
  Award,
  Clock,
  PlusCircle,
  MessageSquare,
  Users,
  Briefcase,
  Receipt,
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = router.pathname;
  const [isPending, startTransition] = useTransition();

  // Determine buyer or provider based on actual page routes
  const isBuyer = pathname.startsWith('/Buyer');

  // Updated menu links to match your Pages Router files
  const buyerMenuItems = [
    { name: 'Dashboard', icon: Home, href: '/Buyerpage' },
    { name: 'Create RFP', icon: PlusCircle, href: '/BuyerCreatepage' },
    { name: 'Received Quotes', icon: MessageSquare, href: '/BuyerQuotepage' },
    { name: 'Awarded Providers', icon: Users, href: '/Buyerpage' },
    { name: 'Ongoing Projects', icon: Briefcase, href: '/Buyerpage' },
    { name: 'Invoices', icon: Receipt, href: '/Buyerpage' },
  ];

  const providerMenuItems = [
    { name: 'Dashboard', icon: Home, href: '/Providerpage' },
    { name: 'Available Projects', icon: FileText, href: '/ProviderAvailablepage' },
    { name: 'Submitted Quotes', icon: CheckSquare, href: '/ProviderQuotepage' },
    { name: 'Awarded Projects', icon: Award, href: '/Providerpage' },
    { name: 'Ongoing Projects', icon: Clock, href: '/Providerpage' },
  ];

  const menuItems = isBuyer ? buyerMenuItems : providerMenuItems;

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
          const Icon = item.icon;
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
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button with loading state */}
      <div className="p-4 border-t border-gray-50">
        <form
          action="/api/auth/logout"
          method="POST"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(() => {
              (e.currentTarget as HTMLFormElement).submit();
            });
          }}
        >
          <button
            type="submit"
            disabled={isPending}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors ${
              isPending
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            {isPending ? 'Logging out...' : 'Log Out'}
          </button>
        </form>
      </div>
    </aside>
  );
}