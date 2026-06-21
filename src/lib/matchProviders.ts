// src/lib/matchProviders.ts
import db from '@/lib/db';

// ─────────────────────────────────────────────────────────────
// Core scoring
// ─────────────────────────────────────────────────────────────
function scoreProviderAgainstRfp(
  providerSkills: string[],
  rfpSkills: string[]
): { score: number; matchedSkills: string[] } {
  const providerSkillSet = providerSkills.map(s => String(s).toLowerCase().trim());
  let matchCount = 0;
  const matchedSkills: string[] = [];

  for (const reqSkill of rfpSkills) {
    if (providerSkillSet.some(pSkill =>
      pSkill.includes(reqSkill) || reqSkill.includes(pSkill)
    )) {
      matchCount++;
      matchedSkills.push(reqSkill);
    }
  }

  const score = rfpSkills.length > 0 ? matchCount / rfpSkills.length : 0;
  return { score: Number(score.toFixed(2)), matchedSkills: [...new Set(matchedSkills)] };
}

// ─────────────────────────────────────────────────────────────
// Upsert a single match row — PostgreSQL ON CONFLICT syntax
//
// CRITICAL FREEZE GUARD: the WHERE clause inside DO UPDATE means
// Postgres physically refuses to touch a row once is_checklist = TRUE.
// This is what makes it safe to call this function (via
// matchProvidersForRfp) on EVERY admin page-open without any risk of
// rescoring, reordering, or re-triggering an email for a provider
// who's already been checklisted. The protection lives in the SQL
// itself, not in any caller remembering to check first.
// ─────────────────────────────────────────────────────────────
async function upsertMatch(
  project_id: string,
  provider_id: string,
  score: number,
  matchedSkills: string[]
): Promise<{ isNew: boolean }> {
  const rows = await db.query(
    `INSERT INTO rfp_provider_match (project_id, provider_id, match_score, reason)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (project_id, provider_id) DO UPDATE
       SET match_score = EXCLUDED.match_score,
           reason      = EXCLUDED.reason
       WHERE rfp_provider_match.is_checklist = FALSE
     RETURNING (xmax = 0) AS is_new`,
    [project_id, provider_id, score, JSON.stringify({ matched_skills: matchedSkills })]
  );

  const isNew = rows?.[0]?.is_new === true;
  return { isNew };
}

// ─────────────────────────────────────────────────────────────
// Create an admin notification when a NEW provider match appears
// against an RFP that is already open.
// ─────────────────────────────────────────────────────────────
async function notifyAdminOfNewMatch(
  project_id: string,
  provider_id: string,
  score: number
) {
  try {
    const [rfp] = await db.query(
      `SELECT title FROM projectrequest WHERE project_id = $1`,
      [project_id]
    );
    const [provider] = await db.query(
      `SELECT organization_name FROM providerprofile WHERE provider_id = $1`,
      [provider_id]
    );

    const rfpTitle = rfp?.title ?? 'an RFP';
    const providerName = provider?.organization_name ?? 'A new provider';

    await db.query(
      `INSERT INTO admin_notifications (type, project_id, provider_id, match_score, message)
       VALUES ('new_provider_match', $1, $2, $3, $4)
       ON CONFLICT (project_id, provider_id) DO NOTHING`,
      [
        project_id,
        provider_id,
        score,
        `${providerName} is a new match (${Math.round(score * 100)}%) for "${rfpTitle}".`,
      ]
    );
  } catch (err: any) {
    console.error('[notifyAdminOfNewMatch ERROR]', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function parseSkills(raw: any): string[] {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function parseRfpSkills(raw: any): string[] {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return [
    ...(data.required_services || []),
    ...(data.required_skills   || []),
  ].map((s: string) => String(s).toLowerCase().trim());
}

// ─────────────────────────────────────────────────────────────
// FUNCTION 1: Match an RFP against ALL CURRENT providers
//
// This is the function the checklist GET route calls on every
// admin page-open. It always queries the full providerprofile
// table fresh — there is no caching, no "only check providers
// added since X" logic — so a provider added 5 seconds ago, or
// an RFP that had 0 matches the day it was approved, both get
// fully reconsidered every single time this runs.
// ─────────────────────────────────────────────────────────────
export async function matchProvidersForRfp(project_id: string): Promise<{
  success: boolean;
  total_matches: number;
  error?: string;
}> {
  try {
    const [rfp] = await db.query(
      `SELECT ai_skills FROM projectrequest WHERE project_id = $1`,
      [project_id]
    );

    if (!rfp?.ai_skills) {
      return { success: false, total_matches: 0, error: 'No skills data found on RFP' };
    }

    const rfpSkills = parseRfpSkills(rfp.ai_skills);
    if (!rfpSkills.length) {
      return { success: false, total_matches: 0, error: 'No skills extracted from RFP' };
    }

    const providers = await db.query(
      `SELECT provider_id, skills
       FROM providerprofile
       WHERE skills IS NOT NULL
         AND jsonb_array_length(skills) > 0`
    );

    let totalMatches = 0;
    for (const provider of providers) {
      const providerSkills = parseSkills(provider.skills);
      if (!providerSkills.length) continue;

      const { score, matchedSkills } = scoreProviderAgainstRfp(providerSkills, rfpSkills);
      if (score >= 0.35) {
        await upsertMatch(project_id, provider.provider_id, score, matchedSkills);
        totalMatches++;
      }
    }

    console.log(`✅ [RFP→Providers] ${totalMatches} providers matched for RFP ${project_id} (${providers.length} candidates checked)`);
    return { success: true, total_matches: totalMatches };

  } catch (err: any) {
    console.error('[matchProvidersForRfp ERROR]', err);
    return { success: false, total_matches: 0, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// FUNCTION 2: New provider joins OR updates skills → match against
// ALL open RFPs
// ─────────────────────────────────────────────────────────────
export async function matchRfpsForProvider(provider_id: string): Promise<{
  success: boolean;
  total_matches: number;
  error?: string;
}> {
  try {
    const [provider] = await db.query(
      `SELECT skills FROM providerprofile WHERE provider_id = $1`,
      [provider_id]
    );

    if (!provider?.skills) {
      return { success: false, total_matches: 0, error: 'Provider has no skills set' };
    }

    const providerSkills = parseSkills(provider.skills);
    if (!providerSkills.length) {
      return { success: false, total_matches: 0, error: 'Provider skills list is empty' };
    }

    const openRfps = await db.query(
      `SELECT project_id, ai_skills
       FROM projectrequest
       WHERE status     = 'open'
         AND visibility = 'public'
         AND ai_skills  IS NOT NULL`
    );

    if (!openRfps.length) {
      console.log(`ℹ️ No open RFPs to match for provider ${provider_id}`);
      return { success: true, total_matches: 0 };
    }

    let totalMatches = 0;
    for (const rfp of openRfps) {
      const rfpSkills = parseRfpSkills(rfp.ai_skills);
      if (!rfpSkills.length) continue;

      const { score, matchedSkills } = scoreProviderAgainstRfp(providerSkills, rfpSkills);
      if (score >= 0.35) {
        const { isNew } = await upsertMatch(rfp.project_id, provider_id, score, matchedSkills);
        totalMatches++;

        if (isNew) {
          await notifyAdminOfNewMatch(rfp.project_id, provider_id, score);
        }
      }
    }

    console.log(`✅ [Provider→RFPs] Provider ${provider_id} matched to ${totalMatches} open RFPs`);
    return { success: true, total_matches: totalMatches };

  } catch (err: any) {
    console.error('[matchRfpsForProvider ERROR]', err);
    return { success: false, total_matches: 0, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// FUNCTION 3: Full nightly re-match (cron job)
// ─────────────────────────────────────────────────────────────
export async function fullRematch(): Promise<{
  success: boolean;
  rfps_processed: number;
  total_matches: number;
  stale_removed: number;
  error?: string;
}> {
  try {
    console.log('🔄 [FullRematch] Starting nightly re-match...');

    const staleResult = await db.query(
      `DELETE FROM rfp_provider_match
       WHERE is_checklist = FALSE
         AND project_id IN (
           SELECT project_id FROM projectrequest WHERE status != 'open'
         )
       RETURNING id`
    );
    const staleRemoved = staleResult.length;
    console.log(`🧹 [FullRematch] Removed ${staleRemoved} stale (non-checklisted) rows`);

    const openRfps = await db.query(
      `SELECT project_id, ai_skills
       FROM projectrequest
       WHERE status     = 'open'
         AND visibility = 'public'
         AND ai_skills  IS NOT NULL`
    );

    const providers = await db.query(
      `SELECT provider_id, skills
       FROM providerprofile
       WHERE skills IS NOT NULL
         AND jsonb_array_length(skills) > 0`
    );

    let totalMatches = 0;
    let rfpsProcessed = 0;

    for (const rfp of openRfps) {
      const rfpSkills = parseRfpSkills(rfp.ai_skills);
      if (!rfpSkills.length) continue;
      rfpsProcessed++;

      for (const provider of providers) {
        const providerSkills = parseSkills(provider.skills);
        if (!providerSkills.length) continue;

        const { score, matchedSkills } = scoreProviderAgainstRfp(providerSkills, rfpSkills);
        if (score >= 0.35) {
          const { isNew } = await upsertMatch(rfp.project_id, provider.provider_id, score, matchedSkills);
          totalMatches++;

          if (isNew) {
            await notifyAdminOfNewMatch(rfp.project_id, provider.provider_id, score);
          }
        }
      }
    }

    console.log(`✅ [FullRematch] ${rfpsProcessed} RFPs × ${providers.length} providers → ${totalMatches} matches`);
    return { success: true, rfps_processed: rfpsProcessed, total_matches: totalMatches, stale_removed: staleRemoved };

  } catch (err: any) {
    console.error('[fullRematch ERROR]', err);
    return { success: false, rfps_processed: 0, total_matches: 0, stale_removed: 0, error: err.message };
  }
}