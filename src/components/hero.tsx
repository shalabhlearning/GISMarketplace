'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle } from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

export function Hero() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden pt-8 pb-24 md:pt-12 md:pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-card border border-border/50 rounded-full px-4 py-1.5 text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                Available Now: Premium GIS Leads for Service Pros
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.1] text-balance">
                Scale your GIS business with precision.
              </h1>

              <p className="text-base text-muted-foreground max-w-md leading-relaxed">
                Access premium GIS leads, manage bids with smart credits, and
                streamline your deliverables—all from one powerful dashboard
                designed for top-tier professionals.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => setIsRegisterOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-12"
                >
                  Start Registration
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsLoginOpen(true)}
                  className="border-border bg-card text-foreground hover:bg-muted rounded-full px-8 h-12"
                >
                  Log in to Dashboard
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  Secure Payments via Stripe
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  Verified Buyer Network
                </div>
              </div>
            </div>

            {/* Right content */}
            <div className="relative">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

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