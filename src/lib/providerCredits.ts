// src/lib/providerCredits.ts
import db from '@/lib/db';

export async function getProviderCredits(providerId: string): Promise<number> {
  const rows = await db.query<{ balance: number }>(
    `SELECT COALESCE(SUM(
        CASE
          WHEN type = 'credit' THEN credits
          WHEN type = 'debit'  THEN -credits
        END
      ), 0) AS balance
     FROM creditledger
     WHERE provider_id = $1`,
    [providerId]
  );
  return Number(rows[0]?.balance ?? 0);
}

export async function debitProviderCredits(
  providerId: string,
  amount: number,
  reason: string
): Promise<void> {
  await db.query(
    `INSERT INTO creditledger (id, provider_id, credits, type, reason)
     VALUES (gen_random_uuid()::text, $1, $2, 'debit', $3)`,
    [providerId, amount, reason]
  );
}
