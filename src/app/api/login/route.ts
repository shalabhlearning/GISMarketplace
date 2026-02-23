// src/app/api/login/route.ts (FINAL FIX: Delete old sessions + reliable cookie)
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Identifier (email or phone) and password are required' },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();

    const users: any[] = await query(
      'SELECT user_id, password_hash, user_type FROM user WHERE (email = ? OR phone_number = ?) AND status = "active"',
      [trimmedIdentifier, trimmedIdentifier]
    );

    if (!users.length) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // FINAL FIX: Delete ALL old sessions for this user
    await query('DELETE FROM sessions WHERE user_id = ?', [user.user_id]);

    // Create fresh session
    const sessionToken = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await query(
      'INSERT INTO sessions (session_token, user_id, expires) VALUES (?, ?, ?)',
      [sessionToken, user.user_id, expires]
    );

    const response = NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: {
        userId: user.user_id,
        identifier: trimmedIdentifier,
        userType: user.user_type,
      },
    });

    // Reliable cookie settings (localhost + production safe)
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // false on localhost
      sameSite: 'lax',
      path: '/', // Critical - sent to /api routes
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Update last login
    await query('UPDATE user SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}