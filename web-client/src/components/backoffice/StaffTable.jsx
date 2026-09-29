import React, { useState } from 'react';
import { Search, Shield, Zap, RefreshCw, UserCheck, ShieldAlert } from 'lucide-react';

const StaffTable = ({
  staff = [],
  loading = false,
  onDeactivate,
  onReactivate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = staff.filter((s) => {
    const matchesSearch =
      s.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (roleFilter === 'ALL') return matchesSearch;
    return matchesSearch && s.role === roleFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            Active
          </span>
        );
      case 'Deactivated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
            Deactivated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Backoffice':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span>Backoffice Admin</span>
          </span>
        );
      case 'GridOperator':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
            <Zap className="w-3.5 h-3.5" />
            <span>Grid Operator</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Staff Members
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage Grid Operators and Backoffice administrators.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by NIC, name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 w-64 transition-all"
            />
          </div>

          <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({staff.length})
            </button>
            <button
              onClick={() => setRoleFilter('Backoffice')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleFilter === 'Backoffice'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Backoffice
            </button>
            <button
              onClick={() => setRoleFilter('GridOperator')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleFilter === 'GridOperator'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid Operator
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">NIC</th>
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-400">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Loading staff members...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-500">
                  No staff members found matching current filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.nic} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400 tracking-wider">
                    {s.nic}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {s.fullName}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-200">{s.email}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{s.phoneNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {getRoleBadge(s.role)}
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {s.status === 'Active' && (
                        <button
                          onClick={() => onDeactivate(s.nic)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
                        </button>
                      )}

                      {s.status === 'Deactivated' && (
                        <button
                          onClick={() => onReactivate(s.nic)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Reactivate</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffTable;
