// src/app/api/admin/rfp/[project_id]/checklist/route.ts
//
// GET  → Guarantees live provider matching on every call for open RFPs.
//        Handles three scenarios robustly:
//          1. RFP has ai_skills → re-match immediately (normal path)
//          2. RFP has no ai_skills but has attachments → trigger AI extraction
//             first, then re-match (recovery path for RFPs approved before
//             AI analysis completed)
//          3. RFP has no ai_skills and no attachments → match using
//             description-derived keywords as a fallback
//        Checklisted providers are frozen at the SQL layer (matchProviders.ts)
//        and can never be rescored, reordered, or re-emailed.
//
// POST → Checklists NEW providers only, emails ONLY the newly-checklisted ones.
//

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { matchProvidersForRfp } from '@/lib/matchProviders';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


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
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}


// ─── Email template ───────────────────────────────────────────────────────────
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

  const metaParts: string[] = [];
  if (rfp.budget) metaParts.push(`Budget ₹${Number(rfp.budget).toLocaleString('en-IN')}`);
  if (rfp.start_date) metaParts.push(`Starts ${new Date(rfp.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
  if (rfp.submission_deadline) metaParts.push(`Deadline ${new Date(rfp.submission_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://gismarketplace.in';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New RFP Opportunity — ${rfp.title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#4f46e5 100%);padding:24px 36px;">
            <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:2px;text-transform:uppercase;">GIS Marketplace · New Opportunity</p>
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;line-height:1.35;">${rfp.title}</h1>
            ${metaParts.length > 0 ? `<p style="margin:8px 0 0;color:rgba(255,255,255,0.88);font-size:12.5px;">${metaParts.join('&nbsp;&nbsp;·&nbsp;&nbsp;')}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 36px 0;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6366f1;letter-spacing:0.5px;text-transform:uppercase;">Project Overview</p>
            <p style="margin:0;color:#4b5563;font-size:14.5px;line-height:1.65;">${overview}</p>
          </td>
        </tr>
        ${skills.length > 0 ? `
        <tr>
          <td style="padding:18px 36px 0;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6366f1;letter-spacing:0.5px;text-transform:uppercase;">Skills Required</p>
            <div>${skills.map(s => `<span style="display:inline-block;background:#ede9fe;color:#6d28d9;font-size:11.5px;font-weight:600;padding:4px 11px;border-radius:20px;margin:0 5px 5px 0;">${s}</span>`).join('')}</div>
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:26px 36px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;">
              <tr>
                <td style="padding:18px 22px;">
                  <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0c4a6e;">You've been matched to this RFP</p>
                  <p style="margin:0 0 14px;font-size:13px;color:#0369a1;line-height:1.5;">It's now live in your provider dashboard — log in to view full details and submit your quote.</p>
                  <a href="${baseUrl}/provider" style="display:inline-block;background:#1d4ed8;color:#ffffff;font-size:13.5px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">View RFP in Dashboard →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11.5px;color:#94a3b8;text-align:center;">
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


// ─── Attempt to trigger AI skill extraction for an RFP that has none ─────────
// This is the recovery path: an RFP was approved before AI analysis finished,
// so ai_skills is null. We hit the same ai-analyze endpoint the ReviewPanel
// uses, which writes ai_skills back to the DB. After that, matchProvidersForRfp
// can run with real data.
//
// We do this inline (awaited, not fire-and-forget) so that the GET response
// always returns the most complete data possible. Timeout is 25 s — enough for
// most PDFs, short enough not to hang Vercel's 30 s function limit.
async function tryExtractSkills(project_id: string): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://gismarketplace.in';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const res = await fetch(`${baseUrl}/api/rfp/${project_id}/ai-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[CHECKLIST GET] ai-analyze returned ${res.status} for ${project_id}: ${body}`);
      return false;
    }

    console.log(`✅ [CHECKLIST GET] AI skill extraction succeeded for ${project_id}`);
    return true;
  } catch (err: any) {
    // AbortError = timeout; log but don't crash — fall through to keyword fallback
    console.warn(`[CHECKLIST GET] ai-analyze failed for ${project_id}: ${err.message}`);
    return false;
  }
}


// ─── Keyword fallback: synthesise ai_skills from the RFP title + description ─
// Used when: the RFP has no attachments OR ai-analyze timed out / failed.
// We write the synthesised skills back to the DB so future calls skip this
// path entirely. The skills are coarse but better than nothing — at minimum
// they let geography/GIS-focused providers match.
const GIS_KEYWORD_MAP: Record<string, string[]> = {
  'GIS': ['GIS', 'Geospatial Analysis'],
  'mapping': ['GIS', 'Cartography'],
  'remote sensing': ['Remote Sensing', 'Satellite Imagery'],
  'LiDAR': ['LiDAR', 'Point Cloud Processing'],
  'drone': ['UAV Survey', 'Drone Mapping'],
  'survey': ['Land Survey', 'Topographic Survey'],
  'cadastral': ['Cadastral Mapping', 'Land Records'],
  'urban planning': ['Urban Planning', 'Smart City'],
  'smart city': ['Smart City', 'IoT Integration'],
  'utility': ['Utility Mapping', 'Infrastructure GIS'],
  'infrastructure': ['Infrastructure GIS', 'Asset Management'],
  'flood': ['Flood Modeling', 'Hydrological Analysis'],
  'environment': ['Environmental Mapping', 'EIA'],
  'forest': ['Forest Cover Analysis', 'LULC'],
  'land use': ['Land Use Analysis', 'LULC Mapping'],
  'satellite': ['Satellite Imagery', 'Image Processing'],
  'GPS': ['GPS Survey', 'GNSS'],
  'DGPS': ['DGPS Survey', 'GPS Survey'],
  'web GIS': ['Web GIS Development', 'GIS Portal'],
  'database': ['Spatial Database', 'PostGIS'],
  'mobile': ['Mobile GIS', 'Field Data Collection'],
  'photogrammetry': ['Photogrammetry', 'Aerial Survey'],
  'geospatial': ['Geospatial Analysis', 'Spatial Data Management'],
  'topology': ['Topology Editing', 'GIS Quality Control'],
  'open street': ['OpenStreetMap', 'Web GIS'],
  'qgis': ['QGIS', 'Open Source GIS'],
  'arcgis': ['ArcGIS', 'Esri'],
  'vegetation': ['Vegetation Mapping', 'NDVI Analysis'],
  'water': ['Water Resource Mapping', 'Hydrological GIS'],
  'road': ['Road Network GIS', 'Transportation GIS'],
  'pipeline': ['Pipeline GIS', 'Utility Mapping'],
  'power': ['Power Grid Mapping', 'Utility GIS'],
  'telecom': ['Telecom GIS', 'Network Planning'],
  'agriculture': ['Agricultural GIS', 'Crop Monitoring'],
  'disaster': ['Disaster Management GIS', 'Risk Mapping'],
  'heritage': ['Cultural Heritage GIS', 'Archaeological Survey'],
  'municipal': ['Municipal GIS', 'Town Planning'],
  'revenue': ['Revenue Survey', 'Cadastral Mapping'],
  'boundary': ['Boundary Demarcation', 'Survey'],
  'contour': ['Contour Mapping', 'DTM/DEM'],
  'DEM': ['DEM/DTM', 'Terrain Analysis'],
  'DTM': ['DTM/DEM', 'Terrain Analysis'],
  'elevation': ['Elevation Model', 'DEM/DTM'],
  '3D': ['3D Modeling', '3D GIS'],
  'BIM': ['BIM Integration', 'Digital Twin'],
  'planning': ['Urban Planning', 'GIS Analysis'],
  'portal': ['Web GIS Development', 'GIS Portal'],
  'dashboard': ['GIS Dashboard', 'Web GIS'],
  'integration': ['GIS Integration', 'Spatial Data Management'],
  'automation': ['GIS Automation', 'Python GIS'],
  'python': ['Python GIS', 'GeoPandas'],
  'API': ['GIS API', 'Spatial Web Services'],
  'training': ['GIS Training', 'Capacity Building'],
  'data collection': ['Field Data Collection', 'Mobile GIS'],
  'digitization': ['Map Digitization', 'GIS Data Entry'],
  'georeferencing': ['Georeferencing', 'Map Registration'],
  'classification': ['Image Classification', 'Remote Sensing'],
};

async function synthesiseAndSaveSkills(project_id: string, title: string, description: string): Promise<boolean> {
  try {
    const text = `${title} ${description}`.toLowerCase();
    const skillSet = new Set<string>();

    for (const [keyword, skills] of Object.entries(GIS_KEYWORD_MAP)) {
      if (text.includes(keyword.toLowerCase())) {
        skills.forEach(s => skillSet.add(s));
      }
    }

    // Always include generic GIS as a baseline so at least some match runs
    skillSet.add('GIS');
    skillSet.add('Geospatial Analysis');

    const skillsArray = [...skillSet];
    const aiSkillsPayload = {
      required_services: skillsArray.slice(0, Math.ceil(skillsArray.length / 2)),
      required_skills: skillsArray.slice(Math.ceil(skillsArray.length / 2)),
    };

    await query(
      `UPDATE projectrequest
       SET ai_skills = $1
       WHERE project_id = $2 AND ai_skills IS NULL`,
      [JSON.stringify(aiSkillsPayload), project_id]
    );

    console.log(`🔑 [CHECKLIST GET] Keyword-synthesised ${skillsArray.length} skills for RFP ${project_id}: ${skillsArray.slice(0, 5).join(', ')}…`);
    return true;
  } catch (err: any) {
    console.error('[synthesiseAndSaveSkills ERROR]', err.message);
    return false;
  }
}


// ─── Fetch providers from DB after matching ───────────────────────────────────
async function fetchMatchedProviders(project_id: string) {
  return query(
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
     JOIN "user"          u  ON pp.provider_id  = u.user_id
     WHERE rpm.project_id = $1
     ORDER BY rpm.is_checklist DESC, rpm.match_score DESC`,
    [project_id]
  );
}


// ─── GET: guaranteed live re-match for every open RFP ─────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id } = await params;

    // ── Fetch full RFP row (need title/description for fallback too) ─────────
    const [rfp] = await query(
      `SELECT project_id, status, ai_skills, title, description, attachments
       FROM projectrequest
       WHERE project_id = $1`,
      [project_id]
    );

    if (!rfp) {
      return NextResponse.json({ success: false, providers: [], error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.status !== 'open') {
      // Non-open RFPs: just return whatever matched rows exist, skip re-matching
      const providers = await fetchMatchedProviders(project_id);
      return NextResponse.json({ success: true, providers: providers ?? [], match_status: 'skipped_not_open' });
    }

    // ── From here: RFP is open → we MUST run a live re-match ────────────────
    let skillSource: 'existing' | 'ai_extracted' | 'keyword_synthesised' | 'none' = 'none';
    const t0 = Date.now();

    // Step 1: Does the RFP already have ai_skills in the DB?
    let hasSkills = !!rfp.ai_skills;

    // Step 2: If not, try AI extraction (recovery path for 0-match RFPs) ─────
    if (!hasSkills) {
      const attachments: string[] = (() => {
        try {
          const raw = typeof rfp.attachments === 'string'
            ? JSON.parse(rfp.attachments)
            : rfp.attachments;
          return Array.isArray(raw) ? raw : [];
        } catch { return []; }
      })();

      const hasPdfs = attachments.some(
        (a: string) => typeof a === 'string' && a.toLowerCase().endsWith('.pdf')
      );

      if (hasPdfs) {
        console.log(`🔄 [CHECKLIST GET] RFP ${project_id} has no ai_skills — triggering AI extraction`);
        const extracted = await tryExtractSkills(project_id);
        if (extracted) {
          skillSource = 'ai_extracted';
          hasSkills = true; // ai-analyze wrote skills to DB; matchProvidersForRfp will re-read
        }
      }

      // Step 3: Still no skills? Synthesise from title + description ──────────
      if (!hasSkills) {
        console.log(`🔄 [CHECKLIST GET] Falling back to keyword synthesis for RFP ${project_id}`);
        const synthesised = await synthesiseAndSaveSkills(
          project_id,
          rfp.title ?? '',
          rfp.description ?? ''
        );
        if (synthesised) {
          skillSource = 'keyword_synthesised';
          hasSkills = true;
        }
      }
    } else {
      skillSource = 'existing';
    }

    // Step 4: Run live re-match against the FULL current provider database ────
    // This always runs for open RFPs — regardless of whether matches already
    // exist — so new providers registered after RFP approval are never missed.
    let matchResult: Awaited<ReturnType<typeof matchProvidersForRfp>> = {
      success: false,
      total_matches: 0,
      error: 'No skills available'
    };

    if (hasSkills) {
      matchResult = await matchProvidersForRfp(project_id);
      const ms = Date.now() - t0;

      if (matchResult.success) {
        console.log(
          `✅ [CHECKLIST GET] live re-match for ${project_id}: ` +
          `${matchResult.total_matches} matches in ${ms}ms (skills source: ${skillSource})`
        );
      } else {
        // Non-fatal: log and fall through — admin still sees existing rows
        console.warn(
          `⚠️ [CHECKLIST GET] re-match returned an error for ${project_id}: ${matchResult.error}`
        );
      }
    } else {
      console.warn(
        `⚠️ [CHECKLIST GET] RFP ${project_id} has no skills even after extraction + synthesis — ` +
        `returning existing matched rows only.`
      );
    }

    // Step 5: Return matched providers (includes any that existed before) ─────
    const providers = await fetchMatchedProviders(project_id);

    return NextResponse.json({
      success: true,
      providers: providers ?? [],
      match_status: matchResult.success ? 'refreshed' : 'partial',
      total_matches: matchResult.total_matches,
      skill_source: skillSource,
      // Let the UI know when matching ran without skills — so it can show
      // a more specific warning than "0 providers found".
      skills_missing: !hasSkills,
    });

  } catch (err: any) {
    console.error('[CHECKLIST GET ERROR]', err);
    return NextResponse.json({ success: false, error: err.message, providers: [] }, { status: 500 });
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

    const placeholders = provider_ids.map((_, i) => `$${i + 2}`).join(',');
    const existingRows = await query(
      `SELECT provider_id, is_checklist, notified
       FROM rfp_provider_match
       WHERE project_id = $1 AND provider_id IN (${placeholders})`,
      [project_id, ...provider_ids]
    );
    const existingMap = new Map(existingRows.map((r: any) => [r.provider_id, r]));

    // Only process providers not yet checklisted
    const toAdd = provider_ids.filter(id => {
      const row = existingMap.get(id);
      return !row || row.is_checklist === false;
    });

    // Only email providers not yet notified
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

    // Bulk UPDATE is safer than individual updates — single round-trip, atomic
    const addPlaceholders = toAdd.map((_, i) => `$${i + 2}`).join(',');
    await query(
      `UPDATE rfp_provider_match
       SET is_checklist = TRUE, checklist_added_at = NOW()
       WHERE project_id = $1
         AND provider_id IN (${addPlaceholders})
         AND is_checklist = FALSE`,
      [project_id, ...toAdd]  // $1 = project_id, $3.. = provider ids
    );

    let emailed = 0;
    const emailErrors: string[] = [];

    if (toEmail.length > 0) {
      const emailPlaceholders = toEmail.map((_, i) => `$${i + 1}`).join(',');
      const emailRows = await query(
        `SELECT pp.provider_id, pp.organization_name, u.email
         FROM providerprofile pp
         JOIN "user" u ON pp.provider_id = u.user_id
         WHERE pp.provider_id IN (${emailPlaceholders})
           AND u.email IS NOT NULL`,
        toEmail
      );

      const transport = createTransport();
      const html = buildEmailHtml(rfp, analysis);

      // Mark all as notified in one UPDATE, then send emails — this way a
      // transient SMTP failure doesn't leave the row in an inconsistent state
      // where the admin retries and double-emails the provider.
      const notifyPlaceholders = emailRows.map((_: any, i: number) => `$${i + 2}`).join(',');
      if (emailRows.length > 0) {
        await query(
          `UPDATE rfp_provider_match
           SET notified = TRUE, notified_at = NOW()
           WHERE project_id = $1
             AND provider_id IN (${notifyPlaceholders})`,
          [project_id, ...emailRows.map((r: any) => r.provider_id)]
        );
      }

      for (const provider of emailRows) {
        try {
          await transport.sendMail({
            from: `"GIS Marketplace" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
            to: provider.email,
            subject: `New RFP Opportunity: ${rfp.title}`,
            html,
          });
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