// src/lib/env.ts
import 'dotenv/config';

console.log("🔧 dotenv/config executed");

if (process.env.DB_HOST) {
  console.log("✅ DB_HOST found:", process.env.DB_HOST);
} else {
  console.log("❌ DB_HOST not found in process.env");
}

// Force override if .env.local is being ignored
if (process.env.DB_HOST === 'localhost' || !process.env.DB_HOST) {
  console.log("⚠️ Forcing Clever Cloud values...");
  process.env.DB_HOST = 'besdzdpy9kmycrq5wlew-mysql.services.clever-cloud.com';
  process.env.DB_PORT = '3306';
  process.env.DB_USER = 'umqlifeepkg9y0q6';
  process.env.DB_PASSWORD = 'XgMbze8plFyXky41295o';
  process.env.DB_NAME = 'besdzdpy9kmycrq5wlew';
}

export const env = {
  db: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  }
} as const;