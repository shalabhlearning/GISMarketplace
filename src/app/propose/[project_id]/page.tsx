'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SubmitQuoteForm from '@/components/provider/SubmitQuoteForm';

export default function ProposePage() {
  const params = useParams();
  const project_id = params.project_id as string;

  const [rfp, setRfp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!project_id) return;

    async function loadRfp() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/rfp/${project_id}`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          // FIXED: Extract the actual rfp object
          setRfp(data.rfp || data);
        } else {
          if (res.status === 404) {
            setError('RFP not found or no longer available.');
          } else {
            setError(`Error loading project (${res.status})`);
          }
        }
      } catch (err) {
        console.error('Fetch failed:', err);
        setError('Network error – please try again');
      } finally {
        setLoading(false);
      }
    }

    loadRfp();
  }, [project_id]);

  if (loading) {
    return (
      <DashboardShell title="Submit Quote">
        <div className="text-center py-20 text-lg text-gray-600 animate-pulse">
          Loading project details...
        </div>
      </DashboardShell>
    );
  }

  if (error || !rfp) {
    return (
      <DashboardShell title="Submit Quote">
        <div className="text-center py-20 text-lg text-red-600 font-medium">
          {error || 'Project not found or inaccessible'}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={rfp.title || "Submit Quote"}>
      <SubmitQuoteForm rfp={rfp} />
    </DashboardShell>
  );
}