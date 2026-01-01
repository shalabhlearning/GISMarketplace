// src/app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user by email
    const users = await query('SELECT user_id, password_hash, user_type FROM user WHERE email = ? AND status = "active"', [email]);

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = users[0];

    // Compare password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate session token
    const sessionToken = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Insert session into a new sessions table (you need to create this table - see note below)
    await query(
      'INSERT INTO sessions (session_token, user_id, expires) VALUES (?, ?, ?)',
      [sessionToken, user.user_id, expires]
    );

    // Set HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: { userId: user.user_id, email, userType: user.user_type },
    });

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires,
    });

    // Update last_login
    await query('UPDATE user SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}