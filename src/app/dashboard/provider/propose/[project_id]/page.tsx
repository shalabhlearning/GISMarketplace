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
  const { project_id } = await params;

  const rfp = await getRfp(project_id);

  if (!rfp) notFound();

  return (
    <DashboardShell title="Submit Quote">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Quote Form - 70% width */}
        <div className="w-full md:w-7/12">
          <SubmitQuoteForm rfp={rfp} />
        </div>

        {/* RFP Preview Sidebar - 30% width */}
        <div className="w-full md:w-5/12 bg-white rounded-2xl shadow-lg p-6 sticky top-8 h-fit">
          <h3 className="text-xl font-bold mb-6 text-gray-900">RFP Preview</h3>
          
          <div className="space-y-5 text-gray-900">
            <div>
              <div className="text-sm text-gray-600">Title</div>
              <div className="font-medium">{rfp.title || 'Untitled'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Client</div>
              <div className="font-medium">{rfp.buyer_name || 'Unknown'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Budget</div>
              <div className="font-medium">
                {rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : 'Negotiable'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Submission Deadline</div>
              <div className="font-medium">{new Date(rfp.submission_deadline).toLocaleDateString()}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Description</div>
              <div className="text-sm leading-relaxed mt-1">
                {rfp.description?.substring(0, 300) || 'No description provided.'}
                {rfp.description?.length > 300 && '...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}