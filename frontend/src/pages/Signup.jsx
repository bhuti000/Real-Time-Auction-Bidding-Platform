import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Gavel, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractApiError, api } from '../lib/api';

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.fullName || !form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        email: form.email.trim(),
        password: form.password,
        full_name: form.fullName.trim(),
      });

      // Auto-login after registration
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      
      navigate('/dashboard');
    } catch (err) {
      setError(extractApiError(err, 'Registration failed. Please check your details and password policy (8+ chars, upper, lower, number, special).'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex font-body">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-dim flex-col justify-between p-16 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3">
          <Gavel size={26} strokeWidth={2} />
          <span className="text-lg font-headline font-bold tracking-tight">
            The Curated Exchange
          </span>
        </div>

        <div className="relative flex flex-col gap-6">
          <h1 className="text-4xl font-headline font-extrabold leading-tight max-w-sm">
            Join the World's Most Elite Collectors
          </h1>
          <p className="text-white/75 font-body text-base leading-relaxed max-w-xs">
            Create an account to start bidding on verified, premium assets from across the globe.
          </p>
          <div className="flex gap-4 mt-2">
            {['Global Access', 'Buyer Protection', 'Real-time Alerts'].map((badge) => (
              <div
                key={badge}
                className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-xs font-semibold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" />
                {badge}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/40 text-sm">
          © 2024 The Curated Exchange. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-12">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Gavel size={22} className="text-primary" />
            <span className="text-lg font-headline font-bold text-primary">
              The Curated Exchange
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-2">
              Create Account
            </h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Join our community of discerning collectors today.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-error text-sm font-body leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 px-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
                  <User size={18} />
                </span>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-surface-container-highest bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition text-sm font-medium"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 px-1">
                Email address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-surface-container-highest bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition text-sm font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 px-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
                    <Lock size={18} />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full h-12 pl-12 pr-11 rounded-xl border border-surface-container-highest bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 px-1">
                  Confirm
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
                    <Lock size={18} />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-surface-container-highest bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-br from-primary to-primary-dim text-white font-headline font-bold rounded-xl hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-premium text-base mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-on-surface-variant font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary font-bold hover:text-primary-dim transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
