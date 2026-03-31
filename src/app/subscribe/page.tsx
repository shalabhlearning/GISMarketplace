// src/app/subscribe/page.tsx
"use client";

import React from 'react';
import PricingCard from '@/components/subscription/PricingCard';
import ComparisonTable from '@/components/subscription/ComparisonTable';

const PLANS = [
  {
    name: "Starter",
    price: "29",
    description: "Ideal for new service providers getting started with essential tools.",
    credits: "50 Monthly Credits",
    features: ["Access to basic job listings", "Up to 5 quote submissions/month", "Email support", "Basic reporting dashboard"],
  },
  {
    name: "Professional",
    price: "99",
    description: "Grow your business with enhanced tools, more credits, and priority support.",
    credits: "200 Monthly Credits",
    features: ["Unlimited job listings", "Unlimited quote submissions", "Priority email support", "Advanced reporting & insights", "Client management tools"],
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "249",
    description: "Comprehensive solution for large service organizations requiring scale.",
    credits: "500 Monthly Credits",
    features: ["All Professional features", "Dedicated account manager", "Custom integrations & API access", "On-demand training", "24/7 Phone & chat support"],
  },
];

export default function SubscribePage() {
  const handleSelectPlan = (plan: string) => {
    console.log(`Plan selected: ${plan}`);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Unlock the full potential of ServiceConnect Pro. Select a plan that best fits your business needs and start managing your workflow efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.name}
              {...plan}
              onSelect={() => handleSelectPlan(plan.name)}
            />
          ))}
        </div>

        <ComparisonTable />

        <div className="text-center mt-12 p-8 border-t border-gray-100">
          <p className="text-gray-500">
            Need a custom plan for your organization? <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Contact our sales team</span>
          </p>
        </div>
      </div>
    </div>
  );
}