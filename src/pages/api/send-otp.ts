import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import NodeCache from 'node-cache';

const globalAny: any = global;
const cache = globalAny.otpCache || new NodeCache({ stdTTL: 600 });

if (!globalAny.otpCache) {
  globalAny.otpCache = cache;
}

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email: rawEmail, phoneNumber: rawPhoneNumber, dummyEmail = false, dummyPhone = false } = req.body;

    if (!rawEmail || !rawPhoneNumber) {
      return res.status(400).json({ error: 'Email and phone number are required' });
    }

    const email = rawEmail.trim();

    let phoneNumber = rawPhoneNumber.trim();
    if (!phoneNumber.startsWith('+')) {
      if (/^[6-9]\d{9}$/.test(phoneNumber)) {
        phoneNumber = '+91' + phoneNumber;
      } else {
        return res.status(400).json({
          error: 'Invalid phone number format. Use 10-digit Indian number or full E.164 (+91...)',
        });
      }
    }

    const emailOtp = dummyEmail ? '77777' : Math.floor(1000 + Math.random() * 9000).toString();
    const phoneOtp = dummyPhone ? '77777' : Math.floor(1000 + Math.random() * 9000).toString();

    cache.set(email, emailOtp);
    cache.set(phoneNumber, phoneOtp);

    // Email
    if (!dummyEmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Your Email Verification OTP',
        text: `Your EMAIL verification OTP is ${emailOtp}. Valid for 10 minutes.`,
      });
    }

    // SMS
    if (!dummyPhone) {
      await twilioClient.messages.create({
        body: `Your PHONE OTP is ${phoneOtp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE,
        to: phoneNumber,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTPs sent successfully',
    });
  } catch (err: any) {
    console.error('SEND OTP ERROR:', err);
    return res.status(500).json({ error: 'Failed to send OTP(s)' });
  }
}