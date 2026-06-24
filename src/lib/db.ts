// src/lib/db.ts

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function toPositional(query: string): string {
  let i = 1;
  return query.replace(/\?/g, () => `$${i++}`);
}

export async function query<T = any>(
  rawSql: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const pgSql = toPositional(rawSql);

    const result = await pool.query(pgSql, params);

    return result.rows as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export default { query };