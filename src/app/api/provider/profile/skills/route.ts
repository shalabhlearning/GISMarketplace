// src/app/api/provider/profile/skills/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { matchRfpsForProvider } from '@/lib/matchProviders';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows = await db.query(
      `SELECT user_id FROM sessions
       WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const providerId = sessionRows[0].user_id;
    const body = await req.json();
    const { skills } = body;

    if (!Array.isArray(skills)) {
      return NextResponse.json({ error: 'skills must be an array' }, { status: 400 });
    }

    // Save updated skills
    await db.query(
      `UPDATE providerprofile SET skills = ? WHERE provider_id = ?`,
      [JSON.stringify(skills), providerId]
    );

    // ✅ Re-match against all open RFPs with new skills
    // Fire and forget — response goes back immediately, matching runs in background
    matchRfpsForProvider(providerId)
      .then(result => {
        console.log(`🔄 Skills updated for ${providerId} → re-matched to ${result.total_matches} RFPs`);
      })
      .catch(err => {
        console.error(`⚠️ Re-match failed after skills update for ${providerId}:`, err);
      });

    return NextResponse.json({
      success: true,
      message: 'Skills saved. Matching RFPs will update shortly.',
      skills,
    });

  } catch (err: any) {
    console.error('[SKILLS UPDATE ERROR]', err);
    return NextResponse.json({
      error: 'Failed to update skills',
      message: err.message,
    }, { status: 500 });
  }
}

// GET — fetch current skills
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRows = await db.query(
      `SELECT user_id FROM sessions
       WHERE session_token = ? AND expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const providerId = sessionRows[0].user_id;

    const [profile] = await db.query(
      `SELECT skills FROM providerprofile WHERE provider_id = ?`,
      [providerId]
    );

    let skills: string[] = [];
    if (profile?.skills) {
      try {
        skills = typeof profile.skills === 'string'
          ? JSON.parse(profile.skills)
          : profile.skills;
      } catch {}
    }

    return NextResponse.json({ success: true, skills });

  } catch (err: any) {
    console.error('[SKILLS GET ERROR]', err);
    return NextResponse.json({
      error: 'Failed to fetch skills',
      message: err.message,
    }, { status: 500 });
  }
}