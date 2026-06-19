// src/app/api/admin/rfp/[project_id]/checklist/route.ts
//
// GET  → returns all matched providers for this RFP with checklist + notified state
// POST → checklists NEW providers only, and emails ONLY the newly-checklisted ones.
//        Already-checklisted providers are never re-emailed and can never be
//        un-checklisted (enforced here, not just in the UI).
//
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import nodemailer from 'nodemailer';

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('session_token')?.value;
  if (!token) return null;
  const [session] = await query(
    `SELECT u.user_id, u.user_type
     FROM sessions s
     JOIN "user" u ON s.user_id = u.user_id
     WHERE s.session_token = $1 AND s.expires > NOW()`,
    [token]
  );
  return session?.user_type === 'admin' ? session : null;
}

// ─── Nodemailer transport ─────────────────────────────────────────────────────
function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ─── Dynamic email template ───────────────────────────────────────────────────
function buildEmailHtml(rfp: any, analysis: any) {
  const overview =
    analysis?.project_overview ??
    rfp.description ??
    'Please log in to view the full project details.';

  const skills: string[] = (() => {
    try {
      const s = typeof rfp.ai_skills === 'string' ? JSON.parse(rfp.ai_skills) : rfp.ai_skills;
      return [...(s?.required_services ?? []), ...(s?.required_skills ?? [])].slice(0, 6);
    } catch { return []; }
  })();

  const timeline = (() => {
    const parts: string[] = [];
    if (rfp.start_date) {
      parts.push(`Starts ${new Date(rfp.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
    }
    if (rfp.submission_deadline) {
      parts.push(`Deadline ${new Date(rfp.submission_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
    }
    return parts.join(' · ') || null;
  })();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://gismarketplace.in';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New RFP Opportunity — ${rfp.title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#4f46e5 100%);padding:36px 40px;">
            <p style="margin:0 0 6px;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:2px;text-transform:uppercase;">GIS Marketplace</p>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">New RFP Opportunity Found For You</h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">You have been matched to a new project request.</p>
          </td>
        </tr>

        <!-- Project Title Card -->
        <tr>
          <td style="padding:32px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1.5px solid #e0e7ff;border-radius:12px;padding:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;color:#6366f1;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Project Title</p>
                  <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:700;">${rfp.title}</h2>
                  ${rfp.budget ? `<p style="margin:0;display:inline-block;background:#dcfce7;color:#15803d;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;">Budget: ₹${Number(rfp.budget).toLocaleString('en-IN')}</p>` : ''}
                  ${timeline ? `<p style="margin:8px 0 0;color:#64748b;font-size:13px;">📅 ${timeline}</p>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Project Overview -->
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#374151;letter-spacing:0.5px;text-transform:uppercase;">Project Overview</p>
            <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.7;">${overview}</p>
          </td>
        </tr>

        ${skills.length > 0 ? `
        <!-- Skills Required -->
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;letter-spacing:0.5px;text-transform:uppercase;">Skills Required</p>
            <div>
              ${skills.map(s => `<span style="display:inline-block;background:#ede9fe;color:#6d28d9;font-size:12px;font-weight:600;padding:5px 12px;border-radius:20px;margin:0 6px 6px 0;">${s}</span>`).join('')}
            </div>
          </td>
        </tr>` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border:1.5px solid #bae6fd;border-radius:12px;padding:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#0c4a6e;">You have been selected for this opportunity</p>
                  <p style="margin:0 0 18px;font-size:14px;color:#0369a1;">This RFP is now visible in your GIS Marketplace provider dashboard. Log in to view full details and submit your quote.</p>
                  <a href="${baseUrl}/provider"
                     style="display:inline-block;background:#1d4ed8;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">
                    View RFP in Dashboard →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              You received this because your skills match this project's requirements.<br/>
              GIS Marketplace · <a href="${baseUrl}" style="color:#6366f1;text-decoration:none;">gismarketplace.in</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── GET: matched providers + checklist state ─────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id } = await params;

    const providers = await query(
      `SELECT
         rpm.provider_id,
         rpm.match_score,
         rpm.reason,
         rpm.is_checklist,
         rpm.checklist_added_at,
         rpm.notified,
         rpm.notified_at,
         pp.organization_name,
         u.email
       FROM rfp_provider_match rpm
       JOIN providerprofile pp ON rpm.provider_id = pp.provider_id
       JOIN "user" u ON pp.provider_id = u.user_id
       WHERE rpm.project_id = $1
       ORDER BY rpm.is_checklist DESC, rpm.match_score DESC`,
      [project_id]
    );

    return NextResponse.json({ success: true, providers: providers ?? [] });
  } catch (err: any) {
    console.error('[CHECKLIST GET ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── POST: checklist + email only NEW selections ──────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id } = await params;
    const body = await req.json();
    const provider_ids: string[] = Array.isArray(body?.provider_ids) ? body.provider_ids : [];

    if (provider_ids.length === 0) {
      return NextResponse.json({ error: 'provider_ids must be a non-empty array' }, { status: 400 });
    }

    const [rfp] = await query(
      `SELECT project_id, title, description, budget, start_date,
              submission_deadline, end_date, ai_summary, ai_skills
       FROM projectrequest WHERE project_id = $1`,
      [project_id]
    );

    if (!rfp) return NextResponse.json({ error: 'RFP not found' }, { status: 404 });

    const analysis = (() => {
      try { return typeof rfp.ai_summary === 'string' ? JSON.parse(rfp.ai_summary) : rfp.ai_summary; }
      catch { return null; }
    })();

    // ── Current state of the selected rows ───────────────────────────────────
    const placeholders = provider_ids.map((_, i) => `$${i + 2}`).join(',');
    const existingRows = await query(
      `SELECT provider_id, is_checklist, notified
       FROM rfp_provider_match
       WHERE project_id = $1 AND provider_id IN (${placeholders})`,
      [project_id, ...provider_ids]
    );
    const existingMap = new Map(existingRows.map((r: any) => [r.provider_id, r]));

    // Rule: only rows NOT currently checklist=true get added now.
    // This guarantees previously-checklisted providers are never touched again.
    const toAdd = provider_ids.filter(id => {
      const row = existingMap.get(id);
      return !row || row.is_checklist === false;
    });

    // Of those being newly added, only the ones never notified get an email.
    const toEmail = toAdd.filter(id => {
      const row = existingMap.get(id);
      return !row || row.notified === false;
    });

    if (toAdd.length === 0) {
      return NextResponse.json({
        success: true,
        added: 0,
        emailed: 0,
        message: 'All selected providers are already on the checklist — nothing to do.',
      });
    }

    // ── Mark checklist = true ──────────────────────────────────────────────────
    for (const provider_id of toAdd) {
      await query(
        `UPDATE rfp_provider_match
         SET is_checklist = TRUE, checklist_added_at = NOW()
         WHERE project_id = $1 AND provider_id = $2`,
        [project_id, provider_id]
      );
    }

    // ── Email only newly-notified providers ────────────────────────────────────
    let emailed = 0;
    const emailErrors: string[] = [];

    if (toEmail.length > 0) {
      const emailPlaceholders = toEmail.map((_, i) => `$${i + 1}`).join(',');
      const emailRows = await query(
        `SELECT pp.provider_id, pp.organization_name, u.email
         FROM providerprofile pp
         JOIN "user" u ON pp.provider_id = u.user_id
         WHERE pp.provider_id IN (${emailPlaceholders})`,
        toEmail
      );

      const transport = createTransport();
      const html = buildEmailHtml(rfp, analysis);

      for (const provider of emailRows) {
        if (!provider.email) continue;
        try {
          await transport.sendMail({
            from:    `"GIS Marketplace" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
            to:      provider.email,
            subject: `New RFP Opportunity: ${rfp.title}`,
            html,
          });

          await query(
            `UPDATE rfp_provider_match
             SET notified = TRUE, notified_at = NOW()
             WHERE project_id = $1 AND provider_id = $2`,
            [project_id, provider.provider_id]
          );

          emailed++;
          console.log(`✅ Email sent to ${provider.email} for RFP ${project_id}`);
        } catch (mailErr: any) {
          console.error(`❌ Email failed for ${provider.email}:`, mailErr.message);
          emailErrors.push(provider.email);
        }
      }
    }

    return NextResponse.json({
      success: true,
      added: toAdd.length,
      emailed,
      email_errors: emailErrors.length > 0 ? emailErrors : undefined,
      message: `${toAdd.length} provider(s) added to checklist. ${emailed} email(s) sent.`,
    });

  } catch (err: any) {
    console.error('[CHECKLIST POST ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}