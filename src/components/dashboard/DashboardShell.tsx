'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Briefcase, FileText, Receipt, Star, Bell } from 'lucide-react';

const providerNav = [
  { label: 'Dashboard',    href: '/provider',           icon: LayoutDashboard },
  { label: 'Job Bidding',  href: '/provider/available', icon: Briefcase },
  { label: 'Quotes',       href: '/provider/quote',     icon: FileText },
  { label: 'Invoicing',    href: '/provider/invoicing', icon: Receipt },
  { label: 'Subscription', href: '/subscribe',          icon: Star },
];

const buyerNav = [
  { label: 'Dashboard',    href: '/buyer',              icon: LayoutDashboard },
  { label: 'Create RFP',   href: '/buyer/create',       icon: Briefcase },
  { label: 'RFPs & Quotes',       href: '/buyer/quote',        icon: FileText },
  { label: 'Invoicing',    href: '/buyer/invoice',      icon: Receipt },
  { label: 'Subscription', href: '/subscribe',          icon: Star },
];

export default function DashboardShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const isBuyer = pathname?.startsWith('/buyer');
  const navItems = isBuyer ? buyerNav : providerNav;

  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdown] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.user && setUser(d.user))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = '/';
  };

  const displayName = user?.email?.split('@')[0] || 'User';
  const orgName = user?.org_name || (isBuyer ? 'Acme Services' : 'My Company');
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Rounded Pill Navbar - Sticky */}
      <header className="sticky top-4 z-50 w-full px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-card rounded-full px-8 py-3 flex items-center justify-between shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md">
            
            {/* Logo */}
            <Link
              href={isBuyer ? '/buyer' : '/provider'}
              className="flex items-center gap-2 shrink-0"
            >
              <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                <rect y="0" width="22" height="3" rx="1.5" fill="#111827" />
                <rect y="7" width="16" height="3" rx="1.5" fill="#111827" />
                <rect y="14" width="10" height="3" rx="1.5" fill="#111827" />
              </svg>
              <span className="font-bold text-foreground text-3xl tracking-tight">
                GISMarketplace
              </span>
            </Link>

            {/* Navigation Pills */}
            <nav className="flex items-center gap-1 flex-1 justify-center">
              {navItems.map(({ label, href, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== '/provider' && href !== '/buyer' && pathname?.startsWith(href));

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      active
                        ? 'bg-foreground text-white shadow-sm'
                        : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side - Bell + User */}
            <div className="flex items-center gap-3">
              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setDropdown(!dropdownOpen)}
                  className="flex items-center gap-3 py-1 pr-2 rounded-full transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold border-2 border-white shadow">
                    {initials}
                  </div>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-card rounded-2xl shadow-xl border border-border py-2 z-50">
                      <div className="px-4 py-3 border-b">
                        <p className="font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium"
                      >
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}