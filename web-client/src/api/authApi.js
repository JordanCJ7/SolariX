import axiosClient from './axiosClient';

export const authApi = {
  login: (identifier, password) => {
    return axiosClient.post('/auth/login', { identifier, password });
  },
  registerProsumer: (data) => {
    return axiosClient.post('/auth/register-prosumer', data);
  },
  getProfile: (nic) => {
    return axiosClient.get(`/auth/profile/${encodeURIComponent(nic)}`);
  },
};
