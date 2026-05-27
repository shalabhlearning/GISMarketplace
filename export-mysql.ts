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

  // Returns column info for a table:
  // - computed: STORED/VIRTUAL GENERATED — excluded from INSERT entirely
  // - spatial:  POINT type — fetched via ST_AsText(), inserted via ST_GeomFromText()
  // - normal:   everything else — fetched and inserted as-is
  async function getColumnInfo(table: string) {
    const cols = await query(`SHOW COLUMNS FROM \`${table}\``) as any[];
    const computed: string[] = [];
    const spatial: string[] = [];
    const normal: string[] = [];

    for (const col of cols) {
      const extra: string = (col.Extra || '').toLowerCase();
      const type: string = (col.Type || '').toLowerCase();

      // Only skip truly computed columns — Extra contains 'stored generated' or 'virtual generated'
      // Do NOT skip 'default_generated' (those are just DEFAULT uuid() / DEFAULT CURRENT_TIMESTAMP)
      if (extra.includes('stored generated') || extra.includes('virtual generated')) {
        computed.push(col.Field);
        continue;
      }

      if (type.includes('point') || type.includes('geometry') || type.includes('polygon')) {
        spatial.push(col.Field);
        continue;
      }

      normal.push(col.Field);
    }

    return { computed, spatial, normal };
  }

  async function getJSONColumns(table: string): Promise<Set<string>> {
    const cols = await query(`SHOW COLUMNS FROM \`${table}\``) as any[];
    const jsonCols = new Set<string>();
    for (const col of cols) {
      if ((col.Type || '').toLowerCase().includes('json')) jsonCols.add(col.Field);
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
      return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    } catch {}
    if (!str.includes('{') && !str.includes('[') && str.includes(',')) {
      const items = str.split(',').map((s: string) => s.trim()).filter(Boolean);
      return `'${JSON.stringify(items).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }
    if (!str.includes('{') && !str.includes('[') && str.length > 0) {
      return `'${JSON.stringify([str]).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
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
      return `X'${val.toString('hex')}'`;
    }
    const str = String(val);
    if ((str.startsWith('{') || str.startsWith('[')) && str.length > 2) {
      return sanitizeJSON(val);
    }
    return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\0/g, '\\0')}'`;
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

      const { computed, spatial, normal } = await getColumnInfo(table);
      const jsonCols = await getJSONColumns(table);

      if (computed.length > 0) {
        console.log(`     skipping computed: ${computed.join(', ')}`);
      }
      if (spatial.length > 0) {
        console.log(`     spatial (ST_AsText): ${spatial.join(', ')}`);
      }

      const insertable = [...normal, ...spatial]; // all non-computed columns

      // Build SELECT with ST_AsText for spatial columns
      const selectParts = insertable.map(col =>
        spatial.includes(col)
          ? `ST_AsText(\`${col}\`) AS \`${col}\``
          : `\`${col}\``
      );

      const rows = await query(`SELECT ${selectParts.join(', ')} FROM \`${table}\``) as any[];

      if (rows.length > 0) {
        const columnList = insertable.map(c => `\`${c}\``).join(', ');

        const valueGroups = rows.map(row => {
          const vals = insertable.map(col => {
            if (spatial.includes(col)) {
              const v = (row as any)[col];
              return v ? `ST_GeomFromText('${v}')` : `ST_GeomFromText('POINT(0 0)')`;
            }
            return escapeValue((row as any)[col], col, jsonCols);
          });
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
        console.log(`     (no data)`);
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