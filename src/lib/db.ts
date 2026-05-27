// src/lib/db.ts
import { env } from './env';
import mysql from 'mysql2/promise';

console.log("=== DB CONNECTION DEBUG ===");
console.log("FINAL DB_HOST:", env.db.host);
console.log("Clever Cloud: ✅ YES");
console.log("===========================");

let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      waitForConnections: true,
      connectionLimit: 4,        // Keep under Clever Cloud limit
      queueLimit: 0,
      enableKeepAlive: true,
    });
    console.log("🟢 New database pool created");
  }
  return pool;
}

export async function query(sql: string, params?: any[]) {
  const safeParams = (params || []).map(p => (p === undefined ? null : p));
  const dbPool = getPool();
  const [rows] = await dbPool.execute(sql, safeParams);
  return rows;
}

export { getPool };
export default { query };