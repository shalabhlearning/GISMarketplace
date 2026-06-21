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

    // Buyers must have an organization name (NOT NULL in schema)
    if (userType === 'buyer' && !organizationName?.trim()) {
      return NextResponse.json({ error: 'Organization name is required for buyers' }, { status: 400 });
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

    // ── 1. Insert into user table ──────────────────────────────────────────
    await query(
      `INSERT INTO "user" (user_id, email, phone_number, password_hash, user_type, status)
       VALUES ($1, $2, $3, $4, $5, 'active')`,
      [userId, cleanEmail, cleanPhone, hashedPassword, userType]
    );

    // ── 2. Insert into profile table ───────────────────────────────────────
    if (userType === 'buyer') {
      try {
        await query(
          `INSERT INTO buyerprofile
             (buyer_id, organization_name, rating, subscription_status)
           VALUES ($1, $2, 0.0, 'inactive')`,
          [userId, organizationName.trim()]  // NOT NULL — always pass a value
        );
      } catch (profileErr: any) {
        // Roll back user insert so we don't leave orphaned user rows
        await query(`DELETE FROM "user" WHERE user_id = $1`, [userId]);
        console.error('Buyer profile insert failed:', profileErr);
        return NextResponse.json({ error: 'Failed to create buyer profile' }, { status: 500 });
      }
    }

    if (userType === 'provider') {
      const skillsJson = Array.isArray(skills) && skills.length > 0
        ? JSON.stringify(skills)
        : null;

      try {
        await query(
          `INSERT INTO providerprofile
             (provider_id, organization_name, skills, hourly_rate, experience_years,
              portfolio_url, subscription_status, rating)
           VALUES ($1, $2, $3, $4, $5, $6, 'none', 0.0)`,
          [
            userId,
            organizationName?.trim() || null,
            skillsJson,
            hourlyRate       ? parseFloat(hourlyRate)      : 0,   // NOT NULL DEFAULT 0
            experienceYears  ? parseInt(experienceYears)   : null,
            portfolioUrl?.trim() || null,
          ]
        );
      } catch (profileErr: any) {
        await query(`DELETE FROM "user" WHERE user_id = $1`, [userId]);
        console.error('Provider profile insert failed:', profileErr);
        return NextResponse.json({ error: 'Failed to create provider profile' }, { status: 500 });
      }

      // Credit ledger — non-critical, don't roll back if this fails
      try {
        await query(
          `INSERT INTO creditledger (id, provider_id, credits, type, reason)
           VALUES ($1, $2, 100, 'credit', 'Initial credits')`,
          [randomUUID(), userId]
        );
      } catch (ledgerErr: any) {
        console.error('Credit ledger insert failed (non-fatal):', ledgerErr.message);
      }

      // Fire-and-forget RFP matching
      matchRfpsForProvider(userId)
        .then(result => {
          if (result.total_matches > 0) {
            console.log(`🎯 Provider "${organizationName}" matched to ${result.total_matches} RFPs`);
          }
        })
        .catch(err => console.error(`⚠️ Initial match failed for provider ${userId}:`, err.message));
    }

    return NextResponse.json({ success: true, message: 'Account created successfully!' });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}