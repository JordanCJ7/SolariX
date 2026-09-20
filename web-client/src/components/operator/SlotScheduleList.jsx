import React, { useState } from 'react';
import { Clock, Battery, Calendar, PlusCircle, RefreshCw, Zap } from 'lucide-react';

const SlotScheduleList = ({
  stations = [],
  selectedStationId,
  onSelectStation,
  slots = [],
  loading = false,
  selectedDate,
  onDateChange,
  onGenerateDailySlots,
}) => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedStationId) return;
    setGenerating(true);
    try {
      await onGenerateDailySlots(selectedStationId, selectedDate);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Available
          </span>
        );
      case 'Booked':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Fully Booked
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Blocked
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Battery Storage Slots & Schedule
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational hours and slot capacities read from central FAT service.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Station Selector */}
          <select
            value={selectedStationId}
            onChange={(e) => onSelectStation(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/60"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.stationName} ({s.stationCode})
              </option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/60"
          />

          {/* Batch Generate Slots Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedStationId}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{generating ? 'Generating...' : 'Batch Daily Slots'}</span>
          </button>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400 mr-2" />
            <span>Loading slot intervals...</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No booking slots generated for this station on selected date. Click "Batch Daily Slots" to populate hourly slots.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </span>
                  {getStatusBadge(slot.status)}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Available Cap:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {slot.availableCapacityKW} / {slot.maxCapacityKW} kW
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotScheduleList;
