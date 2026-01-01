// src/lib/db.ts
import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'help',
  database: 'GISMarketplace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // mysql2 uses these names (not acquireTimeout)
  acquireTimeout: 60000, // 60 seconds
  timeout: 60000,
});

export async function query(sql: string, params?: any[]) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Optional: export pool for transactions
export default pool;