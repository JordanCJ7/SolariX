import React, { useState } from 'react';
import { Search, QrCode, CheckCircle, RefreshCw, Zap, ShieldCheck, Clock } from 'lucide-react';
import Modal from '../common/Modal';

const ReservationMonitor = ({
  reservations = [],
  loading = false,
  onVerifyAndComplete,
  operatorNic = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Verify and complete modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [deliveredKW, setDeliveredKW] = useState(10);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const filtered = reservations.filter((r) => {
    const matchesSearch =
      r.reservationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.prosumerNIC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.stationName.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Approved
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Cancelled
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Pending
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  const handleOpenCompleteModal = (res = null) => {
    if (res && res.qrCodeToken) {
      setQrTokenInput(res.qrCodeToken);
      setDeliveredKW(res.energyAmountKW || 10);
    } else {
      setQrTokenInput('');
      setDeliveredKW(10);
    }
    setOperatorNotes('Verified on-site by Grid Operator');
    setIsModalOpen(true);
  };

  const handleSubmitComplete = async (e) => {
    e.preventDefault();
    if (!qrTokenInput.trim()) return;

    setCompleting(true);
    try {
      await onVerifyAndComplete({
        qrToken: qrTokenInput.trim(),
        operatorId: operatorNic,
        energyDeliveredKWh: parseFloat(deliveredKW) || 0,
        notes: operatorNotes,
      });
      setIsModalOpen(false);
    } finally {
      setCompleting(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl mt-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Power Trading Booking Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of solar reservations across microgrid hubs with QR validation dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reservation or NIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 w-56"
            />
          </div>

          <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-medium">
            {['ALL', 'Approved', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === status
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Quick QR Dispatch Button */}
          <button
            onClick={() => handleOpenCompleteModal()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-slate-950 hover:opacity-90 transition-opacity shadow-md"
          >
            <QrCode className="w-4 h-4" />
            <span>Verify & Complete QR</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Reservation #</th>
              <th className="py-3 px-4">Prosumer NIC</th>
              <th className="py-3 px-4">Hub / Station</th>
              <th className="py-3 px-4">Scheduled Slot</th>
              <th className="py-3 px-4">Trade Spec</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Operator Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-slate-400">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Querying bookings from central API...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-slate-500">
                  No reservations matching current filters.
                </td>
              </tr>
            ) : (
              filtered.map((res) => (
                <tr key={res.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    {res.reservationNumber}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                    {res.prosumerNIC}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {res.stationName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(res.startTime)}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-amber-400">{res.energyAmountKW} kW</span>{' '}
                    <span className="text-[11px] text-slate-400">({res.tradeType})</span>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(res.status)}</td>
                  <td className="py-3.5 px-4 text-right">
                    {res.status === 'Approved' ? (
                      <button
                        onClick={() => handleOpenCompleteModal(res)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Finalize</span>
                      </button>
                    ) : res.status === 'Completed' ? (
                      <span className="text-[11px] text-slate-400">
                        Done ({res.finalizedByOperatorNIC || 'Operator'})
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">--</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* QR Verify and Complete Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Grid Operator - QR Code Transfer Verification"
        subtitle="Verify the prosumer cryptographic token and complete the battery transfer job."
      >
        <form onSubmit={handleSubmitComplete} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              Scanned / Raw QR Token
            </label>
            <textarea
              required
              rows={3}
              value={qrTokenInput}
              onChange={(e) => setQrTokenInput(e.target.value)}
              placeholder="Paste or scan prosumer QR payload here (e.g. RES-ID|NIC|STATION|SLOT|TIMESTAMP#SIGNATURE)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500/70"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Verified Delivered Energy (kW/h)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={deliveredKW}
                onChange={(e) => setDeliveredKW(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/70"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Operator ID / NIC
              </label>
              <input
                type="text"
                disabled
                value={operatorNic}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-400 font-mono opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Operator Observations / Notes
            </label>
            <input
              type="text"
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              placeholder="Inspection completed, battery bay 4 engaged"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/70"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={completing}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-95 transition-opacity disabled:opacity-50 shadow-lg"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{completing ? 'Verifying with API...' : 'Finalize Transfer'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReservationMonitor;
