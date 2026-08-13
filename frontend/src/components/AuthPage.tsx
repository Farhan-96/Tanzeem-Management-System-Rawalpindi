import React, { useState } from 'react';
import { BookOpen, Lock, Mail, User, Building2, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiUrl } from '../api/baseUrl';
import { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const { hasRegisteredUsers, login, register, authLoading } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(hasRegisteredUsers ? 'login' : 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Central Administration');
  const [role, setRole] = useState<UserRole>('Secretary');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);
  const userChoseMode = React.useRef(false);

  // Prefer register when no accounts exist yet (unless user already switched tabs)
  React.useEffect(() => {
    if (!userChoseMode.current) {
      setMode(hasRegisteredUsers ? 'login' : 'register');
    }
  }, [hasRegisteredUsers]);

  React.useEffect(() => {
    let cancelled = false;
    const checkApi = async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/status'));
        if (!cancelled) setApiOffline(!res.ok);
      } catch {
        if (!cancelled) setApiOffline(true);
      }
    };
    checkApi();
    const id = window.setInterval(checkApi, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result =
        mode === 'login'
          ? await login(email, password)
          : await register({ name, email, password, role, department });
      if (!result.success) {
        setError(result.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F5] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#003822_0%,_transparent_55%)] opacity-[0.08] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#003822] border border-amber-500/40 flex items-center justify-center text-amber-400 text-3xl font-serif shadow-lg mb-4">
            ت
          </div>
          <h1 className="text-2xl font-bold text-[#003822] font-serif tracking-tight">
            Tanzeem Office & Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {hasRegisteredUsers
              ? 'Sign in to continue to the management system'
              : 'No account found — create the first admin account'}
          </p>
        </div>

        <div className="bg-white border border-emerald-900/10 rounded-2xl shadow-xl shadow-emerald-950/5 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                userChoseMode.current = true;
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                mode === 'login'
                  ? 'text-[#003822] border-b-2 border-amber-500 bg-emerald-50/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                userChoseMode.current = true;
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                mode === 'register'
                  ? 'text-[#003822] border-b-2 border-amber-500 bg-emerald-50/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {apiOffline && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-3 text-xs text-red-800">
                API is unavailable. Locally run <code className="font-mono font-semibold">npm run server</code>. On Vercel, confirm the API deployed and <code className="font-mono font-semibold">MONGODB_URI</code> is set.
              </div>
            )}

            {!hasRegisteredUsers && mode === 'register' && (
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3 text-xs text-amber-900">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  First registered account becomes <strong>Admin</strong> and unlocks the full system.
                </p>
              </div>
            )}

            {mode === 'register' && (
              <>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name</span>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700"
                      placeholder="Muhammad Farhan"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Department</span>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700"
                      placeholder="Central Administration"
                    />
                  </div>
                </label>

                {hasRegisteredUsers && (
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Role</span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 bg-white"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Secretary">Secretary</option>
                      <option value="Finance Admin">Finance Admin</option>
                    </select>
                  </label>
                )}
              </>
            )}

            <label className="block">
              <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700"
                  placeholder="admin@tanzeem.org"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700"
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || authLoading}
              className="w-full rounded-xl bg-[#003822] hover:bg-[#002B1A] text-white font-semibold py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {(submitting || authLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5 flex items-center justify-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Secure access to inventory, sales & office records
        </p>
      </div>
    </div>
  );
};
