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

    console.log('📄 Applying schema + data to target database...');

    // Remove lines that would conflict on a new DB
    sqlContent = sqlContent
      .replace(/CREATE DATABASE.*?;/gi, '')
      .replace(/USE\s+[`']?\w+[`']?\s*;/gi, '');

    // Split on semicolons that are at end of a line (safer than plain split(';'))
    const statements = sqlContent
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    console.log(`🔧 Found ${statements.length} statements to execute...\n`);

    let ok = 0, skipped = 0, failed = 0;

    for (const [i, stmt] of statements.entries()) {
      try {
        await db.query(stmt);
        ok++;
        // Only log every 10th statement to avoid console spam on large imports
        if ((i + 1) % 10 === 0 || statements.length < 20) {
          console.log(`✅ [${i + 1}/${statements.length}] OK`);
        }
      } catch (err: any) {
        if (
          err.message?.includes('already exists') ||
          err.code === 'ER_TABLE_EXISTS_ERROR'
        ) {
          skipped++;
          console.log(`⚠️  [${i + 1}] Skipped (already exists)`);
        } else {
          failed++;
          console.error(`❌ [${i + 1}] Failed: ${err.message}`);
          console.error(`   Statement: ${stmt.substring(0, 100)}...`);
        }
      }
    }

    console.log(`\n🎉 Done! ✅ ${ok} succeeded  ⚠️ ${skipped} skipped  ❌ ${failed} failed`);

  } catch (error: any) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

applySchema();