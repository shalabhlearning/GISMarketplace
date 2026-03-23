import type { NextApiRequest, NextApiResponse } from 'next';
import NodeCache from 'node-cache';

const globalAny: any = global;
const cache = globalAny.otpCache || new NodeCache({ stdTTL: 600 });

if (!globalAny.otpCache) {
  globalAny.otpCache = cache;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email: rawEmail, phoneNumber: rawPhoneNumber, emailOtp, phoneOtp } = req.body;

    if (!rawEmail || !rawPhoneNumber || !emailOtp || !phoneOtp) {
      return res.status(400).json({
        error: 'Email, phone number, email OTP, and phone OTP are required',
      });
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

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({
      error: 'Invalid or expired OTP(s)',
    });
  } catch (err: any) {
    console.error('VERIFY OTP ERROR:', err);
    return res.status(500).json({
      error: 'Server error while verifying OTP(s)',
    });
  }
}