'use client';

import { useState, useEffect, useRef } from 'react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

type UserRole = 'buyer' | 'provider';

interface FormData {
  role: UserRole;
  businessName: string;
  email: string;
  phoneNumber: string;
  password: string;
  hourlyRate: string;
  experienceYears: string;
  portfolioUrl: string;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState<FormData>({
    role: 'buyer',
    businessName: '',
    email: '',
    phoneNumber: '',
    password: '',
    hourlyRate: '',
    experienceYears: '',
    portfolioUrl: '',
  });

  const [dummyEmail, setDummyEmail] = useState(false);
  const [dummyPhone, setDummyPhone] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phoneNumber.trim();

    if (!formData.businessName.trim()) {
      setMessage('Organization name is required');
      setLoading(false);
      return;
    }
    if (!trimmedEmail || !trimmedPhone) {
      setMessage('Both email and phone number are required');
      setLoading(false);
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setMessage('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Check if user exists
      const checkRes = await fetch('/api/check-user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, phoneNumber: trimmedPhone }),
      });

      if (!checkRes.ok) {
        const data = await checkRes.json();
        setMessage(data.error || 'User already exists');
        setLoading(false);
        return;
      }

      // Step 2: Send OTPs
      const otpRes = await fetch('/api/send-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          phoneNumber: trimmedPhone,
          dummyEmail,
          dummyPhone,
        }),
      });

      if (!otpRes.ok) {
        const data = await otpRes.json();
        setMessage(data.error || 'Failed to send OTPs');
        setLoading(false);
        return;
      }

      setShowOtp(true);
      setMessage('OTPs sent successfully! Check your email and phone.');
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!emailOtp.trim() || !phoneOtp.trim()) {
      setMessage('Both OTPs are required');
      setLoading(false);
      return;
    }

    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phoneNumber.trim();

    try {
      // Verify OTPs
      const verifyRes = await fetch('/api/verify-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          phoneNumber: trimmedPhone,
          emailOtp: emailOtp.trim(),
          phoneOtp: phoneOtp.trim(),
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setMessage(data.error || 'Invalid OTP(s)');
        setLoading(false);
        return;
      }

      // Register user
      const registerPayload = {
        userType: formData.role,
        email: trimmedEmail,
        phoneNumber: trimmedPhone,
        password: formData.password,
        organizationName: formData.businessName,
        hourlyRate: formData.role === 'provider' ? formData.hourlyRate : undefined,
        experienceYears: formData.role === 'provider' ? formData.experienceYears : undefined,
        portfolioUrl: formData.role === 'provider' ? formData.portfolioUrl : undefined,
        dummyEmail,
        dummyPhone,
      };

      const registerRes = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerPayload),
      });

      const registerData = await registerRes.json();

      if (registerRes.ok) {
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          onClose();
          onSwitchToLogin();
        }, 2000);
      } else {
        setMessage(registerData.error || 'Registration failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRegistration = () => {
    setShowOtp(false);
    setEmailOtp('');
    setPhoneOtp('');
    setMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {showOtp ? 'Verify OTP' : 'Create Account'}
            </h2>
            <button
              onClick={onClose}
              className="text-2xl text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>

          {!showOtp ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">REGISTER AS</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm border text-gray-500 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="buyer">Buyer</option>
                  <option value="provider">Service Provider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Your company or organization"
                  className="w-full px-4 py-3 text-sm border text-gray-500 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-3 text-sm border text-gray-500 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  className="w-full px-4 py-3 text-sm border text-gray-500 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 text-sm border text-gray-500 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  minLength={8}
                  required
                />
              </div>

              {formData.role === 'provider' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Hourly Rate ($)</label>
                      <input
                        type="number"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        placeholder="85.00"
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 text-sm border text-gray-500 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Experience (years)</label>
                      <input
                        type="number"
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        placeholder="5"
                        min="0"
                        className="w-full px-4 py-3 text-sm border text-gray-500 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Portfolio URL</label>
                    <input
                      type="url"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                      className="w-full px-4 py-3 text-sm border text-gray-500 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </>
              )}

              {/* Dummy Mode Checkboxes - Dev Only */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center text-gray-500 gap-2">
                  <input
                    type="checkbox"
                    id="dummyEmail"
                    checked={dummyEmail}
                    onChange={(e) => setDummyEmail(e.target.checked)}
                  />
                  <label htmlFor="dummyEmail" className="text-sm text-gray-600">
                    Dummy Email (Dev: No real email OTP)
                  </label>
                </div>
                <div className="flex items-center text-gray-500 gap-2">
                  <input
                    type="checkbox"
                    id="dummyPhone"
                    checked={dummyPhone}
                    onChange={(e) => setDummyPhone(e.target.checked)}
                  />
                  <label htmlFor="dummyPhone" className="text-sm text-gray-600">
                    Dummy Phone (Dev: No real SMS OTP)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTPs...' : 'Continue →'}
              </button>
            </form>
          ) : (
            // OTP Verification Form
            <>
              <button
                onClick={handleBackToRegistration}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 flex items-center gap-1"
              >
                ← Back to Registration
              </button>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <p className="text-sm text-gray-600 text-center">
                  We sent separate OTPs to your email and phone number.
                </p>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email OTP</label>
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.trim())}
                    placeholder="Enter email OTP"
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                  {dummyEmail && <p className="text-xs text-green-600 mt-1">Dummy mode: Try 77777</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone OTP</label>
                  <input
                    type="text"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.trim())}
                    placeholder="Enter phone OTP"
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {dummyPhone && <p className="text-xs text-green-600 mt-1">Dummy mode: Try 77777</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Register'}
                </button>
              </form>
            </>
          )}

          {message && (
            <p
              className={`mt-4 text-sm text-center p-3 rounded-xl font-medium ${
                message.includes('successful') || message.includes('sent')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message}
            </p>
          )}

          {!showOtp && (
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 