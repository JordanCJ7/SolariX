import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Cpu, MapPin, Battery, Clock, Phone, Hash } from 'lucide-react';

const StationModal = ({ isOpen, onClose, onSubmit, initialData = null, loading = false }) => {
  const [formData, setFormData] = useState({
    stationCode: '',
    stationName: '',
    locationName: '',
    latitude: 6.9271,
    longitude: 79.8612,
    capacityKWh: 150,
    totalBatterySlots: 20,
    operationalHours: '06:00 - 20:00',
    contactNumber: '+94112400000',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        stationCode: initialData.stationCode || '',
        stationName: initialData.stationName || '',
        locationName: initialData.locationName || '',
        latitude: initialData.latitude || 6.9271,
        longitude: initialData.longitude || 79.8612,
        capacityKWh: initialData.capacityKWh || 150,
        totalBatterySlots: initialData.totalBatterySlots || 20,
        operationalHours: initialData.operationalHours || '06:00 - 20:00',
        contactNumber: initialData.contactNumber || '',
      });
    } else {
      setFormData({
        stationCode: `HUB-${Math.floor(100 + Math.random() * 900)}`,
        stationName: '',
        locationName: '',
        latitude: 6.9271,
        longitude: 79.8612,
        capacityKWh: 150,
        totalBatterySlots: 20,
        operationalHours: '06:00 - 20:00',
        contactNumber: '+94112400000',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Update Microgrid Hub' : 'Register New Solar Microgrid Node'}
      subtitle="Configure GPS position, storage capacities, and operational availability."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              Station Code
            </label>
            <input
              type="text"
              name="stationCode"
              required
              disabled={!!initialData}
              value={formData.stationCode}
              onChange={handleChange}
              placeholder="e.g. HUB-CMB-02"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/70 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Station Name
            </label>
            <input
              type="text"
              name="stationName"
              required
              value={formData.stationName}
              onChange={handleChange}
              placeholder="e.g. Kaduwela Solar Hub"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Location Name
          </label>
          <input
            type="text"
            name="locationName"
            required
            value={formData.locationName}
            onChange={handleChange}
            placeholder="e.g. Main Substation, High Level Road, Colombo"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
          />
        </div>

        {/* GPS Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Latitude (GPS)
            </label>
            <input
              type="number"
              step="any"
              name="latitude"
              required
              value={formData.latitude}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Longitude (GPS)
            </label>
            <input
              type="number"
              step="any"
              name="longitude"
              required
              value={formData.longitude}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
            />
          </div>
        </div>

        {/* Capacity and Battery Slots */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-amber-400" />
              Capacity (kW/h)
            </label>
            <input
              type="number"
              min="1"
              name="capacityKWh"
              required
              value={formData.capacityKWh}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              Total Battery Slots
            </label>
            <input
              type="number"
              min="1"
              max="500"
              name="totalBatterySlots"
              required
              value={formData.totalBatterySlots}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
            />
          </div>
        </div>

        {/* Hours and Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Operational Hours
            </label>
            <input
              type="text"
              name="operationalHours"
              value={formData.operationalHours}
              onChange={handleChange}
              placeholder="06:00 - 20:00"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              Contact Number
            </label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="+94 11 2345678"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl font-bold text-slate-950 solar-gradient hover:opacity-95 transition-opacity disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Saving to Web API...' : initialData ? 'Update Station' : 'Register Station'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StationModal;
