// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userType, // 'buyer' or 'provider'
      identifier,
      password,
      organizationName,
      hourlyRate,
      experienceYears,
      portfolioUrl,
    } = body;

    if (!userType || !identifier || !password) {
      return NextResponse.json({ error: 'User type, identifier (email or phone number), and password are required' }, { status: 400 });
    }

    if (!['buyer', 'provider'].includes(userType)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Detect if identifier is email or phone
    let email = null;
    let phoneNumber = null;
    if (identifier.includes('@') && identifier.includes('.')) {
      email = identifier;
      // Check if email exists
      const existingEmail = await query('SELECT user_id FROM user WHERE email = ?', [email]);
      if (Array.isArray(existingEmail) && existingEmail.length > 0) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
    } else {
      phoneNumber = identifier;
      // Check if phone exists
      const existingPhone = await query('SELECT user_id FROM user WHERE phone_number = ?', [phoneNumber]);
      if (Array.isArray(existingPhone) && existingPhone.length > 0) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = randomUUID();

    // Start transaction manually
    const connection = await require('@/lib/db').default.getConnection();
    try {
      await connection.beginTransaction();

      // Create user
      await connection.execute(
        'INSERT INTO user (user_id, email, phone_number, password_hash, user_type, status) VALUES (?, ?, ?, ?, ?, "active")',
        [userId, email, phoneNumber, hashedPassword, userType]
      );

      if (userType === 'provider') {
        if (!organizationName || !hourlyRate) {
          throw new Error('Organization name and hourly rate required for providers');
        }

        await connection.execute(
          `INSERT INTO providerprofile (
            provider_id, organization_name, hourly_rate, experience_years, 
            portfolio_url, subscription_status, rating
          ) VALUES (?, ?, ?, ?, ?, 'none', 0.0)`,
          [userId, organizationName, parseFloat(hourlyRate), experienceYears ? parseInt(experienceYears) : null, portfolioUrl || null]
        );
      }

      if (userType === 'buyer') {
        await connection.execute(
          'INSERT INTO buyerprofile (buyer_id, organization_name, rating) VALUES (?, ?, 0.0)',
          [userId, organizationName || null]
        );
      }

      await connection.commit();
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
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