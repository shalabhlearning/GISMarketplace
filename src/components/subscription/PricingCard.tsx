"use client";

import React from "react";
import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  credits: string;
  features: string[];
  onSelect: () => void;
}

export default function PricingCard({
  name,
  price,
  description,
  credits,
  features,
  onSelect,
}: PricingCardProps) {
  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
      
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
        <p className="text-gray-500 text-sm mt-2 leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex items-end gap-1">
          <span className="text-5xl font-extrabold text-gray-900">
            ${price}
          </span>
          <span className="text-gray-500 text-base mb-1">/month</span>
        </div>
      </div>

      {/* Credits */}
      <div className="bg-blue-50 text-blue-600 font-semibold py-3 rounded-lg text-center mb-8">
        {credits}
      </div>

      {/* Features */}
      <ul className="space-y-4 mb-10 flex-1">
        {features.map((feature, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-gray-600 text-sm"
          >
            <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onSelect}
        className="w-full bg-blue-500 hover:bg-blue-600 text-black py-3 rounded-lg font-semibold transition active:scale-[0.98]"
      >
        Select Plan
      </button>
    </div>
  );
}
