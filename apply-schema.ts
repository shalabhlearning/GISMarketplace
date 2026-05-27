import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';

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
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // File doesn't exist, skip
  }
}

/**
 * Splits a SQL dump into individual statements.
 * Handles multi-line INSERT blocks correctly by tracking
 * whether we're inside a string literal before treating ';' as a delimiter.
 */
function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    // Toggle string mode
    if (!inString && (ch === "'" || ch === '"' || ch === '`')) {
      inString = true;
      stringChar = ch;
      current += ch;
      i++;
      continue;
    }

    if (inString) {
      // Handle escape sequences inside strings
      if (ch === '\\' && i + 1 < sql.length) {
        current += ch + sql[i + 1];
        i += 2;
        continue;
      }
      if (ch === stringChar) {
        inString = false;
        stringChar = '';
      }
      current += ch;
      i++;
      continue;
    }

    // Outside strings: check for statement terminator
    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  // Catch any trailing statement without a semicolon
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

async function main() {
  await loadEnv(path.resolve(process.cwd(), '.env'));
  await loadEnv(path.resolve(process.cwd(), '.env.local'));

  console.log(`🔌 Connecting to: ${process.env.DB_HOST} / ${process.env.DB_NAME}`);

  // Use a single connection — Clever Cloud Dev plan allows max 5 connections
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'help',
    database: process.env.DB_NAME || 'GISMarketplace',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: false,
  });

  async function query(sql: string) {
    const result = await connection.execute(sql);
    return result[0];
  }

  try {
    const schemaPath = path.resolve(process.cwd(), 'gismarketplace_schema.sql');
    let sqlContent: string;

    try {
      sqlContent = await fs.readFile(schemaPath, 'utf-8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.error('❌ gismarketplace_schema.sql not found! Run export first.');
        process.exit(1);
      }
      throw err;
    }

    console.log('📄 Applying schema + data to target database...\n');

    // Strip database-level statements that don't apply to remote targets
    sqlContent = sqlContent
      .replace(/CREATE DATABASE.*?;/gi, '')
      .replace(/USE\s+[`']?\w+[`']?\s*;/gi, '');

    // Enable FK checks off/on are kept — they come from the export header
    const statements = splitStatements(sqlContent).filter(s => {
      // Skip pure comment blocks and empty lines
      return s.length > 5 && !s.startsWith('--');
    });

    console.log(`🔧 Found ${statements.length} statements...\n`);

    let ok = 0, skipped = 0, failed = 0;

    for (const [i, stmt] of statements.entries()) {
      const upper = stmt.toUpperCase().trimStart();
      const label = `[${i + 1}/${statements.length}]`;

      try {
        await query(stmt);
        ok++;

        // Only log meaningful milestones to keep output clean
        if (
          upper.startsWith('DROP TABLE') ||
          upper.startsWith('CREATE TABLE') ||
          upper.startsWith('SET FOREIGN') ||
          (i + 1) % 10 === 0 ||
          statements.length <= 20
        ) {
          const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
          console.log(`✅ ${label} ${preview}...`);
        }

      } catch (err: any) {
        const msg: string = err.message || '';
        const code: string = err.code || '';

        // True "already exists" — table DDL collision
        if (
          code === 'ER_TABLE_EXISTS_ERROR' ||
          (msg.includes('already exists') && upper.startsWith('CREATE TABLE'))
        ) {
          skipped++;
          const tableName = stmt.match(/CREATE TABLE\s+`?(\w+)`?/i)?.[1] ?? '?';
          console.warn(`⚠️  ${label} Table '${tableName}' already exists — skipped CREATE`);

        // Duplicate INSERT row — not a real failure
        } else if (code === 'ER_DUP_ENTRY') {
          skipped++;
          console.warn(`⚠️  ${label} Duplicate row(s) — skipped`);

        } else {
          failed++;
          console.error(`❌ ${label} FAILED: ${msg}`);
          console.error(`   → ${stmt.substring(0, 200).replace(/\n/g, ' ')}`);
        }
      }
    }

    console.log(`\n🎉 Done!`);
    console.log(`   ✅ ${ok} succeeded`);
    console.log(`   ⚠️  ${skipped} skipped`);
    console.log(`   ❌ ${failed} failed`);

    if (failed > 0) {
      console.error('\n⚠️  Some statements failed. Check logs above.');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('💥 Fatal:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();