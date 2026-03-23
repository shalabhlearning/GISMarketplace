'use client';

import { useState } from 'react';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: any) {
  const [formData, setFormData] = useState({
    role: 'buyer',
    businessName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });

  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // check user
      const check = await fetch('/api/check-user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        }),
      });

      if (!check.ok) {
        const d = await check.json();
        setMessage(d.error);
        return;
      }

      // send otp
      await fetch('/api/send-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setShowOtp(true);
      setMessage('OTP sent!');
    } catch {
      setMessage('Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const verify = await fetch('/api/verify-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          emailOtp,
          phoneOtp,
        }),
      });

      if (!verify.ok) {
        setMessage('Invalid OTP');
        return;
      }

      const register = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: formData.role,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          organizationName: formData.businessName,
        }),
      });

      if (register.ok) {
        setMessage('Registered successfully!');
        setTimeout(() => {
          onSwitchToLogin();
        }, 1500);
      }
    } catch {
      setMessage('Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-xl w-96">
        {!showOtp ? (
          <form onSubmit={handleRegister}>
            <input
              placeholder="Business Name"
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              className="w-full p-2 mb-2 border"
            />

            <input
              placeholder="Email"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-2 mb-2 border"
            />

            <input
              placeholder="Phone"
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              className="w-full p-2 mb-2 border"
            />

            <input
              type="password"
              placeholder="Password"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full p-2 mb-2 border"
            />

            <button className="w-full bg-blue-600 text-white p-2">
              {loading ? 'Sending OTP...' : 'Register'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <input
              placeholder="Email OTP"
              onChange={(e) => setEmailOtp(e.target.value)}
              className="w-full p-2 mb-2 border"
            />

            <input
              placeholder="Phone OTP"
              onChange={(e) => setPhoneOtp(e.target.value)}
              className="w-full p-2 mb-2 border"
            />

            <button className="w-full bg-green-600 text-white p-2">
              Verify OTP
            </button>
          </form>
        )}

        {message && <p className="mt-2 text-center">{message}</p>}
      </div>
    </div>
  );
}