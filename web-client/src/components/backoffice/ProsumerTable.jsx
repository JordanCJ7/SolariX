import React, { useState } from 'react';
import { Search, CheckCircle, Ban, RefreshCw, UserCheck, ShieldAlert, Zap } from 'lucide-react';

const ProsumerTable = ({
  prosumers = [],
  loading = false,
  onApprove,
  onDeactivate,
  onReactivate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = prosumers.filter((p) => {
    const matchesSearch =
      p.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && p.status === statusFilter;
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
      case 'PendingApproval':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
            Pending Approval
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

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            Registered Prosumers
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage prosumer identities using National Identity Card (NIC) as primary key.
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
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({prosumers.length})
            </button>
            <button
              onClick={() => setStatusFilter('PendingApproval')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'PendingApproval'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'Active'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('Deactivated')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'Deactivated'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Deactivated
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">NIC (Primary Key)</th>
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4">Solar Specs</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Backoffice Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-400">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Loading prosumers from central service...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-500">
                  No prosumers found matching current filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.nic} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400 tracking-wider">
                    {p.nic}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {p.fullName}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-200">{p.email}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.phoneNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1.5 text-amber-300 font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{p.solarCapacityKW} kW</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      {p.address || 'Address not specified'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {p.status === 'PendingApproval' && (
                        <button
                          onClick={() => onApprove(p.nic)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {p.status === 'Active' && (
                        <button
                          onClick={() => onDeactivate(p.nic)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
                        </button>
                      )}

                      {p.status === 'Deactivated' && (
                        <button
                          onClick={() => onReactivate(p.nic)}
                          title="Only Backoffice users are authorized to reactivate"
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
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

export default ProsumerTable;
