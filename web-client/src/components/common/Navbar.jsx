import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sun, Zap, Shield, Cpu, LogOut, LayoutDashboard, Users, Radio } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isBackoffice, isGridOperator, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl solar-gradient flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <Sun className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                Solari<span className="text-white">X</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
                Microgrid Trading
              </span>
            </div>
          </Link>

          {/* Navigation Links based on Role */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {isBackoffice && (
                <>
                  <Link
                    to="/backoffice/dashboard"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/backoffice/dashboard')
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/backoffice/prosumers"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/backoffice/prosumers')
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Prosumers</span>
                  </Link>
                  <Link
                    to="/backoffice/nodes"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/backoffice/nodes')
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Microgrid Nodes</span>
                  </Link>
                </>
              )}

              {isGridOperator && (
                <>
                  <Link
                    to="/operator/dashboard"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/operator/dashboard')
                        ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Operator Overview</span>
                  </Link>
                  <Link
                    to="/operator/slots"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/operator/slots')
                        ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Radio className="w-4 h-4" />
                    <span>Slots & Bookings</span>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Right Action Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Role Badge */}
                {isBackoffice ? (
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Backoffice Admin</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Grid Operator</span>
                  </div>
                )}

                <span className="hidden sm:inline text-xs text-slate-400 font-mono">
                  {user?.nic}
                </span>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-950 solar-gradient hover:opacity-90 transition-opacity shadow-md"
              >
                <span>Portal Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
