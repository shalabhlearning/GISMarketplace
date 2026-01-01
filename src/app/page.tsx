// src/app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import RegisterModal from "@/components/RegisterModal";
import LoginModal from "@/components/LoginModal"; // Import new modal

export default function Home() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const closeModals = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(false);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gradient-to-r from-sky-400 to-teal-400 text-white">
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="mb-10">
            <div className="w-14 h-14 rounded-full bg-white mx-auto" />
          </div>

          <h1 className="text-5xl font-semibold tracking-tight mb-2">
            Unlock Your Potential.
          </h1>

          <h2 className="text-4xl font-semibold tracking-tight mb-6">
            Create. Connect. Inspire.
          </h2>

          <p className="max-w-2xl text-base md:text-lg text-white/90 leading-relaxed mb-10">
            Seamlessly integrate into a community designed for growth.
            Start your journey today and transform your ideas into reality.
          </p>

          <div className="flex gap-6">
            <button
              onClick={openLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg text-lg transition"
            >
              Login
            </button>

            <button
              onClick={openRegister}
              className="bg-white hover:bg-gray-100 text-blue-600 font-medium py-3 px-8 rounded-lg text-lg transition"
            >
              Register
            </button>
          </div>
        </main>

        <footer className="bg-white py-4">
          <div className="text-center text-sm text-gray-500 space-x-6">
            <Link href="/learn-more" className="hover:text-gray-800">
              Learn More
            </Link>
            <Link href="/support" className="hover:text-gray-800">
              Contact Support
            </Link>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={closeModals}
        onSwitchToLogin={openLogin}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={closeModals}
        onSwitchToRegister={openRegister}
      />
    </>
  );
}