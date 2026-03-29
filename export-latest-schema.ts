import fs from 'fs/promises';
import path from 'path';
import db from './src/lib/db';   // your default export

async function exportLatestSchema() {
  try {
    console.log('🔌 Connecting to MySQL and exporting latest schema...');

    const tablesResult = await db.query('SHOW TABLES');
    const tableNames = tablesResult.map((row: any) => Object.values(row)[0] as string);

    if (tableNames.length === 0) {
      console.log('⚠️ No tables found in the database.');
      return;
    }

    console.log(`📋 Found ${tableNames.length} tables. Exporting schema...`);

    let schemaSQL = `-- =============================================\n`;
    schemaSQL += `-- GISMarketplace - Latest Schema Export\n`;
    schemaSQL += `-- Generated on: ${new Date().toISOString()}\n`;
    schemaSQL += `-- =============================================\n\n`;
    schemaSQL += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tableNames) {
      const createResult = await db.query(`SHOW CREATE TABLE \`${table}\``);
      const createTableSQL = createResult[0]['Create Table'] as string;

      schemaSQL += `-- Table: ${table}\n`;
      schemaSQL += `DROP TABLE IF EXISTS \`${table}\`;\n`;
      schemaSQL += `${createTableSQL};\n\n`;
    }

    schemaSQL += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const filePath = path.resolve(process.cwd(), 'gismarketplace_schema.sql');
    await fs.writeFile(filePath, schemaSQL, 'utf-8');

    console.log(`✅ SUCCESS! Latest schema exported to: ${filePath}`);
    console.log('   You can now commit this file to GitHub.');

  } catch (error: any) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

exportLatestSchema();