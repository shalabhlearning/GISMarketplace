// src/app/buyer/quote/page.tsx
'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import QuoteTable from '@/components/buyer/QuoteTable';

export default function BuyerQuotePage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        const res = await fetch('/api/buyer/quotes', {
          credentials: 'include',
        });

        if (!res.ok) {
          console.error('Quotes API returned error:', res.status);
          setQuotes([]);
          return;
        }

        const data = await res.json();
        setQuotes(data.quotes || []);
      } catch (err) {
        console.error('Failed to load buyer quotes:', err);
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchQuotes();
  }, []);

  if (loading) {
    return (
      <DashboardShell title="Received Quotes">
        <div className="text-center py-12">Loading your quotes...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Received Quotes">
      <QuoteTable quotes={quotes} />
    </DashboardShell>
  );
}