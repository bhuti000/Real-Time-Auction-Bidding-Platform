import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Gavel } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const loggedInUser = await login({
        email: form.email.trim(),
        password: form.password,
      });
      navigate(loggedInUser?.is_admin ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
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
            The World's Most Trusted Premium Auction Platform
          </h1>
          <p className="text-white/75 font-body text-base leading-relaxed max-w-xs">
            Transparent bidding. Verified authenticity. Exceptional items awaiting discerning
            collectors.
          </p>
          {/* Trust badges */}
          <div className="flex gap-4 mt-2">
            {['Verified Sellers', 'Secure Payments', 'Live Support'].map((badge) => (
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Gavel size={22} className="text-primary" />
            <span className="text-lg font-headline font-bold text-primary">
              The Curated Exchange
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-2">
              Welcome back
            </h2>
            <p className="text-on-surface-variant text-sm">
              Sign in to continue bidding on exclusive items.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-error text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-xl border border-surface-container-highest bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-on-surface"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-primary hover:text-primary-dim transition-colors font-semibold"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-surface-container-highest bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-br from-primary to-primary-dim text-white font-headline font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shadow-premium text-base mt-1"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-primary font-semibold hover:text-primary-dim transition-colors"
            >
              Sign up
            </Link>
          </p>

          <div className="mt-8 p-4 bg-surface-container-low rounded-xl text-center">
            <p className="text-xs text-on-surface-variant">
              Admin access is managed server-side by policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
