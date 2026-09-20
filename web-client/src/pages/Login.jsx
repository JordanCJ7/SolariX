import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Lock, User, AlertCircle, ArrowRight, Shield, Zap } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const user = await login(identifier, password);
      // Route based on role
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'Backoffice') {
        navigate('/backoffice/dashboard', { replace: true });
      } else if (user.role === 'GridOperator') {
        navigate('/operator/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  // Quick fill helper for evaluation and testing
  const setQuickCredentials = (id, pass) => {
    setIdentifier(id);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Top Glow Accent */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/15 blur-2xl rounded-full pointer-events-none" />

          {/* Logo & Header */}
          <div className="text-center">
            <div className="inline-flex w-12 h-12 rounded-2xl solar-gradient items-center justify-center shadow-lg mb-4">
              <Sun className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Portal Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">
              Sign in to access Backoffice or Grid Operator operational tools.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                NIC or Email Address
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin@solarix.com or BO1000000001"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/70 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/70 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl font-bold text-slate-950 solar-gradient hover:opacity-95 transition-opacity flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 text-sm"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Login Test Accounts for Examination Demo */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-400 mb-3 text-center uppercase tracking-wider">
              Quick Test Credentials (Pre-Seeded)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuickCredentials('admin@solarix.com', 'Admin@123456')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-colors"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Backoffice</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                  admin@solarix.com
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('operator@solarix.com', 'Operator@123456')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Grid Operator</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                  operator@solarix.com
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
