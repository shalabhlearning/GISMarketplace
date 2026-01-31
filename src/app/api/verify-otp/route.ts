import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

const globalAny: any = global;
const cache = globalAny.otpCache || new NodeCache({ stdTTL: 600 });
if (!globalAny.otpCache) {
  globalAny.otpCache = cache;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('VERIFY OTP - Raw body received:', body);

    const { email: rawEmail, phoneNumber: rawPhoneNumber, emailOtp, phoneOtp } = body;

    if (!rawEmail || !rawPhoneNumber || !emailOtp || !phoneOtp) {
      return NextResponse.json({ error: 'Email, phone number, email OTP, and phone OTP are required' }, { status: 400 });
    }

    const email = rawEmail.trim();

    // Normalize phone same as send-otp
    let phoneNumber = rawPhoneNumber.trim();
    if (!phoneNumber.startsWith('+')) {
      if (/^[6-9]\d{9}$/.test(phoneNumber)) {
        phoneNumber = '+91' + phoneNumber;
      }
    }

    const storedEmailOtp = cache.get(email);
    const storedPhoneOtp = cache.get(phoneNumber);

    console.log('VERIFY OTP - Stored Email OTP:', storedEmailOtp);
    console.log('VERIFY OTP - Stored Phone OTP:', storedPhoneOtp);
    console.log('VERIFY OTP - Received Email OTP:', emailOtp);
    console.log('VERIFY OTP - Received Phone OTP:', phoneOtp);

    if (storedEmailOtp === emailOtp && storedPhoneOtp === phoneOtp) {
      console.log('VERIFY OTP - BOTH OTPS MATCHED → SUCCESS');
      cache.del(email);
      cache.del(phoneNumber);
      return NextResponse.json({ success: true });
    } else {
      console.log('VERIFY OTP - ONE OR BOTH OTPS INVALID or expired');
      return NextResponse.json({ error: 'Invalid or expired OTP(s)' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('VERIFY OTP ROUTE CRASHED:', err);
    return NextResponse.json(
      { error: 'Server error while verifying OTP(s). Please try again.' },
      { status: 500 }
    );
  }
}