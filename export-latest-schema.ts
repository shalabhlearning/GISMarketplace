import fs from 'fs/promises';
import path from 'path';
import db from './src/lib/db';

async function exportLatestSchema() {
  try {
    console.log('🔌 Connecting to MySQL and exporting schema + data...');

    const tablesResult = await db.query('SHOW TABLES');
    const tableNames = tablesResult.map((row: any) => Object.values(row)[0] as string);

    if (tableNames.length === 0) {
      console.log('⚠️ No tables found in the database.');
      return;
    }

    console.log(`📋 Found ${tableNames.length} tables. Exporting...`);

    let schemaSQL = `-- =============================================\n`;
    schemaSQL += `-- GISMarketplace - Full Export (Schema + Data)\n`;
    schemaSQL += `-- Generated on: ${new Date().toISOString()}\n`;
    schemaSQL += `-- =============================================\n\n`;
    schemaSQL += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tableNames) {
      console.log(`  📦 Exporting table: ${table}`);

      // --- Schema ---
      const createResult = await db.query(`SHOW CREATE TABLE \`${table}\``);
      const createTableSQL = (createResult as any[])[0]['Create Table'] as string;

      schemaSQL += `-- -----------------------------------------------\n`;
      schemaSQL += `-- Table: ${table}\n`;
      schemaSQL += `-- -----------------------------------------------\n`;
      schemaSQL += `DROP TABLE IF EXISTS \`${table}\`;\n`;
      schemaSQL += `${createTableSQL};\n\n`;

      // --- Data ---
      const rows = await db.query(`SELECT * FROM \`${table}\``) as any[];

      if (rows.length > 0) {
        // Get column names from first row
        const columns = Object.keys(rows[0])
          .map(c => `\`${c}\``)
          .join(', ');

        const valueGroups = rows.map(row => {
          const vals = Object.values(row).map(val => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number' || typeof val === 'boolean') return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            if (Buffer.isBuffer(val)) return `X'${val.toString('hex')}'`;
            // Escape single quotes and backslashes
            const escaped = String(val)
              .replace(/\\/g, '\\\\')
              .replace(/'/g, "\\'")
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r');
            return `'${escaped}'`;
          });
          return `(${vals.join(', ')})`;
        });

        // Batch inserts in groups of 100 rows to keep file manageable
        const batchSize = 100;
        for (let i = 0; i < valueGroups.length; i += batchSize) {
          const batch = valueGroups.slice(i, i + batchSize).join(',\n  ');
          schemaSQL += `INSERT INTO \`${table}\` (${columns}) VALUES\n  ${batch};\n`;
        }
        schemaSQL += `\n`;
        console.log(`     ✅ ${rows.length} rows exported`);
      } else {
        schemaSQL += `-- (no data in ${table})\n\n`;
        console.log(`     ℹ️  No data`);
      }
    }

    schemaSQL += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const filePath = path.resolve(process.cwd(), 'gismarketplace_schema.sql');
    await fs.writeFile(filePath, schemaSQL, 'utf-8');

    console.log(`\n✅ SUCCESS! Full export saved to: ${filePath}`);
    console.log('   Commit this file to GitHub to preserve your data.');

  } catch (error: any) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

exportLatestSchema();