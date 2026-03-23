import type { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'help',
    database: 'GISMarketplace',
    waitForConnections: true,
    connectionLimit: 10,
  });

  let connection: any = null;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      "SET SESSION sql_mode = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'"
    );

    const safeExecute = async (sql: string, params?: any[]) => {
      const safeParams = (params || []).map(p => (p === undefined ? null : p));
      const [rows] = await connection.execute(sql, safeParams);
      return rows;
    };

    const sessionToken = req.cookies['session_token'];

    if (!sessionToken) {
      await connection.rollback();
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessionRows: any = await safeExecute(
      `SELECT s.user_id, u.user_type
       FROM sessions s
       JOIN user u ON s.user_id = u.user_id
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      await connection.rollback();
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { user_id: buyerId, user_type } = sessionRows[0];

    if (user_type !== 'buyer') {
      await connection.rollback();
      return res.status(403).json({ error: 'Only buyers can award contracts' });
    }

    const { proposal_id } = req.body;

    if (!proposal_id) {
      await connection.rollback();
      return res.status(400).json({ error: 'Proposal ID required' });
    }

    const proposalRows: any = await safeExecute(
      `SELECT 
         p.project_id,
         p.status AS proposal_status,
         p.provider_id AS freelancer_id,
         pr.status AS project_status,
         pr.start_date,
         pr.end_date
       FROM proposal p
       JOIN projectrequest pr ON p.project_id = pr.project_id
       WHERE p.proposal_id = ? AND pr.buyer_id = ?`,
      [proposal_id, buyerId]
    );

    if (!proposalRows.length) {
      await connection.rollback();
      return res.status(403).json({ error: 'Proposal not found or unauthorized' });
    }

    const {
      project_id,
      freelancer_id,
      proposal_status,
      project_status,
      start_date,
      end_date,
    } = proposalRows[0];

    if (proposal_status !== 'submitted') {
      await connection.rollback();
      return res.status(400).json({ error: 'Proposal already processed' });
    }

    if (project_status !== 'open') {
      await connection.rollback();
      return res.status(400).json({ error: 'Project already contracted' });
    }

    const existing: any = await safeExecute(
      `SELECT contract_id FROM contract WHERE proposal_id = ?`,
      [proposal_id]
    );

    if (existing.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'Contract already exists' });
    }

    const contract_id = randomUUID();

    await safeExecute(
      `INSERT INTO contract
       (contract_id, proposal_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, 'in_progress')`,
      [contract_id, proposal_id, start_date, end_date]
    );

    await safeExecute(`UPDATE proposal SET status = 'accepted' WHERE proposal_id = ?`, [proposal_id]);

    await safeExecute(
      `UPDATE proposal 
       SET status = 'rejected'
       WHERE project_id = ? AND proposal_id != ?`,
      [project_id, proposal_id]
    );

    await safeExecute(
      `UPDATE projectrequest
       SET status = 'contracted',
           awarded_to = ?
       WHERE project_id = ?`,
      [freelancer_id, project_id]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Contract awarded successfully',
      contract_id,
    });
  } catch (err: any) {
    if (connection) await connection.rollback();
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to award contract' });
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}