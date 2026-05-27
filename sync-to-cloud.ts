import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

async function main() {
  console.log('🔌 Connecting to LOCAL MySQL...');
  const local = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'help',
    database: 'GISMarketplace',
    port: 3306,
  });

  console.log('🔌 Connecting to Clever Cloud MySQL...');
  const remote = await mysql.createConnection({
    host: 'besdzdpy9kmycrq5wlew-mysql.services.clever-cloud.com',
    user: 'umqlifeepkg9y0q6',
    password: 'XgMbze8plFyXky41295o',
    database: 'besdzdpy9kmycrq5wlew',
    port: 3306,
  });

  // All tables in reverse FK order for safe deletion, forward order for insertion
  const allTablesReversed = [
    'sessions',
    'creditledger',
    'rfp_provider_match',
    'review',
    'payment',
    'contract',
    'proposal_drafts',
    'proposal',
    'rfp_drafts',
    'projectrequest',
    'servicelisting',
    'providerprofile',
    'buyerprofile',
    'servicecategory',
    'subscriptionplan',
    'user',
  ];

  const allTablesForward = [...allTablesReversed].reverse();

  // Only these tables get data copied from local
  const tablesToCopy = new Set(['user', 'buyerprofile', 'providerprofile']);

  try {
    await remote.execute('SET FOREIGN_KEY_CHECKS = 0');

    // ─── Step 1: Wipe ALL tables on remote ───────────────────────────────────
    console.log('\n🗑️  Wiping all tables on Clever Cloud...');
    for (const table of allTablesReversed) {
      try {
        await remote.execute(`DELETE FROM \`${table}\``);
        console.log(`  ✅ Cleared ${table}`);
      } catch (err: any) {
        console.log(`  ⚠️  Could not clear ${table}: ${err.message.substring(0, 80)}`);
      }
    }

    // ─── Step 2: Copy data for selected tables, leave others empty ────────────
    console.log('\n📦 Syncing tables...');
    for (const table of allTablesForward) {
      // Check if table exists locally
      const [localTables] = await local.execute(
        `SELECT COUNT(*) as cnt FROM information_schema.tables 
         WHERE table_schema = 'GISMarketplace' AND table_name = ?`,
        [table]
      ) as any;

      if (localTables[0].cnt === 0) {
        console.log(`⏭️  ${table} — not found locally, skipping`);
        continue;
      }

      if (!tablesToCopy.has(table)) {
        console.log(`⏭️  ${table} — keeping empty (not in copy list)`);
        continue;
      }

      const [countResult] = await local.execute(
        `SELECT COUNT(*) as cnt FROM \`${table}\``
      ) as any;
      const localCount = countResult[0].cnt;

      if (localCount === 0) {
        console.log(`⏭️  ${table} — empty locally, skipping`);
        continue;
      }

      console.log(`\n📦 ${table} — copying ${localCount} rows...`);

      // Get column info including types
      const [cols] = await local.execute(`SHOW COLUMNS FROM \`${table}\``) as any;

      // Skip generated/computed columns
      const insertCols = cols.filter((c: any) => {
        const extra = c.Extra || '';
        return !extra.includes('VIRTUAL') && !extra.includes('STORED');
      });

      const colNames: string[] = insertCols.map((c: any) => c.Field);
      const colTypes: Record<string, string> = Object.fromEntries(
        insertCols.map((c: any) => [c.Field, (c.Type || '').toUpperCase()])
      );

      const isGeometryCol = (col: string): boolean => {
        const t = colTypes[col] || '';
        return (
          t.includes('GEOMETRY') ||
          t.includes('POINT') ||
          t.includes('POLYGON') ||
          t.includes('LINESTRING') ||
          t.includes('MULTIPOINT') ||
          t.includes('MULTIPOLYGON') ||
          t.includes('MULTILINESTRING') ||
          t.includes('GEOMETRYCOLLECTION')
        );
      };

      const selectCols = colNames.map((c) => `\`${c}\``).join(', ');
      const [rows] = await local.execute(
        `SELECT ${selectCols} FROM \`${table}\``
      ) as any;

      let inserted = 0;
      const batchSize = 20;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        for (const row of batch) {
          const values: any[] = [];

          const placeholders = colNames
            .map((col) => {
              const val = row[col];
              if (isGeometryCol(col) && val !== null && val !== undefined) {
                values.push(val);
                return 'ST_GeomFromWKB(?)';
              } else {
                values.push(val ?? null);
                return '?';
              }
            })
            .join(', ');

          const colList = colNames.map((c) => `\`${c}\``).join(', ');

          try {
            await remote.execute(
              `INSERT INTO \`${table}\` (${colList}) VALUES (${placeholders})`,
              values
            );
            inserted++;
          } catch (err: any) {
            console.error(
              `  ⚠️  Row failed in ${table}: ${err.message.substring(0, 120)}`
            );
          }
        }
      }

      console.log(`  ✅ ${inserted}/${localCount} rows copied`);
    }

    // ─── Step 3: Give every provider 200 credits ─────────────────────────────
    console.log('\n💳 Adding 200 credits to every provider...');

    const [providers] = await remote.execute(
      `SELECT provider_id FROM providerprofile`
    ) as any;

    let creditCount = 0;
    for (const row of providers) {
      try {
        await remote.execute(
          `INSERT INTO creditledger (id, provider_id, credits, type, reason)
           VALUES (?, ?, 200, 'credit', 'Initial sync credits')`,
          [randomUUID(), row.provider_id]
        );
        creditCount++;
      } catch (err: any) {
        console.error(
          `  ⚠️  Credit insert failed for ${row.provider_id}: ${err.message.substring(0, 80)}`
        );
      }
    }

    console.log(`  ✅ Added 200 credits to ${creditCount} providers`);

    await remote.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n🎉 Done! Clever Cloud is clean and ready.');

  } finally {
    await local.end();
    await remote.end();
  }
}

main().catch(console.error);