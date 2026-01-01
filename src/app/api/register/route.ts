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
        email,
        password,
        organizationName,
        hourlyRate,
        experienceYears,
        portfolioUrl,
      } = body;

      if (!userType || !email || !password) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      if (!['buyer', 'provider'].includes(userType)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      // Check if email exists
      const existing = await query('SELECT user_id FROM user WHERE email = ?', [email]);
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = randomUUID();

      // Start transaction manually
      const connection = await require('@/lib/db').default.getConnection();
      try {
        await connection.beginTransaction();

        // Create user
        await connection.execute(
          'INSERT INTO user (user_id, email, password_hash, user_type, status) VALUES (?, ?, ?, ?, "active")',
          [userId, email, hashedPassword, userType]
        );

        if (userType === 'provider') {
          if (!organizationName || !hourlyRate) {
            throw new Error('Business name and hourly rate required for providers');
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