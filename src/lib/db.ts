import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Converts MySQL-style ? placeholders to PostgreSQL $1, $2, ...
function toPositional(query: string, params: any[] = []): string {
  let i = 1;
  return query.replace(/\?/g, () => `$${i++}`);
}

async function query<T = any>(rawSql: string, params: any[] = []): Promise<T[]> {
  const pgSql = toPositional(rawSql, params);
  const rows = await sql.query(pgSql, params);
  return rows as T[];
}

export default { query };
export { query };