// src/components/RegisterModal.tsx
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
  businessName: string; // Now always required
  identifier: string;
  password: string;
  hourlyRate: string;
  experienceYears: string;
  portfolioUrl: string;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState<FormData>({
    role: 'buyer',
    businessName: '',
    identifier: '',
    password: '',
    hourlyRate: '',
    experienceYears: '',
    portfolioUrl: '',
  });

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Business name is now always required
    if (!formData.businessName.trim()) {
      setMessage('Organization name is required');
      setLoading(false);
      return;
    }

    // Require identifier
    if (!formData.identifier.trim()) {
      setMessage('Provide an email or phone number');
      setLoading(false);
      return;
    }

    const payload: {
      userType: UserRole;
      identifier: string;
      password: string;
      organizationName: string;
      hourlyRate?: string;
      experienceYears?: string;
      portfolioUrl?: string;
    } = {
      userType: formData.role,
      identifier: formData.identifier.trim(),
      password: formData.password,
      organizationName: formData.businessName.trim(),
    };

    if (formData.role === 'provider') {
      payload.hourlyRate = formData.hourlyRate;
      payload.experienceYears = formData.experienceYears;
      payload.portfolioUrl = formData.portfolioUrl;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Registration successful! You can now log in.');
        setTimeout(() => {
          onClose();
          onSwitchToLogin();
        }, 2000);
      } else {
        setMessage(data.error || 'Registration failed. Try again.');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-2xl">
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 text-center w-full">Register</h2>
            <button onClick={onClose} className="p-1 text-xl text-gray-400 hover:text-gray-600">×</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Register as</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
              >
                <option value="buyer">Buyer</option>
                <option value="provider">Service Provider</option>
              </select>
            </div>

            {/* Always show Business Name */}
            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Your company or organization"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Email or Phone Number</label>
              <input
                type="text"
                name="identifier"
                required
                value={formData.identifier}
                onChange={handleChange}
                placeholder="contact@example.com or +1234567890"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
              />
            </div>

            {formData.role === 'provider' && (
              <>
                <div>
                  <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Hourly Rate ($)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    required
                    step="0.01"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    placeholder="85.00"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Experience (yrs)</label>
                    <input
                      type="number"
                      name="experienceYears"
                      min="0"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      placeholder="8"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-medium text-gray-700 uppercase">Portfolio</label>
                    <input
                      type="url"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      placeholder="your-site.com"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white uppercase rounded-xl bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {message && (
            <p className={`mt-4 text-xs font-medium text-center p-2 rounded-lg ${message.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
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