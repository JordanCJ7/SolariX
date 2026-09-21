import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reservationsApi } from '../../api/reservationsApi';
import { stationsApi } from '../../api/stationsApi';
import StatCard from '../../components/common/StatCard';
import Toast from '../../components/common/Toast';
import {
  Zap,
  Radio,
  Cpu,
  Battery,
  Clock,
  ArrowUpRight,
  RefreshCw,
  QrCode,
  CheckCircle2,
} from 'lucide-react';

const OperatorDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [stations, setStations] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchOperatorData = async () => {
    setLoading(true);
    try {
      const [sumData, stationsData, reservationsData] = await Promise.all([
        reservationsApi.getDashboardSummary(),
        stationsApi.getStations(true), // activeOnly = true
        reservationsApi.getReservations(),
      ]);

      setSummary(sumData);
      setStations(stationsData);
      setRecentReservations(reservationsData.slice(0, 5));
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load operator metrics.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperatorData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Operator Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Grid Operator Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Operational Station Feed &bull; {user?.fullName || 'Operator'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitor active microgrid nodes, inspect scheduled battery storage slots, and dispatch prosumer power trades.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchOperatorData}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              to="/operator/slots"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-green-500 hover:opacity-95 transition-opacity shadow-md"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Slots & QR Monitor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Online Microgrid Hubs"
          value={summary ? `${summary.activeStations} Active` : '--'}
          icon={Cpu}
          color="green"
          subtitle="Grid nodes accepting bookings"
          badge="Online"
        />

        <StatCard
          title="Approved Future Bookings"
          value={summary ? summary.approvedFutureReservationsCount : '--'}
          icon={Battery}
          color="blue"
          subtitle="Within 7-day future window"
          badge="Scheduled"
        />

        <StatCard
          title="Pending Bookings"
          value={summary ? summary.pendingReservationsCount : '--'}
          icon={Clock}
          color="amber"
          subtitle="Awaiting transfer window"
          badge="Upcoming"
        />

        <StatCard
          title="Power Dispatched"
          value={summary ? `${summary.totalEnergyTradedKW.toFixed(1)} kW` : '--'}
          icon={Zap}
          color="purple"
          subtitle="Finalized via QR verification"
          badge="Completed"
        />
      </div>

      {/* Two Columns: Stations Readiness & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Stations Readiness */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Active Station Battery Bays
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time storage slot availability across operating nodes.
              </p>
            </div>
            <Link
              to="/operator/slots"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>View Slots</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {stations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No active stations found.
              </div>
            ) : (
              stations.map((s) => (
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
                    <span className="text-xs font-bold text-emerald-400">
                      {s.availableBatterySlots} / {s.totalBatterySlots} Available
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Cap: {s.capacityKWh} kW/h
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Power Trading Bookings */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Recent Reservation Activity
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Prosumer energy bookings awaiting or completing dispatch.
              </p>
            </div>
            <Link
              to="/operator/slots"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>All Bookings</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentReservations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No bookings recorded yet.
              </div>
            ) : (
              recentReservations.map((r) => (
                <div
                  key={r.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-colors text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-emerald-400">{r.reservationNumber}</div>
                    <div className="text-slate-300 text-[11px] mt-0.5">
                      Prosumer: <span className="font-mono">{r.prosumerNIC}</span> &bull; {r.stationName}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-amber-400">{r.energyAmountKW} kW</div>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        r.status === 'Approved'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : r.status === 'Completed'
                          ? 'bg-sky-500/15 text-sky-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {r.status}
                    </span>
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

export default OperatorDashboard;
