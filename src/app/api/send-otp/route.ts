// src/app/api/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import NodeCache from 'node-cache';

const globalAny: any = global;
const cache = globalAny.otpCache || new NodeCache({ stdTTL: 600 });

if (!globalAny.otpCache) {
  globalAny.otpCache = cache;
}

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, phoneNumber: rawPhoneNumber, dummyEmail = false, dummyPhone = false } = await req.json();

    if (!rawEmail || !rawPhoneNumber) {
      return NextResponse.json({ error: 'Email and phone number are required' }, { status: 400 });
    }

    const email = rawEmail.trim();

    let phoneNumber = rawPhoneNumber.trim();
    if (!phoneNumber.startsWith('+')) {
      if (/^[6-9]\d{9}$/.test(phoneNumber)) {
        phoneNumber = '+91' + phoneNumber;
      } else {
        return NextResponse.json({
          error: 'Invalid phone number format. Use 10-digit Indian number or full E.164 (+91...)',
        }, { status: 400 });
      }
    }

    const emailOtp = dummyEmail ? '77777' : Math.floor(1000 + Math.random() * 9000).toString();
    const phoneOtp = dummyPhone ? '77777' : Math.floor(1000 + Math.random() * 9000).toString();

    cache.set(email, emailOtp);
    cache.set(phoneNumber, phoneOtp);

    // Send Email OTP
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

    // Send SMS OTP
    if (!dummyPhone) {
      await twilioClient.messages.create({
        body: `Your PHONE OTP is ${phoneOtp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE,
        to: phoneNumber,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'OTPs sent successfully',
    });
  } catch (err: any) {
    console.error('SEND OTP ERROR:', err);
    return NextResponse.json({ error: 'Failed to send OTP(s)' }, { status: 500 });
  }
}