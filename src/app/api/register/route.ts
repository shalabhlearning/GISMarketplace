// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userType,
      email: rawEmail,
      phoneNumber: rawPhoneNumber,
      password,
      organizationName,
      hourlyRate,
      experienceYears,
      portfolioUrl,
      dummyEmail = false,
      dummyPhone = false,
    } = body;

    const isFullDummy = dummyEmail && dummyPhone;

    if (!isFullDummy) {
      if (!userType || !rawEmail || !rawPhoneNumber || !password) {
        return NextResponse.json({ error: 'User type, email, phone number, and password are required' }, { status: 400 });
      }

      if (!['buyer', 'provider'].includes(userType)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
    }

    const email = rawEmail?.trim() || '';
    const phoneNumber = rawPhoneNumber?.trim() || '';

    if (!email || !phoneNumber) {
      return NextResponse.json({ error: 'Both email and phone number must be provided' }, { status: 400 });
    }

    // Uniqueness checks (skip for dummy)
    if (!dummyEmail) {
      const existing = await query('SELECT user_id FROM user WHERE email = ?', [email]);
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
    }

    if (!dummyPhone) {
      const existing = await query('SELECT user_id FROM user WHERE phone_number = ?', [phoneNumber]);
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = randomUUID();

    // Simple sequential queries (pool handles connections automatically)
    await query(
      'INSERT INTO user (user_id, email, phone_number, password_hash, user_type, status) VALUES (?, ?, ?, ?, ?, "active")',
      [userId, email, phoneNumber, hashedPassword, userType]
    );

    if (userType === 'provider') {
      if (!isFullDummy && (!organizationName || !hourlyRate)) {
        return NextResponse.json({ error: 'Organization name and hourly rate required for providers' }, { status: 400 });
      }

      await query(
        `INSERT INTO providerprofile (
          provider_id, organization_name, hourly_rate, experience_years, 
          portfolio_url, subscription_status, rating
        ) VALUES (?, ?, ?, ?, ?, 'none', 0.0)`,
        [
          userId,
          organizationName || null,
          hourlyRate ? parseFloat(hourlyRate) : null,
          experienceYears ? parseInt(experienceYears) : null,
          portfolioUrl || null
        ]
      );

      // Assign initial 100 credits for provider
      const ledgerId = randomUUID();
      await query(
        `INSERT INTO creditledger (id, provider_id, credits, type, reason) 
         VALUES (?, ?, 100, 'credit', 'Initial credits')`,
        [ledgerId, userId]
      );
    }

    if (userType === 'buyer') {
      await query(
        'INSERT INTO buyerprofile (buyer_id, organization_name, rating) VALUES (?, ?, 0.0)',
        [userId, organizationName || null]
      );
    }

    return NextResponse.json({ success: true, message: 'Account created successfully!' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}