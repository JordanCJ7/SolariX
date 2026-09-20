import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (user?.role === 'Backoffice') return '/backoffice/dashboard';
    if (user?.role === 'GridOperator') return '/operator/dashboard';
    return '/';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-rose-500/30 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-white">403 - Access Denied</h2>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          Your current role (<span className="text-amber-400 font-bold">{user?.role || 'Guest'}</span>) does not have authorization to view this administrative resource.
        </p>

        <div className="mt-8 flex items-center justify-center space-x-3">
          <Link
            to={getDashboardLink()}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 solar-gradient hover:opacity-90 transition-opacity shadow-lg"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
