'use client';

import { useState } from 'react';
import Link from 'next/link';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { Button } from './ui/button';

export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <>
      <header className="sticky top-4 z-50 w-full px-6">
        <div className="max-w-[1440px] mx-auto">
          {/* Rounded Pill Navbar - Always Visible */}
          <div className="bg-card rounded-full px-8 py-3 flex items-center justify-between shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md">
            
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-3xl font-bold tracking-tighter text-foreground">
                GISMarketplace
              </span>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="text-xl font-medium text-foreground hover:text-foreground px-4 py-2 rounded-full transition-all duration-200 hover:bg-muted active:scale-95"
              >
                Log in
              </button>
              
              <Button
                size="sm"
                onClick={() => setIsRegisterOpen(true)}
                className="bg-foreground text-lg text-background hover:bg-foreground/90 hover:scale-105 active:scale-95 rounded-full px-4 py-5 transition-all duration-200 font-medium shadow-sm hover:shadow"
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </>
  );
} 