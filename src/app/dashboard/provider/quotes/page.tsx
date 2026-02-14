// src/app/dashboard/provider/quotes/page.tsx (Submitted Quotes Page - Provider View)
import db from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { notFound } from 'next/navigation';

async function getCurrentProviderId(sessionToken: string | undefined) {
  if (!sessionToken) return null;

  const rows: any[] = await db.query(
    `SELECT s.user_id 
     FROM sessions s 
     JOIN user u ON s.user_id = u.user_id 
     WHERE s.session_token = ? AND s.expires > NOW() AND u.user_type = 'provider'`,
    [sessionToken]
  );

  return rows.length > 0 ? rows[0].user_id : null;
}

async function getSubmittedQuotes(providerId: string) {
  const quotes = await db.query(`
    SELECT 
      p.proposal_id,
      p.project_id,
      p.bid_amount,
      p.proposal_message,
      p.created_at AS submitted_at,
      pr.title AS project_title,
      pr.description AS project_description,
      bp.organization_name AS buyer_name
    FROM proposal p
    JOIN projectrequest pr ON p.project_id = pr.project_id
    LEFT JOIN buyerprofile bp ON pr.buyer_id = bp.buyer_id
    WHERE p.provider_id = ?
    ORDER BY p.created_at DESC
  `, [providerId]);

  return quotes;
}

export default async function SubmittedQuotesPage({ searchParams }: { searchParams: { search?: string } }) {
  // Get session token from cookies (server-side)
  const sessionToken = (await import('next/headers')).cookies().get('session_token')?.value;

  const providerId = await getCurrentProviderId(sessionToken);

  if (!providerId) {
    notFound(); // or redirect to login
  }

  let quotes = await getSubmittedQuotes(providerId);

  // Simple search filter (client name or project title)
  const search = searchParams.search || '';
  if (search) {
    const lowerSearch = search.toLowerCase();
    quotes = quotes.filter((q: any) => 
      q.project_title?.toLowerCase().includes(lowerSearch) ||
      q.buyer_name?.toLowerCase().includes(lowerSearch)
    );
  }

  return (
    <DashboardShell title="Submitted Quotes">
      <div className="space-y-6">
        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Submitted Quotes</h1>
          <div className="w-full sm:w-96">
            <input
              type="text"
              placeholder="Search quotes by job title or client..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-900"
              defaultValue={search}
              onChange={(e) => {
                const value = e.target.value;
                const url = new URL(window.location.href);
                if (value) {
                  url.searchParams.set('search', value);
                } else {
                  url.searchParams.delete('search');
                }
                window.location.href = url.toString();
              }}
            />
          </div>
        </div>

        {/* Quotes List */}
        {quotes.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No submitted quotes found.
          </div>
        ) : (
          <div className="space-y-6">
            {quotes.map((quote: any) => {
              let details = {};
              try {
                // Extract JSON part from proposal_message (it has JSON + attachments)
                const jsonStart = quote.proposal_message.indexOf('{');
                const jsonEnd = quote.proposal_message.lastIndexOf('}') + 1;
                const jsonStr = quote.proposal_message.substring(jsonStart, jsonEnd);
                details = JSON.parse(jsonStr);
              } catch (e) {
                console.error('Parse proposal details error:', e);
              }

              return (
                <div key={quote.proposal_id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{quote.project_title || 'Untitled Project'}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Client: {quote.buyer_name || 'Unknown'} | 
                          Submitted: {new Date(quote.submitted_at).toLocaleDateString()} | 
                          Amount: ${Number(quote.bid_amount).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Expandable Quote Details */}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium mb-2">
                        Quote Details
                      </summary>
                      <div className="mt-3 pl-4 border-l-4 border-gray-200 space-y-4 text-gray-900">
                        <div>
                          <p className="font-medium">Technical Proposal</p>
                          <p className="mt-1 whitespace-pre-wrap">{(details as any).technical || 'No technical details'}</p>
                        </div>
                        <div>
                          <p className="font-medium">Delivery Plan</p>
                          <p className="mt-1 whitespace-pre-wrap">{(details as any).delivery || 'No delivery plan'}</p>
                        </div>
                        {(details as any).milestones?.length > 0 && (
                          <div>
                            <p className="font-medium">Milestones</p>
                            <ul className="list-disc pl-5 mt-1">
                              {(details as any).milestones.map((m: any, i: number) => (
                                <li key={i}>
                                  {m.title} - ${m.amount} - Due: {m.dueDate}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Add more fields as needed */}
                      </div>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}