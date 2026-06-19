// src/app/api/admin/notifications/route.ts
//
// GET   → list recent admin notifications (newest first), with unread count
// PATCH → mark notification(s) as read
//
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

// ─── GET: recent notifications ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifications = await query(
      `SELECT
         n.id, n.type, n.project_id, n.provider_id, n.match_score,
         n.message, n.is_read, n.created_at,
         pr.title AS project_title,
         pp.organization_name AS provider_name
       FROM admin_notifications n
       LEFT JOIN projectrequest pr   ON n.project_id  = pr.project_id
       LEFT JOIN providerprofile pp ON n.provider_id = pp.provider_id
       ORDER BY n.created_at DESC
       LIMIT 50`
    );

    const [{ count: unread }] = await query(
      `SELECT COUNT(*)::int AS count FROM admin_notifications WHERE is_read = FALSE`
    );

    return NextResponse.json({ success: true, notifications: notifications ?? [], unread });
  } catch (err: any) {
    console.error('[NOTIFICATIONS GET ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── PATCH: mark as read (single id, list of ids, or all) ─────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (body?.all === true) {
      await query(`UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE`);
      return NextResponse.json({ success: true });
    }

    const ids: string[] = Array.isArray(body?.ids) ? body.ids : (body?.id ? [body.id] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Provide id, ids[], or all:true' }, { status: 400 });
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    await query(
      `UPDATE admin_notifications SET is_read = TRUE WHERE id IN (${placeholders})`,
      ids
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[NOTIFICATIONS PATCH ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}