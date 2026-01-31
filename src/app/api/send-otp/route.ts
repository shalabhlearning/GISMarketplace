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

    // Normalize phone number (assume Indian if 10 digits starting with 6-9)
    let phoneNumber = rawPhoneNumber.trim();
    if (!phoneNumber.startsWith('+')) {
      if (/^[6-9]\d{9}$/.test(phoneNumber)) {
        phoneNumber = '+91' + phoneNumber;
        console.log('SEND OTP - Normalized phone to E.164:', phoneNumber);
      } else {
        return NextResponse.json({ error: 'Invalid phone number format. Use 10-digit Indian number or full E.164 (+91...)' }, { status: 400 });
      }
    }

    // Generate separate OTPs
    const emailOtp = dummyEmail ? '77777' : Math.floor(1000 + Math.random() * 9000).toString();
    const phoneOtp = dummyPhone ? '77777' : Math.floor(1000 + Math.random() * 9000).toString();

    console.log('SEND OTP - Email OTP:', emailOtp, '(dummy:', dummyEmail, ')');
    console.log('SEND OTP - Phone OTP:', phoneOtp, '(dummy:', dummyPhone, ')');

    // Store both OTPs separately
    cache.set(email, emailOtp);
    cache.set(phoneNumber, phoneOtp);

    // Send to email if not dummy
    if (!dummyEmail) {
      console.log('SEND OTP - Sending email OTP to:', email);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
      });
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Your Email Verification OTP',
        text: `Your EMAIL verification OTP is ${emailOtp}. Valid for 10 minutes.\n\nDo not share this code.`,
      });
      console.log('SEND OTP - Email sent successfully');
    } else {
      console.log('SEND OTP - Skipping email send (dummyEmail=true)');
    }

    // Send to phone if not dummy
    if (!dummyPhone) {
      console.log('SEND OTP - Sending SMS OTP to:', phoneNumber);
      await twilioClient.messages.create({
        body: `Your PHONE verification OTP is ${phoneOtp}. Valid for 10 minutes.\nDo not share this code.`,
        from: process.env.TWILIO_PHONE,
        to: phoneNumber,
      });
      console.log('SEND OTP - SMS sent successfully');
    } else {
      console.log('SEND OTP - Skipping SMS (dummyPhone=true)');
    }

    return NextResponse.json({ success: true, message: 'OTPs sent successfully' });
  } catch (err: any) {
    console.error('SEND OTP ROUTE CRASHED:', err);
    return NextResponse.json({ error: 'Failed to send OTP(s)' }, { status: 500 });
  }
}