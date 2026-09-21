import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { stationsApi } from '../../api/stationsApi';
import { reservationsApi } from '../../api/reservationsApi';
import SlotScheduleList from '../../components/operator/SlotScheduleList';
import ReservationMonitor from '../../components/operator/ReservationMonitor';
import Toast from '../../components/common/Toast';
import { Radio } from 'lucide-react';

const SlotManagement = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [slots, setSlots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch stations on load
  useEffect(() => {
    stationsApi
      .getStations(true)
      .then((data) => {
        setStations(data);
        if (data.length > 0) {
          setSelectedStationId(data[0].id);
        }
      })
      .catch((err) => {
        setToast({ type: 'error', message: err.message || 'Failed to load active stations.' });
      });
  }, []);

  // Fetch slots whenever station or date changes
  const fetchSlots = async (stationId, date) => {
    if (!stationId) return;
    setLoadingSlots(true);
    try {
      const data = await reservationsApi.getSlots(stationId, date);
      setSlots(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load booking slots.' });
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedStationId) {
      fetchSlots(selectedStationId, selectedDate);
    }
  }, [selectedStationId, selectedDate]);

  // Fetch live reservations
  const fetchReservations = async () => {
    setLoadingReservations(true);
    try {
      const data = await reservationsApi.getReservations();
      setReservations(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load reservations.' });
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  // Batch generate slots handler
  const handleGenerateDailySlots = async (stationId, targetDate) => {
    try {
      await reservationsApi.generateDailySlots({
        stationId,
        targetDate: new Date(targetDate).toISOString(),
        slotDurationMinutes: 60,
        slotCapacityKW: 25.0,
      });
      setToast({
        type: 'success',
        message: 'Daily slots batch generated successfully for operational hours.',
      });
      fetchSlots(stationId, targetDate);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to generate slots.' });
    }
  };

  // QR Verify and Complete handler
  const handleVerifyAndComplete = async (payload) => {
    try {
      const res = await reservationsApi.verifyAndComplete(payload);
      setToast({
        type: 'success',
        message: `Energy transfer for reservation '${res.reservationNumber}' verified & completed by Operator '${user?.nic}'.`,
      });
      fetchReservations();
      if (selectedStationId) {
        fetchSlots(selectedStationId, selectedDate);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'QR verification failed.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Radio className="w-6 h-6 text-emerald-400" />
          Microgrid Slot & Reservation Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Grid Operator console for viewing battery slot readiness, auditing prosumer trading requests, and finalizing on-site QR transactions.
        </p>
      </div>

      {/* Slot Schedule List */}
      <SlotScheduleList
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={(id) => setSelectedStationId(id)}
        slots={slots}
        loading={loadingSlots}
        selectedDate={selectedDate}
        onDateChange={(d) => setSelectedDate(d)}
        onGenerateDailySlots={handleGenerateDailySlots}
      />

      {/* Live Reservation Monitor */}
      <ReservationMonitor
        reservations={reservations}
        loading={loadingReservations}
        onVerifyAndComplete={handleVerifyAndComplete}
        operatorNic={user?.nic || ''}
      />
    </div>
  );
};

export default SlotManagement;
