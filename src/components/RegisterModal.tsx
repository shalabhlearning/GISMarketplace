'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

type UserRole = 'buyer' | 'provider' | 'admin';

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

const PLATFORM_SKILLS = [
  'GIS Mapping',
  'Geospatial Consulting',
  'LiDAR Processing',
  'LiDAR Classification',
  'Photogrammetry',
  'Remote Sensing',
  'Spatial Data Analysis',
  'UAV Mapping',
  'Terrain Analysis',
  '3D City Modeling',
  '3D Modeling',
  'BIM Integration',
  'Digital Elevation Models',
  'Satellite Image Processing',
];

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

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [dummyEmail, setDummyEmail] = useState(false);
  const [dummyPhone, setDummyPhone] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
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
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (formData.role !== 'provider') setSelectedSkills([]);
  }, [formData.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
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
    if (formData.role === 'provider' && selectedSkills.length === 0) {
      setMessage('Please select at least one skill or service');
      setLoading(false);
      return;
    }

    try {
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
    } catch {
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

      const registerPayload = {
        userType: formData.role,
        email: trimmedEmail,
        phoneNumber: trimmedPhone,
        password: formData.password,
        organizationName: formData.businessName,
        skills: formData.role === 'provider' ? selectedSkills : undefined,
        hourlyRate: formData.role === 'provider' ? formData.hourlyRate : undefined,
        experienceYears: formData.role === 'provider' ? formData.experienceYears : undefined,
        portfolioUrl: formData.role === 'provider' ? formData.portfolioUrl : undefined,
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
        }, 1500);
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
    setShowOtp(false);
    setEmailOtp('');
    setPhoneOtp('');
    setMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="px-8 py-7 max-h-[92vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-semibold text-foreground">
              {showOtp ? 'Verify OTP' : 'Create Account'}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-3xl leading-none"
            >
              <X size={24} />
            </button>
          </div>

          {!showOtp ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  REGISTER AS
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                >
                  <option value="buyer">Buyer</option>
                  <option value="provider">Service Provider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Organization Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Your company or organization"
                  className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Password <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                  minLength={8}
                  required
                />
              </div>

              {formData.role === 'provider' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Hourly Rate ($)</label>
                      <input
                        type="number"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        placeholder="85.00"
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Experience (years)</label>
                      <input
                        type="number"
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        placeholder="5"
                        min="0"
                        className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Portfolio URL</label>
                    <input
                      type="url"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                      className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                      Services & Skills <span className="text-destructive">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select all that apply — this determines which RFPs you'll be matched to
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {PLATFORM_SKILLS.map(skill => {
                        const selected = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              selected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border text-muted-foreground hover:border-primary hover:text-foreground'
                            }`}
                          >
                            {selected && <Check className="w-3 h-3" />}
                            {skill}
                          </button>
                        );
                      })}
                    </div>

                    {selectedSkills.length > 0 && (
                      <p className="text-xs text-primary mt-2 font-medium">
                        {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    id="dummyEmail"
                    checked={dummyEmail}
                    onChange={(e) => setDummyEmail(e.target.checked)}
                  />
                  <label htmlFor="dummyEmail" className="text-sm">Dummy Email (Dev: No real email OTP)</label>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    id="dummyPhone"
                    checked={dummyPhone}
                    onChange={(e) => setDummyPhone(e.target.checked)}
                  />
                  <label htmlFor="dummyPhone" className="text-sm">Dummy Phone (Dev: No real SMS OTP)</label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-semibold bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-70"
              >
                {loading ? 'Sending OTPs...' : 'Continue →'}
              </button>
            </form>
          ) : (
            <>
              <button
                onClick={handleBackToRegistration}
                className="text-primary hover:text-primary/80 text-sm font-medium mb-4 flex items-center gap-1"
              >
                ← Back to Registration
              </button>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <p className="text-sm text-muted-foreground text-center">
                  We sent separate OTPs to your email and phone number.
                </p>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email OTP</label>
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.trim())}
                    placeholder="Enter email OTP"
                    className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                    autoFocus
                  />
                  {dummyEmail && <p className="text-xs text-green-600 mt-1">Dummy mode: Try 77777</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone OTP</label>
                  <input
                    type="text"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.trim())}
                    placeholder="Enter phone OTP"
                    className="w-full px-4 py-3 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                  />
                  {dummyPhone && <p className="text-xs text-green-600 mt-1">Dummy mode: Try 77777</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-sm font-semibold bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-70"
                >
                  {loading ? 'Verifying...' : 'Verify & Register'}
                </button>
              </form>
            </>
          )}

          {message && (
            <p
              className={`mt-4 text-sm text-center p-3 rounded-2xl font-medium ${
                message.toLowerCase().includes('success') || message.includes('sent')
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {message}
            </p>
          )}

          {!showOtp && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-primary font-medium hover:underline"
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