// src/lib/db.ts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

function toPositional(query: string): string {
  let i = 1;
  return query.replace(/\?/g, () => `$${i++}`);
}

async function query<T = any>(rawSql: string, params: any[] = []): Promise<T[]> {
  const pgSql = toPositional(rawSql);
  const rows = await sql.query(pgSql, params); // ✅ sql.query(), not sql()
  return rows as T[];
}

export default { query };
export { query };