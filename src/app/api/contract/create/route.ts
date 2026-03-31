// src/app/api/contract/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
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

    // Set safe SQL mode
    await connection.execute(
      "SET SESSION sql_mode = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'"
    );

    const { proposal_id } = await req.json();
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      await connection.rollback();
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session and buyer role
    const [sessionRows]: any = await connection.execute(
      `SELECT s.user_id, u.user_type
       FROM sessions s
       JOIN user u ON s.user_id = u.user_id
       WHERE s.session_token = ? AND s.expires > NOW()`,
      [sessionToken]
    );

    if (!sessionRows.length) {
      await connection.rollback();
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { user_id: buyerId, user_type } = sessionRows[0];

    if (user_type !== 'buyer') {
      await connection.rollback();
      return NextResponse.json({ error: 'Only buyers can award contracts' }, { status: 403 });
    }

    if (!proposal_id) {
      await connection.rollback();
      return NextResponse.json({ error: 'Proposal ID required' }, { status: 400 });
    }

    // Fetch proposal + project details
    const [proposalRows]: any = await connection.execute(
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
      return NextResponse.json({ error: 'Proposal not found or unauthorized' }, { status: 403 });
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
      return NextResponse.json({ error: 'Proposal already processed' }, { status: 400 });
    }

    if (project_status !== 'open') {
      await connection.rollback();
      return NextResponse.json({ error: 'Project already contracted' }, { status: 400 });
    }

    // Check if contract already exists
    const [existing]: any = await connection.execute(
      `SELECT contract_id FROM contract WHERE proposal_id = ?`,
      [proposal_id]
    );

    if (existing.length) {
      await connection.rollback();
      return NextResponse.json({ error: 'Contract already exists' }, { status: 400 });
    }

    const contract_id = randomUUID();

    // Create Contract
    await connection.execute(
      `INSERT INTO contract
       (contract_id, proposal_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, 'in_progress')`,
      [contract_id, proposal_id, start_date, end_date]
    );

    // Update Proposal & Project
    await connection.execute(`UPDATE proposal SET status = 'accepted' WHERE proposal_id = ?`, [proposal_id]);

    await connection.execute(
      `UPDATE proposal 
       SET status = 'rejected'
       WHERE project_id = ? AND proposal_id != ?`,
      [project_id, proposal_id]
    );

    await connection.execute(
      `UPDATE projectrequest
       SET status = 'contracted',
           awarded_to = ?
       WHERE project_id = ?`,
      [freelancer_id, project_id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'Contract awarded successfully',
      contract_id,
    });

  } catch (err: any) {
    if (connection) await connection.rollback();
    console.error('[Contract Create Error]', err);
    return NextResponse.json({ error: err.message || 'Failed to award contract' }, { status: 500 });
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}