// src/components/admin/AdminLayout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, ClipboardList } from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'RFP Review Queue', href: '/admin/rfp-review', icon: ClipboardList },
];

export default function AdminLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
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

  const displayName = user?.name || user?.email?.split('@')[0] || 'Admin';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-4 z-50 w-full px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-card border border-border rounded-full px-8 py-3 flex items-center justify-between shadow-sm">

            {/* Logo */}
            <Link href="/admin/dashboard" className="flex items-center gap-2 shrink-0">
              <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                <rect y="0" width="22" height="3" rx="1.5" fill="currentColor" />
                <rect y="7" width="16" height="3" rx="1.5" fill="currentColor" />
                <rect y="14" width="10" height="3" rx="1.5" fill="currentColor" />
              </svg>
              <span className="font-bold text-foreground text-3xl tracking-tight">
                GISMarketplace
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1 flex-1 justify-center">
              {adminNav.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || (href === '/admin' && pathname === '/admin');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      active
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                Administrator
              </span>

              <div className="relative">
                <button
                  onClick={() => setDropdown(!dropdownOpen)}
                  className="flex items-center gap-2 py-1 rounded-full transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-primary-foreground font-bold text-sm border-2 border-background">
                    {initials}
                  </div>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="font-medium text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 font-medium"
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

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        {title && <h1 className="text-3xl font-semibold text-foreground mb-8">{title}</h1>}
        {children}
      </main>
    </div>
  );
}