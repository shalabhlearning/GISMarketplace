"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [dashboardPath, setDashboardPath] = useState("/");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const user = data.user;
          if (user) {
            if (user.user_type === "provider") {
              setDashboardPath("/dashboard/provider");
            } else if (user.user_type === "buyer") {
              setDashboardPath("/dashboard/buyer");
            } else {
              setDashboardPath("/");
            }
          } else {
            setDashboardPath("/");
          }
        } else {
          setDashboardPath("/");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setDashboardPath("/");
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50">
      <button
        onClick={() => router.push(dashboardPath)}
        aria-label="Back to dashboard"
        className="absolute top-6 right-6 p-2 rounded-full 
                   text-gray-500 hover:bg-white hover:text-gray-700"
      >
        <X className="w-6 h-6" />
      </button>

      <main className="p-6 md:p-12">
        <div className="text-base leading-normal font-sans">
          {children}
        </div>
      </main>
    </div>
  );
}