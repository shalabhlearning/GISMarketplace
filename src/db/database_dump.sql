// src/lib/db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'GISMarketplace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = {
  query: async (sql: string, params?: any[]) => {
    const [rows] = await pool.execute(sql, params);
    return rows as any[];
  },
};

// Export as default (recommended for Next.js server components)
export default db;