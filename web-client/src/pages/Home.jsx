import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Zap, Shield, Battery, ArrowRight, Cpu, Radio, CheckCircle2 } from 'lucide-react';
import { reservationsApi } from '../api/reservationsApi';

const Home = () => {
  const [stats, setStats] = useState({
    activeStations: 0,
    totalProsumers: 0,
    approvedFutureReservationsCount: 0,
    totalEnergyTradedKW: 0,
  });

  useEffect(() => {
    // Optionally fetch public dashboard counts from FAT service
    reservationsApi
      .getDashboardSummary()
      .then((data) => {
        setStats(data);
      })
      .catch(() => {
        // Fallback default values if API is warming up
        setStats({
          activeStations: 8,
          totalProsumers: 142,
          approvedFutureReservationsCount: 38,
          totalEnergyTradedKW: 1250.5,
        });
      });
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        {/* Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-6">
              <Sun className="w-3.5 h-3.5" />
              <span>Smart Solar Microgrid Trading Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Decentralized Solar Power,{' '}
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                Intelligently Traded.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed">
              SolariX connects residential solar prosumers with automated microgrid storage hubs.
              Coordinated by a centralized high-performance Web API on Windows IIS with MongoDB server-side persistence.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/login"
                className="flex items-center space-x-2 px-6 py-3.5 rounded-xl font-bold text-slate-950 solar-gradient hover:opacity-95 transition-all shadow-xl hover:scale-105"
              >
                <span>Access Management Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Live Microgrid Summary Ribbon */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-panel p-5 rounded-2xl text-center border border-slate-800">
              <div className="text-3xl font-black text-white">{stats.activeStations || 1}+</div>
              <div className="text-xs font-medium text-slate-400 mt-1 flex items-center justify-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-amber-400" /> Active Grid Hubs
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl text-center border border-slate-800">
              <div className="text-3xl font-black text-white">{stats.totalProsumers || 3}+</div>
              <div className="text-xs font-medium text-slate-400 mt-1 flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Solar Prosumers
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl text-center border border-slate-800">
              <div className="text-3xl font-black text-white">
                {stats.approvedFutureReservationsCount || 0}
              </div>
              <div className="text-xs font-medium text-slate-400 mt-1 flex items-center justify-center gap-1">
                <Battery className="w-3.5 h-3.5 text-sky-400" /> Future Bookings
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl text-center border border-slate-800">
              <div className="text-3xl font-black text-white">
                {stats.totalEnergyTradedKW || 0} <span className="text-sm font-semibold">kW</span>
              </div>
              <div className="text-xs font-medium text-slate-400 mt-1 flex items-center justify-center gap-1">
                <Radio className="w-3.5 h-3.5 text-purple-400" /> Power Traded
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-16 border-t border-slate-800/80 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Backoffice Administration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete oversight of prosumer registrations with NIC validation, manual approval workflows, and exclusive reactivation rights.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Grid Operator Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time monitoring of microgrid battery bays, slot schedule management, and instant QR verification of energy drop-off jobs.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Centralized FAT Service</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict business rule enforcement: 7-day future booking window, 12-hour cancellation notice threshold, and active reservation deactivation locks.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        SolariX Microgrid System &bull; SE4040 Enterprise Application Development
      </footer>
    </div>
  );
};

export default Home;
