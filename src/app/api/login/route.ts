// src/app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Identifier and password are required' }, { status: 400 });
    }

    const trimmed = identifier.trim();

    // PostgreSQL: status = 'active' uses single quotes (not double like MySQL)
    const users = await query(
      `SELECT user_id, password_hash, user_type
       FROM "user"
       WHERE (email = $1 OR phone_number = $1) AND status = 'active'`,
      [trimmed]
    );

    if (!users.length) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    await query(`DELETE FROM sessions WHERE user_id = $1`, [user.user_id]);

    const sessionToken = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO sessions (session_token, user_id, expires) VALUES ($1, $2, $3)`,
      [sessionToken, user.user_id, expires]
    );

    await query(`UPDATE "user" SET last_login = NOW() WHERE user_id = $1`, [user.user_id]);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: { userId: user.user_id, identifier: trimmed, userType: user.user_type },
    });

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
