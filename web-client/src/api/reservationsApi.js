import axiosClient from './axiosClient';

export const reservationsApi = {
  getReservations: (params = {}) => {
    return axiosClient.get('/reservations', { params });
  },
  getReservationsByProsumer: (nic) => {
    return axiosClient.get(`/reservations/prosumer/${encodeURIComponent(nic)}`);
  },
  getDashboardSummary: () => {
    return axiosClient.get('/reservations/dashboard-summary');
  },
  createReservation: (data) => {
    return axiosClient.post('/reservations', data);
  },
  updateReservation: (id, prosumerNic, data) => {
    return axiosClient.put(`/reservations/${id}`, data, {
      params: { prosumerNic },
    });
  },
  cancelReservation: (id, prosumerNic, reason = 'Cancelled by user') => {
    return axiosClient.post(`/reservations/${id}/cancel`, {
      prosumerNIC: prosumerNic,
      reason,
    });
  },
  verifyAndComplete: (data) => {
    return axiosClient.post('/reservations/verify-and-complete', data);
  },
  getSlots: (stationId, date = null) => {
    const params = {};
    if (date) params.date = date;
    return axiosClient.get(`/slots/station/${stationId}`, { params });
  },
  generateDailySlots: (data) => {
    return axiosClient.post('/slots/generate-daily', data);
  },
};
