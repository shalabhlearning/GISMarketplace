'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
  Receipt 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  // Determine if we are on the buyer or provider side
  const isBuyer = pathname.startsWith('/dashboard/buyer');

  // Define menus for both roles
  const buyerMenuItems = [
    { name: 'Dashboard', icon: Home, href: '/dashboard/buyer' },
    { name: 'Create RFP', icon: PlusCircle, href: '/dashboard/buyer/create' },
    { name: 'Received Quotes', icon: MessageSquare, href: '/dashboard/buyer/quotes' },
    { name: 'Awarded Providers', icon: Users, href: '/dashboard/buyer/providers' },
    { name: 'Ongoing Projects', icon: Briefcase, href: '/dashboard/buyer/projects' },
    { name: 'Invoices', icon: Receipt, href: '/dashboard/buyer/invoices' },
  ];

  const providerMenuItems = [
    { name: 'Dashboard', icon: Home, href: '/dashboard/provider' },
    { name: 'Available Quotes', icon: FileText, href: '/dashboard/provider/available' },
    { name: 'Submitted Quotes', icon: CheckSquare, href: '/dashboard/provider/submitted' },
    { name: 'Awarded Quotes', icon: Award, href: '/dashboard/provider/awarded' },
    { name: 'Ongoing RFP', icon: Clock, href: '/dashboard/provider/ongoing' },
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
      
      {/* Footer / Settings Link */}
      <div className="p-4 border-t border-gray-50">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
            Log Out
        </button>
      </div>
    </aside>
  );
}