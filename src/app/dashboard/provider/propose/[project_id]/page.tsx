// src/app/dashboard/provider/propose/[project_id]/page.tsx (Fixed for Next.js 15+ async params)
import db from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SubmitQuoteForm from '@/components/dashboard/SubmitQuoteForm';
import { notFound } from 'next/navigation';

async function getRfp(project_id: string) {
  const rows = await db.query(`
    SELECT 
      pr.*,
      bp.organization_name AS buyer_name
    FROM projectrequest pr
    LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
    WHERE pr.project_id = ?
  `, [project_id]);

  return rows[0] || null;
}

export default async function ProposePage({ params }: { params: Promise<{ project_id: string }> }) {
  // Await the params Promise (required in Next.js 15+ for dynamic routes)
  const { project_id } = await params;

  const rfp = await getRfp(project_id);

  if (!rfp) {
    notFound(); // Clean Next.js 404
  }

  return (
    <DashboardShell title="Submit Quote">
      <SubmitQuoteForm rfp={rfp} />
    </DashboardShell>
  );
}