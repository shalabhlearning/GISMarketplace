// src/lib/env.ts — Neon: only DATABASE_URL is needed
if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable');
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
} as const;
