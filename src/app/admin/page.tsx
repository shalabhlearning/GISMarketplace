// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCards from '@/components/admin/StatsCards';
import RfpTable from '@/components/admin/RfpTable';
import ReviewPanel from '@/components/admin/ReviewPanel';

export default function AdminPage() {
  const [selectedRfp, setSelectedRfp] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.user_type !== 'admin') {
          window.location.href = '/';
        } else {
          setAuthorized(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (projectId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/rfp/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to update');
      setSelectedRfp(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update RFP status');
    }
  };

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        Checking admin access...
      </div>
    );
  }

  return (
    <AdminLayout title="RFP Review Queue">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StatsCards />
        <RfpTable onSelect={setSelectedRfp} />

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