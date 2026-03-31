'use client';

import { Plus } from 'lucide-react';

export default function CreateRfpHero({ hasSubscription }: { hasSubscription: boolean }) {
  const handleCreateClick = () => {
    // You can re-enable subscription check later
    window.location.href = '/buyer/create';
  };

  return (
    <div className="bg-blue-50 rounded-3xl p-5 border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Initiate a New Request for Proposal</h2>
        <p className="text-blue-700/80">
          Effortlessly create and manage your RFPs to find the perfect service providers for your projects.
        </p>
      </div>
      <button
        onClick={handleCreateClick}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200"
      >
        <Plus size={20} />
        Create New RFP
      </button>
    </div>
  );
}