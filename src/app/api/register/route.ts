// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';
import { matchRfpsForProvider } from '@/lib/matchProviders';

export async function POST(req: NextRequest) {
  try {
    const {
      userType, email, phoneNumber, password,
      organizationName, skills, hourlyRate, experienceYears, portfolioUrl,
    } = await req.json();

    if (!['buyer', 'provider', 'admin'].includes(userType)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (!email || !phoneNumber || !password) {
      return NextResponse.json({ error: 'Email, phone number, and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim();
    const cleanPhone = phoneNumber.trim();

    const existing = await query(
      `SELECT user_id FROM "user" WHERE email = $1 OR phone_number = $2`,
      [cleanEmail, cleanPhone]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = randomUUID();

    await query(
      `INSERT INTO "user" (user_id, email, phone_number, password_hash, user_type, status)
       VALUES ($1, $2, $3, $4, $5, 'active')`,
      [userId, cleanEmail, cleanPhone, hashedPassword, userType]
    );

    if (userType === 'buyer') {
      await query(
        `INSERT INTO buyerprofile (buyer_id, organization_name, rating) VALUES ($1, $2, 0.0)`,
        [userId, organizationName || null]
      );
    }

    if (userType === 'provider') {
      const skillsJson = Array.isArray(skills) && skills.length > 0
        ? JSON.stringify(skills)
        : null;

      await query(
        `INSERT INTO providerprofile
           (provider_id, organization_name, skills, hourly_rate, experience_years, portfolio_url, subscription_status, rating)
         VALUES ($1, $2, $3, $4, $5, $6, 'none', 0.0)`,
        [
          userId,
          organizationName || null,
          skillsJson,
          hourlyRate   ? parseFloat(hourlyRate)    : null,
          experienceYears ? parseInt(experienceYears) : null,
          portfolioUrl || null,
        ]
      );

      await query(
        `INSERT INTO creditledger (id, provider_id, credits, type, reason)
         VALUES ($1, $2, 100, 'credit', 'Initial credits')`,
        [randomUUID(), userId]
      );

      matchRfpsForProvider(userId)
        .then(result => {
          if (result.total_matches > 0) {
            console.log(`🎯 New provider "${organizationName}" matched to ${result.total_matches} RFPs on join`);
          }
        })
        .catch(err => console.error(`⚠️ Initial match failed for provider ${userId}:`, err.message));
    }

    return NextResponse.json({ success: true, message: 'Account created successfully!' });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
