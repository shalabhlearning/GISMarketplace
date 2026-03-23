import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userType,
      email: rawEmail,
      phoneNumber: rawPhoneNumber,
      password,
      organizationName,
      hourlyRate,
      experienceYears,
      portfolioUrl,
      dummyEmail = false,
      dummyPhone = false,
    } = req.body;

    const isFullDummy = dummyEmail && dummyPhone;

    if (!isFullDummy) {
      if (!userType || !rawEmail || !rawPhoneNumber || !password) {
        return res.status(400).json({
          error: 'User type, email, phone number, and password are required',
        });
      }

      if (!['buyer', 'provider'].includes(userType)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
    }

    const email = rawEmail?.trim() || '';
    const phoneNumber = rawPhoneNumber?.trim() || '';

    if (!email || !phoneNumber) {
      return res.status(400).json({
        error: 'Both email and phone number must be provided',
      });
    }

    if (!dummyEmail) {
      const existing = await query('SELECT user_id FROM user WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    if (!dummyPhone) {
      const existing = await query('SELECT user_id FROM user WHERE phone_number = ?', [phoneNumber]);
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Phone number already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = randomUUID();

    await query(
      'INSERT INTO user (user_id, email, phone_number, password_hash, user_type, status) VALUES (?, ?, ?, ?, ?, "active")',
      [userId, email, phoneNumber, hashedPassword, userType]
    );

    if (userType === 'provider') {
      await query(
        `INSERT INTO providerprofile (
          provider_id, organization_name, hourly_rate, experience_years, 
          portfolio_url, subscription_status, rating
        ) VALUES (?, ?, ?, ?, ?, 'none', 0.0)`,
        [
          userId,
          organizationName || null,
          hourlyRate ? parseFloat(hourlyRate) : null,
          experienceYears ? parseInt(experienceYears) : null,
          portfolioUrl || null,
        ]
      );

      await query(
        `INSERT INTO creditledger (id, provider_id, credits, type, reason) 
         VALUES (?, ?, 100, 'credit', 'Initial credits')`,
        [randomUUID(), userId]
      );
    }

    if (userType === 'buyer') {
      await query(
        'INSERT INTO buyerprofile (buyer_id, organization_name, rating) VALUES (?, ?, 0.0)',
        [userId, organizationName || null]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Account created successfully!',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: error.message || 'Registration failed',
    });
  }
}