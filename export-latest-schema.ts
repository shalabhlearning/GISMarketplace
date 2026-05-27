import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';

async function loadEnvForce(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      process.env[trimmed.substring(0, eqIndex).trim()] = trimmed.substring(eqIndex + 1).trim();
    }
  } catch {}
}

// These columns use DEFAULT (uuid()) which MySQL reports as "generated"
// but they are NOT computed — they must be included in exports
const NEVER_SKIP = new Set([
  'user_id', 'buyer_id', 'provider_id', 'project_id', 'proposal_id',
  'contract_id', 'payment_id', 'review_id', 'draft_id', 'service_id',
  'category_id', 'id'
]);

async function main() {
  await loadEnvForce(path.resolve(process.cwd(), '.env.local'));

  console.log(`🔌 Connecting to: ${process.env.DB_HOST} / ${process.env.DB_NAME}`);

  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'help',
    database: process.env.DB_NAME || 'GISMarketplace',
    port: Number(process.env.DB_PORT) || 3306,
  });

  async function query(sql: string) {
    const result = await c.execute(sql);
    return result[0];
  }

  async function getGeneratedColumns(table: string): Promise<Set<string>> {
    const cols = await query(`SHOW COLUMNS FROM \`${table}\``) as any[];
    const generated = new Set<string>();
    for (const col of cols) {
      if (col.Extra && (
        col.Extra.includes('VIRTUAL') ||
        col.Extra.includes('STORED') ||
        col.Extra.includes('GENERATED')
      )) {
        // Only skip truly computed columns, never primary key UUIDs
        if (!NEVER_SKIP.has(col.Field)) {
          generated.add(col.Field);
        }
      }
    }
    return generated;
  }

  async function getJSONColumns(table: string): Promise<Set<string>> {
    const cols = await query(`SHOW COLUMNS FROM \`${table}\``) as any[];
    const jsonCols = new Set<string>();
    for (const col of cols) {
      if (col.Type && col.Type.toLowerCase().includes('json')) {
        jsonCols.add(col.Field);
      }
    }
    return jsonCols;
  }

  function sanitizeJSON(val: any): string {
    if (val === null || val === undefined) return 'NULL';
    const str = String(val).trim();
    if (str === '' || str === 'null') return 'NULL';
    if (str === '[object Object]' || str === 'undefined') return 'NULL';
    try {
      JSON.parse(str);
      const escaped = str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `'${escaped}'`;
    } catch {}
    if (str.startsWith('/uploads/') || str.startsWith('./') || str.endsWith('.pdf')) {
      const escaped = JSON.stringify([str]).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `'${escaped}'`;
    }
    if (!str.includes('{') && !str.includes('[') && str.includes(',')) {
      const items = str.split(',').map((s: string) => s.trim()).filter(Boolean);
      const escaped = JSON.stringify(items).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `'${escaped}'`;
    }
    if (!str.includes('{') && !str.includes('[') && str.length > 0) {
      const escaped = JSON.stringify([str]).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `'${escaped}'`;
    }
    return 'NULL';
  }

  function escapeValue(val: any, col: string, jsonCols: Set<string>): string {
    if (jsonCols.has(col)) return sanitizeJSON(val);
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (typeof val === 'number') return String(val);
    if (val instanceof Date) {
      return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }
    if (Buffer.isBuffer(val)) {
      return `ST_GeomFromWKB(X'${val.toString('hex')}')`;
    }
    const str = String(val);
    if ((str.startsWith('{') || str.startsWith('[')) && str.length > 2) {
      return sanitizeJSON(val);
    }
    const escaped = str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\0/g, '\\0');
    return `'${escaped}'`;
  }

  try {
    const tablesResult = await query('SHOW TABLES');
    const allTables = (tablesResult as any[]).map((row: any) => Object.values(row)[0] as string);

    const tableOrder = [
      'user', 'subscriptionplan', 'servicecategory',
      'buyerprofile', 'providerprofile',
      'projectrequest', 'rfp_drafts', 'proposal', 'proposal_drafts',
      'contract', 'payment', 'review',
      'rfp_provider_match', 'creditledger', 'servicelisting', 'sessions'
    ];

    const tableNames = [
      ...tableOrder.filter(t => allTables.includes(t)),
      ...allTables.filter(t => !tableOrder.includes(t))
    ];

    console.log(`📋 Found ${tableNames.length} tables. Exporting...`);

    let sql = `-- GISMarketplace Full Export\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    sql += `SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n`;

    for (const table of tableNames) {
      console.log(`  📦 ${table}`);

      const createResult = await query(`SHOW CREATE TABLE \`${table}\``);
      const createSQL = (createResult as any[])[0]['Create Table'];

      sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
      sql += `${createSQL};\n\n`;

      const generatedCols = await getGeneratedColumns(table);
      const jsonCols = await getJSONColumns(table);

      const rows = await query(`SELECT * FROM \`${table}\``) as any[];

      if (rows.length > 0) {
        const allColumns = Object.keys(rows[0]);
        const insertColumns = allColumns.filter(c => !generatedCols.has(c));
        const columnList = insertColumns.map(c => `\`${c}\``).join(', ');

        console.log(`     columns: ${columnList.substring(0, 80)}...`);

        const valueGroups = rows.map(row => {
          const vals = insertColumns.map(col => escapeValue((row as any)[col], col, jsonCols));
          return `(${vals.join(', ')})`;
        });

        for (let i = 0; i < valueGroups.length; i += 50) {
          const batch = valueGroups.slice(i, i + 50).join(',\n  ');
          sql += `INSERT INTO \`${table}\` (${columnList}) VALUES\n  ${batch};\n`;
        }
        sql += `\n`;
        console.log(`     ✅ ${rows.length} rows`);
      } else {
        sql += `-- (no data in ${table})\n\n`;
      }
    }

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const filePath = path.resolve(process.cwd(), 'gismarketplace_schema.sql');
    await fs.writeFile(filePath, sql, 'utf-8');
    console.log(`\n✅ Exported to: ${filePath}`);

  } finally {
    await c.end();
  }
}

main();