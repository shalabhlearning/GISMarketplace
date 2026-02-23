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
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!formData.businessName.trim()) {
      setMessage('Organization name is required');
      setLoading(false);
      return;
    }

    if (!formData.email.trim() || !formData.phoneNumber.trim()) {
      setMessage('Both email and phone number are required');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setMessage('Password is required');
      setLoading(false);
      return;
    }

    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phoneNumber.trim();

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, phoneNumber: trimmedPhone, dummyEmail, dummyPhone }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed to send OTP(s)');
        setLoading(false);
        return;
      }

      setShowOtpModal(true);
      setMessage('OTPs sent! Check your email and phone.');
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          phoneNumber: trimmedPhone,
          emailOtp,
          phoneOtp,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Invalid OTP(s)');
        setLoading(false);
        return;
      }

      // OTPs valid → complete registration
      const registerPayload = {
        userType: formData.role,
        email: trimmedEmail,
        phoneNumber: trimmedPhone,
        password: formData.password,
        organizationName: formData.businessName,
        hourlyRate: formData.hourlyRate,
        experienceYears: formData.experienceYears,
        portfolioUrl: formData.portfolioUrl,
        dummyEmail,
        dummyPhone,
      };

      console.log('REGISTER PAYLOAD BEING SENT:', registerPayload);

      const registerRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerPayload),
      });

      const registerData = await registerRes.json();

      if (registerRes.ok) {
        setMessage('Registration successful! You can now log in.');
        setShowOtpModal(false);
        setTimeout(() => {
          onClose();
          onSwitchToLogin();
        }, 2000);
      } else {
        setMessage(registerData.error || 'Registration failed');
      }
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRegistration = () => {
    setShowOtpModal(false);
    setEmailOtp('');
    setPhoneOtp('');
    setMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-2xl">
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 text-center w-full">
              {showOtpModal ? 'Verify OTPs' : 'Register'}
            </h2>
            <button onClick={onClose} className="p-1 text-xl text-gray-400 hover:text-gray-600">×</button>
          </div>

          {!showOtpModal ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Register as</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black">
                  <option value="buyer">Buyer</option>
                  <option value="provider">Service Provider</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input type="text" name="businessName" required value={formData.businessName} onChange={handleChange} placeholder="Your company or organization" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black" />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">
                  Email <span className="text-red-500">*</span>
                </label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="contact@example.com" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black" />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input type="text" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} placeholder="+919876543210" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black" />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Password</label>
                <input type="password" name="password" required minLength={8} value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black" />
              </div>

              {formData.role === 'provider' && (
                <>
                  <div>
                    <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Hourly Rate ($)</label>
                    <input type="number" name="hourlyRate" required step="0.01" min="0" value={formData.hourlyRate} onChange={handleChange} placeholder="85.00" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Experience (yrs)</label>
                      <input type="number" name="experienceYears" min="0" value={formData.experienceYears} onChange={handleChange} placeholder="8" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Portfolio</label>
                      <input type="url" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleChange} placeholder="your-site.com" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="dummyEmail" checked={dummyEmail} onChange={(e) => setDummyEmail(e.target.checked)} />
                  <label htmlFor="dummyEmail" className="text-sm text-gray-700">Dummy email (no email OTP, dev only)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="dummyPhone" checked={dummyPhone} onChange={(e) => setDummyPhone(e.target.checked)} />
                  <label htmlFor="dummyPhone" className="text-sm text-gray-700">Dummy phone (no SMS OTP, dev only)</label>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 text-sm font-semibold text-white uppercase rounded-xl bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50">
                {loading ? 'Sending OTPs...' : 'Register'}
              </button>
            </form>
          ) : (
            <>
              <div className="mb-5 text-left">
                <button
                  type="button"
                  onClick={handleBackToRegistration}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  ← Change registration details / Resend OTPs
                </button>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <p className="text-xs text-gray-600 text-center mb-4">
                  Separate OTPs have been sent to your email and phone.
                </p>

                <div>
                  <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Email OTP</label>
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.trim())}
                    placeholder="1234"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    autoFocus
                  />
                  {dummyEmail && (
                    <p className="text-xs text-gray-500 mt-1">Dummy mode: use 77777</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Phone OTP</label>
                  <input
                    type="text"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.trim())}
                    placeholder="1234"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  />
                  {dummyPhone && (
                    <p className="text-xs text-gray-500 mt-1">Dummy mode: use 77777</p>
                  )}
                </div>

                <button type="submit" disabled={loading} className="w-full py-3 text-sm font-semibold text-white uppercase rounded-xl bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50">
                  {loading ? 'Verifying...' : 'Verify OTPs'}
                </button>
              </form>
            </>
          )}

          {message && (
            <p className={`mt-4 text-xs font-medium text-center p-2 rounded-lg ${message.includes('successful') || message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </p>
          )}

          <p className="mt-4 text-xs text-center text-gray-600">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-blue-600 hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}