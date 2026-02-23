import db from '@/lib/db';

export async function getProviderCredits(providerId: string) {
  const rows: any[] = await db.query(
    `SELECT COALESCE(SUM(
        CASE 
          WHEN type = 'credit' THEN credits
          WHEN type = 'debit' THEN -credits
        END
      ), 0) AS balance
     FROM creditledger
     WHERE provider_id = ?`,
    [providerId]
  );

  return rows[0]?.balance || 0;
}

export async function debitProviderCredits(providerId: string, amount: number, reason: string) {
  await db.query(
    `INSERT INTO creditledger (id, provider_id, credits, type, reason)
     VALUES (UUID(), ?, ?, 'debit', ?)`,
    [providerId, amount, reason]
  );
}