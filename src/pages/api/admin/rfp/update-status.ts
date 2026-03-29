import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId, action } = req.body;

    if (!projectId || !action) {
      return res.status(400).json({ error: 'Missing data' });
    }

    let newStatus = '';

    if (action === 'approve') newStatus = 'open';
    else if (action === 'reject') newStatus = 'closed';
    else if (action === 'changes') newStatus = 'in_review';
    else return res.status(400).json({ error: 'Invalid action' });

    await query(
      `UPDATE projectrequest SET status = ? WHERE project_id = ?`,
      [newStatus, projectId]
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
}