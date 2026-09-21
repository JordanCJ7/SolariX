import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reservationsApi } from '../../api/reservationsApi';
import { stationsApi } from '../../api/stationsApi';
import { usersApi } from '../../api/usersApi';
import StatCard from '../../components/common/StatCard';
import Toast from '../../components/common/Toast';
import {
  Shield,
  Cpu,
  Users,
  Battery,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Zap,
  Radio,
  CheckCircle2,
} from 'lucide-react';

const BackofficeDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentStations, setRecentStations] = useState([]);
  const [pendingProsumers, setPendingProsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumData, stationsData, pendingData] = await Promise.all([
        reservationsApi.getDashboardSummary(),
        stationsApi.getStations(),
        usersApi.getPendingProsumers(),
      ]);

      setSummary(sumData);
      setRecentStations(stationsData.slice(0, 4));
      setPendingProsumers(pendingData.slice(0, 5));
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load dashboard metrics.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Greeting Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Backoffice Administrator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {user?.fullName || 'Administrator'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Centralized administration: manage prosumer lifecycle, configure microgrid hubs, and monitor active trading.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboardData}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>

            <Link
              to="/backoffice/nodes"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 solar-gradient hover:opacity-95 transition-opacity shadow-md"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Manage Nodes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Microgrid Hubs"
          value={summary ? `${summary.activeStations} / ${summary.totalStations}` : '--'}
          icon={Cpu}
          color="amber"
          subtitle="Operational solar nodes"
          badge="Hubs Online"
        />

        <StatCard
          title="Total Prosumers"
          value={summary ? summary.totalProsumers : '--'}
          icon={Users}
          color="green"
          subtitle={
            summary?.pendingProsumerApprovals > 0
              ? `${summary.pendingProsumerApprovals} awaiting approval`
              : 'All accounts verified'
          }
          badge={summary?.pendingProsumerApprovals > 0 ? 'Action Needed' : 'Normal'}
        />

        <StatCard
          title="Approved Future Bookings"
          value={summary ? summary.approvedFutureReservationsCount : '--'}
          icon={Battery}
          color="blue"
          subtitle="Scheduled within 7-day window"
          badge="Active Window"
        />

        <StatCard
          title="Total Power Traded"
          value={summary ? `${summary.totalEnergyTradedKW.toFixed(1)} kW` : '--'}
          icon={Zap}
          color="purple"
          subtitle="From finalized transfers"
          badge="Delivered"
        />
      </div>

      {/* Two Columns: Actionable Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Prosumers Approvals Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Pending Prosumer Approvals
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                New accounts requiring Backoffice identity verification.
              </p>
            </div>
            <Link
              to="/backoffice/prosumers"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {pendingProsumers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mb-2" />
                <span>No pending prosumer registrations. All profiles are processed.</span>
              </div>
            ) : (
              pendingProsumers.map((p) => (
                <div
                  key={p.nic}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{p.fullName}</div>
                    <div className="text-[11px] font-mono text-amber-400 mt-0.5">NIC: {p.nic}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{p.email}</div>
                  </div>
                  <Link
                    to="/backoffice/prosumers"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Microgrid Hubs Quick Overview */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Microgrid Hub Status
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Solar stations with active battery bay capacity.
              </p>
            </div>
            <Link
              to="/backoffice/nodes"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Manage Nodes</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentStations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No microgrid stations currently registered.
              </div>
            ) : (
              recentStations.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{s.stationName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {s.stationCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.locationName}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">
                      {s.availableBatterySlots} / {s.totalBatterySlots} Slots
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {s.isActive ? (
                        <span className="text-emerald-400">● Online</span>
                      ) : (
                        <span className="text-rose-400">● Deactivated</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackofficeDashboard;
