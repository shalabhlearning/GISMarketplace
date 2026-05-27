import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env first
const envPath = path.resolve(process.cwd(), '.env.local');

console.log('🔍 Looking for env file:', envPath);
console.log('📁 File exists?', fs.existsSync(envPath));

dotenv.config({ path: envPath });

console.log('🔍 DATABASE_URL found?', !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL missing');
  process.exit(1);
}

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const sql = neon(process.env.DATABASE_URL);

const PLAIN_PASSWORD = '12345678';

async function main() {
  console.log('🚀 Starting User Fix Migration...');

  const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, 12);

  console.log('✅ Password hashed');

  await sql`DELETE FROM "user"`;

  console.log('✅ Cleared existing "user" table');

  const buyers = await sql`
    SELECT
      buyer_id AS user_id,
      organization_name,
      'buyer' AS user_type
    FROM buyerprofile
    WHERE buyer_id IS NOT NULL
  `;

  const providers = await sql`
    SELECT
      provider_id AS user_id,
      organization_name,
      'provider' AS user_type
    FROM providerprofile
    WHERE provider_id IS NOT NULL
  `;

  const userMap = new Map();

  [...buyers, ...providers].forEach((row: any) => {
    const userId = String(row.user_id).trim();

    if (!userMap.has(userId)) {
      userMap.set(userId, {
        user_id: userId,
        email: `user.${userId.slice(0, 8).toLowerCase()}@gis-marketplace.com`,
        password_hash: hashedPassword,
        user_type: row.user_type,
        phone_number: null,
        join_date: new Date(),
        last_login: null,
        status: 'active',
      });
    }
  });

  const allUsers = Array.from(userMap.values());

  console.log(`📊 Found ${allUsers.length} unique users`);

  if (!allUsers.length) {
    console.log('❌ No users found');
    return;
  }

  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
    const batch = allUsers.slice(i, i + BATCH_SIZE);

    const user_ids = batch.map(u => u.user_id);
    const emails = batch.map(u => u.email);
    const passwords = batch.map(u => u.password_hash);
    const user_types = batch.map(u => u.user_type);
    const phones = batch.map(u => u.phone_number);
    const join_dates = batch.map(u => u.join_date);
    const last_logins = batch.map(u => u.last_login);
    const statuses = batch.map(u => u.status);

    await sql`
      INSERT INTO "user"
      (
        user_id,
        email,
        password_hash,
        user_type,
        phone_number,
        join_date,
        last_login,
        status
      )
      SELECT *
      FROM UNNEST(
        ${user_ids}::text[],
        ${emails}::text[],
        ${passwords}::text[],
        ${user_types}::text[],
        ${phones}::text[],
        ${join_dates}::timestamp[],
        ${last_logins}::timestamp[],
        ${statuses}::text[]
      )
      ON CONFLICT (user_id)
      DO NOTHING
    `;

    inserted += batch.length;

    console.log(
      `✅ Inserted ${inserted}/${allUsers.length}`
    );
  }

  console.log('');
  console.log('🎉 SUCCESS');
  console.log(`Password for all users: ${PLAIN_PASSWORD}`);
}

main()
  .catch(err => {
    console.error('❌ Migration failed');
    console.error(err);
  })
  .finally(() => process.exit(0));