import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies.session_token;
    const projectId = req.query.project_id;

    console.log("🔵 API → project_id:", projectId);
    console.log("🔵 API → sessionToken:", sessionToken);

    if (!sessionToken || !projectId) {
      console.log("❌ Missing session or project_id");
      return res.status(200).json(null);
    }

    // ✅ AUTH CHECK
    const sessionRows: any[] = await db.query(
      `SELECT user_id 
       FROM sessions 
       WHERE session_token = ? 
         AND expires > NOW()`,
      [sessionToken]
    );

    console.log("🟡 API → sessionRows:", sessionRows);

    if (!sessionRows.length) {
      console.log("❌ Invalid session");
      return res.status(200).json(null);
    }

    const providerId = sessionRows[0].user_id;

    console.log("🟢 API → providerId:", providerId);

    // ✅ FETCH DRAFT
    const rows: any[] = await db.query(
      `SELECT * FROM proposal_drafts 
       WHERE BINARY project_id = BINARY ? 
       AND provider_id = ? 
       LIMIT 1`,
      [String(projectId), String(providerId)]
    );

    console.log("🧠 API → DB RESULT:", rows);

    if (!rows.length) {
      console.log("⚠️ No draft found");
      return res.status(200).json(null);
    }

    const d = rows[0];

    console.log("🔥 RAW DB ROW:", d);

    // ✅ SAFE JSON PARSER (NO CRASH)
    const safeParse = (value: any) => {
      try {
        if (!value) return [];
        if (typeof value === 'string') return JSON.parse(value);
        return value;
      } catch (err) {
        console.error("❌ JSON parse error:", err);
        return [];
      }
    };

    // ✅ FINAL RESPONSE (MATCHES FRONTEND)
    return res.status(200).json({
      bid_amount: d.bid_amount || '',
      technical: d.technical || '',
      delivery: d.delivery || '',
      milestones: safeParse(d.milestones),
      case_studies: safeParse(d.case_studies),
      references: safeParse(d.references_json)
    });

  } catch (err: any) {
    console.error("💥 GET DRAFT ERROR:", err);
    return res.status(500).json({ error: 'Failed to load draft' });
  }
}