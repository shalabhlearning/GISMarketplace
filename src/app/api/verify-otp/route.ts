import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

// Global singleton cache (survives hot-reload in dev mode)
const globalAny: any = global;
const cache = globalAny.otpCache || new NodeCache({ stdTTL: 600 });
if (!globalAny.otpCache) {
  globalAny.otpCache = cache;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('VERIFY OTP - Raw body received:', body);

    const { identifier, otp, isDummy } = body;

    if (!identifier || !otp) {
      console.log('VERIFY OTP - Missing identifier or otp');
      return NextResponse.json({ error: 'Identifier and OTP are required' }, { status: 400 });
    }

    const trimmedIdentifier = (identifier || '').trim();
    console.log('VERIFY OTP - Trimmed identifier:', trimmedIdentifier);
    console.log('VERIFY OTP - Received OTP:', otp);
    console.log('VERIFY OTP - isDummy:', !!isDummy);

    if (isDummy) {
      console.log('VERIFY OTP - Running in DUMMY mode');
      if (otp === '77777') {
        console.log('VERIFY OTP - Dummy OTP correct → success');
        return NextResponse.json({ success: true });
      } else {
        console.log('VERIFY OTP - Dummy OTP wrong');
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }
    }

    // Get stored OTP
    const storedOtp = cache.get(trimmedIdentifier);

    console.log('VERIFY OTP - Stored OTP from cache:', storedOtp);
    console.log('VERIFY OTP - Cache has key?', cache.has(trimmedIdentifier));

    if (storedOtp === otp) {
      console.log('VERIFY OTP - OTP MATCHED → SUCCESS');
      cache.del(trimmedIdentifier);
      return NextResponse.json({ success: true });
    } else {
      console.log('VERIFY OTP - OTP DID NOT MATCH or expired');
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('VERIFY OTP ROUTE CRASHED:', err);
    console.error('Error stack:', err.stack);
    return NextResponse.json(
      { error: 'Server error while verifying OTP. Please try again.' },
      { status: 500 }
    );
  }
}