import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import NodeCache from 'node-cache';

// Global singleton cache (survives hot-reload in dev mode)
const globalAny: any = global;
const cache = globalAny.otpCache || new NodeCache({ stdTTL: 600 });
if (!globalAny.otpCache) {
  globalAny.otpCache = cache;
}

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  try {
    const { identifier, isDummy } = await req.json();

    if (isDummy) {
      console.log('SEND OTP - Dummy mode → skipping real send');
      return NextResponse.json({ success: true });
    }

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
    }

    const trimmedIdentifier = identifier.trim();
    console.log('SEND OTP - Trimmed identifier:', trimmedIdentifier);

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log('SEND OTP - Generated OTP:', otp);

    // Store in cache
    cache.set(trimmedIdentifier, otp);
    console.log('SEND OTP - OTP stored in cache for:', trimmedIdentifier);
    console.log('SEND OTP - Cache now has key?', cache.has(trimmedIdentifier));
    console.log('SEND OTP - Current cached value:', cache.get(trimmedIdentifier));

    if (trimmedIdentifier.includes('@')) {
      console.log('SEND OTP - Sending email OTP to:', trimmedIdentifier);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
      });
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: trimmedIdentifier,
        subject: 'Your OTP Code',
        text: `Your OTP is ${otp}. Valid for 10 minutes.`,
      });
      console.log('SEND OTP - Email sent successfully');
    } else {
      console.log('SEND OTP - Sending SMS OTP to:', trimmedIdentifier);
      await twilioClient.messages.create({
        body: `Your OTP is ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE,
        to: trimmedIdentifier,
      });
      console.log('SEND OTP - SMS sent successfully');
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {
    console.error('SEND OTP ROUTE CRASHED:', err);
    console.error('Error stack:', err.stack);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}