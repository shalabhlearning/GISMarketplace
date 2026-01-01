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
  email: string;
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

    const payload: {
      userType: UserRole;
      email: string;
      password: string;
      organizationName: string;
      hourlyRate?: string;
      experienceYears?: string;
      portfolioUrl?: string;
    } = {
      userType: formData.role,
      email: formData.email,
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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100">
        <div className="p-6 max-h-[85vh] overflow-y-auto scrollbar-hidden">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">Register</h2>
            <button onClick={onClose} className="text-xl text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                Register as
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:border-gray-300"
              >
                <option value="buyer">Buyer</option>
                <option value="provider">Service Provider</option>
              </select>
            </div>

            {/* Always show Business Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Your company or organization"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:border-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@example.com"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:border-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:border-gray-300"
              />
            </div>

            {formData.role === 'provider' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    required
                    step="0.01"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    placeholder="85.00"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                      Experience (yrs)
                    </label>
                    <input
                      type="number"
                      name="experienceYears"
                      min="0"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      placeholder="8"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                      Portfolio
                    </label>
                    <input
                      type="url"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      placeholder="your-site.com"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {message && (
            <p className={`text-center mt-4 text-xs font-medium px-3 py-2 rounded-lg ${message.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </p>
          )}

          <p className="text-center mt-4 text-xs text-gray-600">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}