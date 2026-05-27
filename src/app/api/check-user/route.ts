// src/app/api/check-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, phoneNumber } = await req.json();

    if (!email || !phoneNumber) {
      return NextResponse.json({ error: 'Email and phone number are required' }, { status: 400 });
    }

    const rows = await query(
      `SELECT user_id FROM "user" WHERE email = $1 OR phone_number = $2`,
      [email.trim(), phoneNumber.trim()]
    );

    if (rows.length > 0) {
      return NextResponse.json({ exists: true, error: 'User with this email or phone already exists' }, { status: 409 });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('CHECK USER ERROR:', error);
    return NextResponse.json({ error: 'Server error while checking user' }, { status: 500 });
  }
}
