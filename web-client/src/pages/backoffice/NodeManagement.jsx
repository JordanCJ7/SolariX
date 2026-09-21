import React, { useEffect, useState } from 'react';
import { stationsApi } from '../../api/stationsApi';
import StationModal from '../../components/backoffice/StationModal';
import Toast from '../../components/common/Toast';
import {
  Cpu,
  Plus,
  MapPin,
  Battery,
  Clock,
  Ban,
  RefreshCw,
  Zap,
  Edit,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

const NodeManagement = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const data = await stationsApi.getStations();
      setStations(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch microgrid hubs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    setSaving(true);
    try {
      if (editingStation) {
        await stationsApi.updateStation(editingStation.id, formData);
        setToast({ type: 'success', message: `Station '${formData.stationName}' updated successfully.` });
      } else {
        await stationsApi.createStation(formData);
        setToast({ type: 'success', message: `New solar hub '${formData.stationName}' registered successfully.` });
      }
      setIsModalOpen(false);
      setEditingStation(null);
      fetchStations();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Operation failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (station) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate station node '${station.stationName}' (${station.stationCode})? This action will check for active reservations first.`
    );
    if (!confirmed) return;

    try {
      // Calls POST /api/stations/{id}/deactivate
      const res = await stationsApi.deactivateStation(station.id);
      setToast({
        type: 'success',
        message: res.message || `Station '${station.stationName}' was successfully deactivated.`,
      });
      fetchStations();
    } catch (err) {
      // FAT service compliance: Catch 400 Bad Request if active reservations exist and display exact server message in toast!
      setToast({
        type: 'error',
        message: err.message || 'Deactivation blocked by FAT service business rule.',
      });
    }
  };

  const handleReactivate = async (station) => {
    try {
      const res = await stationsApi.reactivateStation(station.id);
      setToast({
        type: 'success',
        message: res.message || `Station '${station.stationName}' reactivated successfully.`,
      });
      fetchStations();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Reactivation failed.' });
    }
  };

  const openCreateModal = () => {
    setEditingStation(null);
    setIsModalOpen(true);
  };

  const openEditModal = (station) => {
    setEditingStation(station);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-amber-400" />
            Solar Microgrid Node Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure regional microgrid hubs, GPS positioning, battery slot capacity specs, and enforce active-reservation deactivation guards.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 solar-gradient hover:opacity-95 transition-all shadow-lg self-start sm:self-auto hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Grid Hub</span>
        </button>
      </div>

      {/* Stations List Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mr-2" />
          <span>Loading solar microgrid nodes from FAT service...</span>
        </div>
      ) : stations.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-400">
          <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Microgrid Nodes Found</h3>
          <p className="text-xs text-slate-500 mt-1">Click "Add New Grid Hub" to register the first station.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((s) => (
            <div
              key={s.id}
              className={`glass-panel rounded-2xl p-6 border transition-all duration-300 shadow-xl ${
                s.isActive
                  ? 'border-slate-800 hover:border-amber-500/40'
                  : 'border-rose-950/60 bg-rose-950/10'
              }`}
            >
              {/* Card Top */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {s.stationCode}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{s.stationName}</h3>
                </div>

                {s.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Deactivated
                  </span>
                )}
              </div>

              {/* Location & GPS */}
              <div className="mt-4 text-xs space-y-1.5 text-slate-300">
                <div className="flex items-center space-x-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{s.locationName}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 pl-5">
                  GPS: {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                </div>
              </div>

              {/* Specs Ribbon */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Hub Capacity:</span>
                  <span className="font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                    <Zap className="w-3.5 h-3.5" />
                    {s.capacityKWh} kW/h
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Battery Storage:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Battery className="w-3.5 h-3.5" />
                    {s.availableBatterySlots} / {s.totalBatterySlots} Slots
                  </span>
                </div>
              </div>

              {/* Operational Hours */}
              <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Hours: {s.operationalHours}</span>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(s)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Hub</span>
                </button>

                {s.isActive ? (
                  <button
                    onClick={() => handleDeactivate(s)}
                    title="Queries active reservations before proceeding; blocked if bookings exist"
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Deactivate</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivate(s)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Reactivate</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Station Modal */}
      <StationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingStation}
        loading={saving}
      />
    </div>
  );
};

export default NodeManagement;
