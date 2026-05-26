'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SubmitQuoteForm from '@/components/provider/SubmitQuoteForm';

export default function ProposePage() {
  const params     = useParams();
  const project_id = params.project_id as string;

  const [rfp,     setRfp]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!project_id) return;
    setLoading(true);
    setError(null);

    fetch(`/api/rfp/${project_id}`, { credentials: 'include' })
      .then(async r => {
        if (!r.ok) {
          throw new Error(r.status === 404 ? 'RFP not found or no longer available.' : `Error loading project (${r.status})`);
        }
        const data = await r.json();
        setRfp(data.rfp || data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [project_id]);

  if (loading) {
    return (
      <DashboardShell title="Submit Quote">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  if (error || !rfp) {
    return (
      <DashboardShell title="Submit Quote">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <p className="text-red-500 font-medium text-sm">
            {error || 'Project not found or inaccessible'}
          </p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={rfp.title || 'Submit Quote'}>
      <SubmitQuoteForm rfp={rfp} />
    </DashboardShell>
  );
}