// migrate-to-neon.ts
// Migrates user, buyerprofile, providerprofile → Neon (PostgreSQL)
// Also seeds 200 credits for every provider in creditledger
// Run: npx tsx migrate-to-neon.ts

import fs from 'fs/promises';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

async function loadEnv(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.substring(0, eqIndex).trim();
      const val = trimmed.substring(eqIndex + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { }
}

// ── Split a row's raw values (respects strings and nested parens) ─────────────
function splitRow(row: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let inStr = false;
  let strChar = '';
  let depth = 0;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (!inStr && (ch === "'" || ch === '"')) {
      inStr = true; strChar = ch; cur += ch; continue;
    }
    if (inStr) {
      if (ch === '\\') { cur += ch + row[++i]; continue; }
      if (ch === strChar) inStr = false;
      cur += ch; continue;
    }
    if (ch === '(') { depth++; cur += ch; continue; }
    if (ch === ')') { depth--; cur += ch; continue; }
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

// ── Parse all INSERT blocks for a table from the dump ─────────────────────────
function extractInserts(dump: string, table: string): Array<{ columns: string[], rows: string[][] }> {
  const results: Array<{ columns: string[], rows: string[][] }> = [];
  const re = new RegExp(
    `INSERT INTO \`${table}\`\\s*\\(([^)]+)\\)\\s*VALUES\\s*([\\s\\S]*?);(?=\\s*\\n)`,
    'gi'
  );
  let match;
  while ((match = re.exec(dump)) !== null) {
    const columns = match[1].split(',').map(c => c.trim().replace(/`/g, ''));
    // Parse individual row tuples
    const valuesBlock = match[2];
    const rows: string[][] = [];
    let depth = 0, inStr = false, strChar = '', rowStart = -1, i = 0;
    while (i < valuesBlock.length) {
      const ch = valuesBlock[i];
      if (!inStr && (ch === "'" || ch === '"')) { inStr = true; strChar = ch; i++; continue; }
      if (inStr) {
        if (ch === '\\') { i += 2; continue; }
        if (ch === strChar) inStr = false;
        i++; continue;
      }
      if (ch === '(') { if (depth === 0) rowStart = i + 1; depth++; }
      else if (ch === ')') {
        depth--;
        if (depth === 0 && rowStart !== -1) {
          rows.push(splitRow(valuesBlock.slice(rowStart, i)));
          rowStart = -1;
        }
      }
      i++;
    }
    results.push({ columns, rows });
  }
  return results;
}

// ── Convert a single MySQL value token → JS value for pg parameterised query ──
// Returns { sql: '$N' | 'ST_GeomFromText($N)' | literal, param: any | null }
type ValueResult =
  | { mode: 'param'; param: any }
  | { mode: 'spatial'; param: string }
  | { mode: 'literal'; sql: string };

function parseValue(raw: string): ValueResult {
  const v = raw.trim();

  // NULL
  if (v.toUpperCase() === 'NULL') return { mode: 'param', param: null };

  // Spatial: ST_GeomFromText('POINT(x y)')
  const spatialMatch = v.match(/^ST_GeomFromText\('(.+)'\)$/i);
  if (spatialMatch) return { mode: 'spatial', param: spatialMatch[1] };

  // Number
  if (/^-?\d+(\.\d+)?$/.test(v)) return { mode: 'param', param: Number(v) };

  // Single-quoted string
  if (v.startsWith("'") && v.endsWith("'")) {
    const inner = v.slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\0/g, '\0');
    return { mode: 'param', param: inner };
  }

  // Fallback: pass as literal (shouldn't normally happen)
  return { mode: 'literal', sql: v };
}

async function migrateTable(
  sql: ReturnType<typeof neon>,
  dump: string,
  table: string,
  pgTable: string
) {
  const inserts = extractInserts(dump, table);
  if (inserts.length === 0) {
    console.log(`⏭  ${pgTable}: no data in dump — skipping`);
    return 0;
  }

  let ok = 0, skipped = 0, failed = 0;

  for (const { columns, rows } of inserts) {
    const pgCols = columns.map(c => `"${c}"`).join(', ');

    for (const [rowIdx, row] of rows.entries()) {
      if (row.length !== columns.length) {
        console.warn(`  ⚠️  ${pgTable} row ${rowIdx + 1}: column mismatch — skipped`);
        skipped++; continue;
      }

      const params: any[] = [];
      const placeholders: string[] = [];

      for (const rawVal of row) {
        const result = parseValue(rawVal);
        if (result.mode === 'literal') {
          placeholders.push(result.sql);
        } else if (result.mode === 'spatial') {
          params.push(result.param);
          placeholders.push(`ST_GeomFromText($${params.length})`);
        } else {
          params.push(result.param);
          placeholders.push(`$${params.length}`);
        }
      }

      try {
        await sql.query(
          `INSERT INTO "${pgTable}" (${pgCols}) VALUES (${placeholders.join(', ')}) ON CONFLICT DO NOTHING`,
          params
        );
        ok++;
      } catch (err: any) {
        failed++;
        console.error(`  ❌ ${pgTable} row ${rowIdx + 1}: ${err.message}`);
        console.error(`     → ${JSON.stringify(row).substring(0, 150)}`);
      }
    }
  }

  console.log(`✅ ${pgTable}: ${ok} inserted, ${skipped} skipped, ${failed} failed`);
  return ok;
}

async function seedProviderCredits(sql: ReturnType<typeof neon>) {
  console.log('\n💳 Seeding 200 credits for all providers...');

  // Get all provider user_ids
  const providers = await sql.query(
    `SELECT user_id FROM "user" WHERE user_type = 'provider'`
  );

  let ok = 0, skipped = 0, failed = 0;

  for (const row of providers as any[]) {
    const providerId = row.user_id;
    const ledgerId = randomUUID();

    try {
      // Check if this provider already has a credit entry
      const existing = await sql.query(
        `SELECT id FROM creditledger WHERE provider_id = $1 AND type = 'credit' AND reason = 'Initial credits'`,
        [providerId]
      );
      if ((existing as any[]).length > 0) {
        skipped++;
        continue;
      }

      await sql.query(
        `INSERT INTO creditledger (id, provider_id, credits, type, reason)
         VALUES ($1, $2, 200, 'credit', 'Initial credits')`,
        [ledgerId, providerId]
      );
      ok++;
    } catch (err: any) {
      failed++;
      console.error(`  ❌ Credits for ${providerId}: ${err.message}`);
    }
  }

  console.log(`✅ creditledger: ${ok} inserted, ${skipped} already existed, ${failed} failed`);
}

async function main() {
  await loadEnv(path.resolve(process.cwd(), '.env'));
  await loadEnv(path.resolve(process.cwd(), '.env.local'));

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  const dumpPath = path.resolve(process.cwd(), 'gismarketplace_schema.sql');
  let dump: string;
  try {
    dump = await fs.readFile(dumpPath, 'utf-8');
  } catch {
    console.error('❌ gismarketplace_schema.sql not found — run export first');
    process.exit(1);
  }

  console.log('🚀 Starting migration to Neon...\n');

  // Migrate in FK order
  await migrateTable(sql as any, dump, 'user', 'user');
  await migrateTable(sql as any, dump, 'buyerprofile', 'buyerprofile');
  await migrateTable(sql as any, dump, 'providerprofile', 'providerprofile');

  // Seed credits
  await seedProviderCredits(sql as any);

  console.log('\n🎉 Migration complete.');
}

main();