// src/lib/matchProviders.ts

import db from '@/lib/db';

// ─────────────────────────────────────────────────────────────
// Core scoring — compares one provider's skills against RFP skills
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
// Upsert a single match row
// ─────────────────────────────────────────────────────────────
async function upsertMatch(
  project_id: string,
  provider_id: string,
  score: number,
  matchedSkills: string[]
) {
  await db.query(
    `INSERT INTO rfp_provider_match (project_id, provider_id, match_score, reason)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       match_score = VALUES(match_score),
       reason      = VALUES(reason)`,
    [project_id, provider_id, score, JSON.stringify({ matched_skills: matchedSkills })]
  );
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
    ...(data.required_skills || []),
  ].map((s: string) => String(s).toLowerCase().trim());
}

// ─────────────────────────────────────────────────────────────
// FUNCTION 1: RFP approved → match against ALL providers
// Called by: approve route
// ─────────────────────────────────────────────────────────────
export async function matchProvidersForRfp(project_id: string): Promise<{
  success: boolean;
  total_matches: number;
  error?: string;
}> {
  try {
    const [rfp] = await db.query(
      `SELECT ai_skills FROM projectrequest WHERE project_id = ?`,
      [project_id]
    );

    if (!rfp?.ai_skills) {
      return { success: false, total_matches: 0, error: 'No skills data found on RFP' };
    }

    const rfpSkills = parseRfpSkills(rfp.ai_skills);
    if (!rfpSkills.length) {
      return { success: false, total_matches: 0, error: 'No skills extracted from RFP' };
    }

    const providers = await db.query(`
      SELECT provider_id, skills 
      FROM providerprofile 
      WHERE skills IS NOT NULL AND JSON_LENGTH(skills) > 0
    `);

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

    console.log(`✅ [RFP→Providers] ${totalMatches} providers matched for RFP ${project_id}`);
    return { success: true, total_matches: totalMatches };

  } catch (err: any) {
    console.error('[matchProvidersForRfp ERROR]', err);
    return { success: false, total_matches: 0, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// FUNCTION 2: New provider joins OR updates skills
//             → match against ALL open RFPs
// Called by: register route (on join) + profile/skills route (on update)
//
// This is what answers: "new provider joins → instantly sees
// all RFPs relevant to them, no admin action needed"
// ─────────────────────────────────────────────────────────────
export async function matchRfpsForProvider(provider_id: string): Promise<{
  success: boolean;
  total_matches: number;
  error?: string;
}> {
  try {
    const [provider] = await db.query(
      `SELECT skills FROM providerprofile WHERE provider_id = ?`,
      [provider_id]
    );

    if (!provider?.skills) {
      return { success: false, total_matches: 0, error: 'Provider has no skills set' };
    }

    const providerSkills = parseSkills(provider.skills);
    if (!providerSkills.length) {
      return { success: false, total_matches: 0, error: 'Provider skills list is empty' };
    }

    // All open public RFPs that have been skill-extracted
    const openRfps = await db.query(`
      SELECT project_id, ai_skills 
      FROM projectrequest 
      WHERE status = 'open' 
        AND visibility = 'public'
        AND ai_skills IS NOT NULL
    `);

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
        await upsertMatch(rfp.project_id, provider_id, score, matchedSkills);
        totalMatches++;
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
// Re-runs ALL open RFPs × ALL providers
// Also cleans up stale matches for closed/expired RFPs
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

    // Step 1: Remove stale matches for RFPs no longer open
    const staleResult = await db.query(`
      DELETE rpm FROM rfp_provider_match rpm
      JOIN projectrequest pr ON rpm.project_id = pr.project_id
      WHERE pr.status != 'open'
    `);
    const staleRemoved = staleResult?.affectedRows ?? 0;
    console.log(`🧹 [FullRematch] Removed ${staleRemoved} stale rows`);

    // Step 2: Fetch all open RFPs + all providers
    const openRfps = await db.query(`
      SELECT project_id, ai_skills 
      FROM projectrequest 
      WHERE status = 'open' 
        AND visibility = 'public'
        AND ai_skills IS NOT NULL
    `);

    const providers = await db.query(`
      SELECT provider_id, skills 
      FROM providerprofile 
      WHERE skills IS NOT NULL AND JSON_LENGTH(skills) > 0
    `);

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

        console.log(`Provider ${provider.provider_id}: ${score} (${matchedSkills.length} matches)`);

        if (score >= 0.35) {
          await upsertMatch(rfp.project_id, provider.provider_id, score, matchedSkills);
          totalMatches++;
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