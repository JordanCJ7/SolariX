import React, { useState } from 'react';
import { Clock, Battery, Calendar, PlusCircle, RefreshCw, Zap, Pencil, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';

const SlotScheduleList = ({
  stations = [],
  selectedStationId,
  onSelectStation,
  slots = [],
  loading = false,
  selectedDate,
  onDateChange,
  onGenerateDailySlots,
  onUpdateSlot,
  onDeleteSlot,
}) => {
  const [generating, setGenerating] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const [editCapacity, setEditCapacity] = useState(0);
  const [editStatus, setEditStatus] = useState('Available');
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSlot, setDeleteSlot] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleGenerate = async () => {
    if (!selectedStationId) return;
    setGenerating(true);
    try {
      await onGenerateDailySlots(selectedStationId, selectedDate);
    } finally {
      setGenerating(false);
    }
  };

  // Open edit modal with current slot values
  const handleOpenEdit = (slot) => {
    setEditSlot(slot);
    setEditCapacity(slot.maxCapacityKW);
    setEditStatus(slot.status);
    setEditModalOpen(true);
  };

  // Submit edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editSlot || !onUpdateSlot) return;
    setSaving(true);
    try {
      await onUpdateSlot(editSlot.id, {
        maxCapacityKW: parseFloat(editCapacity) || 0,
        status: editStatus,
      });
      setEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation
  const handleOpenDelete = (slot) => {
    setDeleteSlot(slot);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteSlot || !onDeleteSlot) return;
    setDeleting(true);
    try {
      await onDeleteSlot(deleteSlot.id);
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
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
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
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
                  <span className="text-slate-400">Bookable Quota:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {slot.availableCapacityKW} / {slot.maxCapacityKW} kW
                  </span>
                </div>

                {/* Edit and Delete Actions */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(slot)}
                    title="Edit Slot"
                    className="inline-flex items-center justify-center p-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(slot)}
                    title="Delete Slot"
                    className="inline-flex items-center justify-center p-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Slot Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Energy Booking Slot"
        subtitle="Update the maximum capacity and operational status for this slot."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
          {editSlot && (
            <div className="text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Time:</span>{' '}
              {formatTime(editSlot.startTime)} – {formatTime(editSlot.endTime)}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Maximum Capacity (kW)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              required
              value={editCapacity}
              onChange={(e) => setEditCapacity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/70"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/70"
            >
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-95 transition-opacity disabled:opacity-50 shadow-lg"
            >
              <Pencil className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Update Slot'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Slot Deletion"
        subtitle="This action cannot be undone. The slot will be permanently removed."
        maxWidth="max-w-md"
      >
        <div className="text-xs space-y-4">
          {deleteSlot && (
            <div className="bg-slate-950 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-300">
                <span className="font-semibold">Time:</span>{' '}
                {formatTime(deleteSlot.startTime)} – {formatTime(deleteSlot.endTime)}
              </div>
              <div className="text-slate-300 mt-1">
                <span className="font-semibold">Capacity:</span>{' '}
                {deleteSlot.availableCapacityKW} / {deleteSlot.maxCapacityKW} kW
              </div>
              <div className="text-slate-300 mt-1">
                <span className="font-semibold">Status:</span> {deleteSlot.status}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Keep Slot
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95 transition-opacity disabled:opacity-50 shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? 'Deleting...' : 'Delete Slot'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SlotScheduleList;
