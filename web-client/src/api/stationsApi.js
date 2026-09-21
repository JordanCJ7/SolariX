import axiosClient from './axiosClient';

export const stationsApi = {
  getStations: (activeOnly = null) => {
    const params = {};
    if (activeOnly !== null) params.activeOnly = activeOnly;
    return axiosClient.get('/stations', { params });
  },
  getStationById: (id) => {
    return axiosClient.get(`/stations/${id}`);
  },
  createStation: (data) => {
    return axiosClient.post('/stations', data);
  },
  updateStation: (id, data) => {
    return axiosClient.put(`/stations/${id}`, data);
  },
  deactivateStation: (id) => {
    return axiosClient.post(`/stations/${id}/deactivate`);
  },
  reactivateStation: (id) => {
    return axiosClient.post(`/stations/${id}/reactivate`);
  },
};
