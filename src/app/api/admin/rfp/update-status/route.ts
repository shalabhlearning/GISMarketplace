// src/app/api/admin/rfp/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractRequiredSkills } from '@/lib/vector-store';
import { matchProvidersForRfp } from '@/lib/matchProviders';

export async function POST(req: NextRequest) {
  try {
    const { projectId, action } = await req.json();

    if (!projectId || !action) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (!['approve', 'reject', 'changes'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'open'
      : action === 'reject' ? 'closed' : 'in_review';

    if (action === 'approve') {
      await query(
        `UPDATE projectrequest SET status = 'open', visibility = 'public' WHERE project_id = ?`,
        [projectId]
      );

      const [rfp] = await query(
        `SELECT attachments FROM projectrequest WHERE project_id = ?`,
        [projectId]
      );

      let attachments: string[] = [];
      if (rfp?.attachments) {
        try {
          attachments = typeof rfp.attachments === 'string'
            ? JSON.parse(rfp.attachments)
            : Array.isArray(rfp.attachments) ? rfp.attachments : [];
        } catch (e) {
          console.error(`[Approve] Failed to parse attachments for ${projectId}`, e);
        }
      }

      if (attachments.length > 0) {
        ;(async () => {
          try {
            console.log(`🚀 [Approve] Starting AI processing for RFP ${projectId}`);

            const skillData = await extractRequiredSkills(projectId, attachments);

            await query(
              `UPDATE projectrequest 
               SET ai_skills = ?, 
                   ai_processed = TRUE, 
                   ai_processed_at = NOW() 
               WHERE project_id = ?`,
              [JSON.stringify(skillData), projectId]
            );

            console.log(`💾 [Approve] Skills saved for ${projectId}`);

            const matchResult = await matchProvidersForRfp(projectId);
            console.log(`🎯 [Approve] Matched ${matchResult.total_matches} providers for ${projectId}`);

          } catch (err: any) {
            console.error(`❌ [Approve Background] Critical failure for ${projectId}:`, err.message, err.stack);
          }
        })();
      } else {
        console.warn(`⚠️ No attachments for RFP ${projectId}`);
      }
    } else {
      await query(`UPDATE projectrequest SET status = ? WHERE project_id = ?`, [newStatus, projectId]);
    }

    return NextResponse.json({ success: true, status: newStatus });

  } catch (err: any) {
    console.error('[UPDATE STATUS ERROR]', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}