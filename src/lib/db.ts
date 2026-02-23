// src/lib/db.ts (Fixed: Replace undefined params with null to avoid mysql2 bind error)
import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'help',
  database: 'GISMarketplace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query(sql: string, params?: any[]) {
  // Safely replace any undefined with null (mysql2 requires this for bind params)
  const safeParams = (params || []).map(p => (p === undefined ? null : p));
  
  const result = await pool.execute(sql, safeParams);
  return result[0]; // Always return only the rows
}

export default { query };