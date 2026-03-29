import fs from 'fs/promises';
import path from 'path';
import db from './src/lib/db';

async function applySchema() {
  try {
    const schemaPath = path.resolve(process.cwd(), 'gismarketplace_schema.sql');

    let sqlContent;
    try {
      sqlContent = await fs.readFile(schemaPath, 'utf-8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.error('❌ Error: gismarketplace_schema.sql not found!');
        console.error('   Please run "npm run db:export" first to generate it.');
        process.exit(1);
      }
      throw err;
    }

    console.log('📄 Applying schema to target database...');

    // Clean unwanted statements
    sqlContent = sqlContent
      .replace(/CREATE DATABASE.*?;/gi, '-- CREATE DATABASE skipped')
      .replace(/USE\s+[`']?GISMarketplace[`']?\s*;/gi, '-- USE skipped');

    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 15 && !s.startsWith('--'));

    console.log(`🔧 Found ${statements.length} statements...`);

    for (const [i, stmt] of statements.entries()) {
      try {
        await db.query(stmt);
        console.log(`✅ [${i+1}/${statements.length}] OK`);
      } catch (err: any) {
        if (err.message.includes('already exists') || err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️  [${i+1}] Table already exists - skipped`);
        } else {
          console.error(`❌ [${i+1}] Failed:`, err.message);
        }
      }
    }

    console.log('\n🎉 Schema applied successfully!');
  } catch (error: any) {
    console.error('💥 Failed:', error.message);
    process.exit(1);
  }
}

applySchema();