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
      email,
      phoneNumber,
      password,
      organizationName,
      hourlyRate,
      experienceYears,
      portfolioUrl,
    } = req.body;

    // ✅ FIX: allow admin
    if (!['buyer', 'provider', 'admin'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (!email || !phoneNumber || !password) {
      return res.status(400).json({
        error: 'Email, phone number, and password are required',
      });
    }

    const cleanEmail = email.trim();
    const cleanPhone = phoneNumber.trim();

    // Check existing
    const existing = await query(
      'SELECT user_id FROM user WHERE email = ? OR phone_number = ?',
      [cleanEmail, cleanPhone]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = randomUUID();

    await query(
      'INSERT INTO user (user_id, email, phone_number, password_hash, user_type, status) VALUES (?, ?, ?, ?, ?, "active")',
      [userId, cleanEmail, cleanPhone, hashedPassword, userType]
    );

    // 👇 Only create profile for buyer/provider
    if (userType === 'buyer') {
      await query(
        'INSERT INTO buyerprofile (buyer_id, organization_name, rating) VALUES (?, ?, 0.0)',
        [userId, organizationName || null]
      );
    }

    if (userType === 'provider') {
      await query(
        `INSERT INTO providerprofile (
          provider_id, organization_name, hourly_rate, experience_years, portfolio_url, subscription_status, rating
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

    // ❌ Admin → no extra table needed

    return res.status(200).json({
      success: true,
      message: 'Account created successfully!',
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      error: 'Registration failed',
    });
  }
}