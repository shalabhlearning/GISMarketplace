// src/app/api/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

const globalAny: any = global;
const cache = globalAny.otpCache || new NodeCache({ stdTTL: 600 });

if (!globalAny.otpCache) {
  globalAny.otpCache = cache;
}

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, phoneNumber: rawPhoneNumber, emailOtp, phoneOtp } = await req.json();

    if (!rawEmail || !rawPhoneNumber || !emailOtp || !phoneOtp) {
      return NextResponse.json({
        error: 'Email, phone number, email OTP, and phone OTP are required',
      }, { status: 400 });
    }

    const email = rawEmail.trim();

    let phoneNumber = rawPhoneNumber.trim();
    if (!phoneNumber.startsWith('+')) {
      if (/^[6-9]\d{9}$/.test(phoneNumber)) {
        phoneNumber = '+91' + phoneNumber;
      }
    }

    const storedEmailOtp = cache.get(email);
    const storedPhoneOtp = cache.get(phoneNumber);

    if (storedEmailOtp === emailOtp && storedPhoneOtp === phoneOtp) {
      cache.del(email);
      cache.del(phoneNumber);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({
      error: 'Invalid or expired OTP(s)',
    }, { status: 400 });
  } catch (err: any) {
    console.error('VERIFY OTP ERROR:', err);
    return NextResponse.json({
      error: 'Server error while verifying OTP(s)',
    }, { status: 500 });
  }
}