// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCards from '@/components/admin/StatsCards';
import RfpTable from '@/components/admin/RfpTable';
import ReviewPanel from '@/components/admin/ReviewPanel';

export default function AdminPage() {
  const [rfps, setRfps] = useState<any[]>([]);
  const [selectedRfp, setSelectedRfp] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRfps = async () => {
    try {
      const res = await fetch('/api/admin/rfp/pending');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRfps(data.rfps || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.user_type !== 'admin') {
          window.location.href = '/';
        } else {
          setAuthorized(true);
          fetchRfps();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Near real-time refresh
  useEffect(() => {
    if (!authorized) return;
    const interval = setInterval(fetchRfps, 15000);
    return () => clearInterval(interval);
  }, [authorized]);

  const handleAction = async (projectId: string, action: string) => {
    try {
      await fetch('/api/admin/rfp/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action }),
        credentials: 'include',
      });
      setSelectedRfp(null);
      fetchRfps();
    } catch (err) {
      console.error(err);
      alert('Failed to update RFP status');
    }
  };

  if (!authorized) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Checking admin access...</div>;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">RFP Review Queue</h1>
            <p className="text-gray-500 mt-1">Admin &gt; RFP Management &gt; Review Queue</p>
          </div>

          <div className="flex gap-3">
            <div className="relative w-96">
              <input
                type="text"
                placeholder="Search submission ID, title, or buyer..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 text-sm"
              />
              <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
            </div>
            <button className="px-6 py-3 border border-gray-200 rounded-2xl hover:bg-gray-50 text-sm font-medium">
              Filters
            </button>
          </div>
        </div>

        <StatsCards rfps={rfps} />

        <RfpTable rfps={rfps} onSelect={setSelectedRfp} />

        {selectedRfp && (
          <ReviewPanel
            rfp={selectedRfp}
            onClose={() => setSelectedRfp(null)}
            onAction={handleAction}
          />
        )}
      </div>
    </AdminLayout>
  );
}