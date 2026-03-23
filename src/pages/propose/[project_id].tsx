// src/pages/propose/[project_id].tsx
'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SubmitQuoteForm from '@/components/provider/SubmitQuoteForm';

export default function ProposePage() {
  const router = useRouter();
  const { project_id } = router.query; // ← this is how you get the dynamic param in Pages Router

  const [rfp, setRfp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // router.query can be empty on initial render in some cases → wait for it
    if (!project_id || typeof project_id !== 'string') return;

    async function loadRfp() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/rfp/${project_id}`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setRfp(data);
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
  }, [project_id]); // re-run when project_id becomes available

  // Loading state
  if (loading) {
    return (
      <DashboardShell title="Submit Quote">
        <div className="text-center py-20 text-lg text-gray-600 animate-pulse">
          Loading project details...
        </div>
      </DashboardShell>
    );
  }

  // Error or not found
  if (error || !rfp) {
    return (
      <DashboardShell title="Submit Quote">
        <div className="text-center py-20 text-lg text-red-600 font-medium">
          {error || 'Project not found or inaccessible'}
        </div>
      </DashboardShell>
    );
  }

  // Success → show the form
  return (
    <DashboardShell title="Submit Quote">
      <SubmitQuoteForm rfp={rfp} />
    </DashboardShell>
  );
}