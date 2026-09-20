import axiosClient from './axiosClient';

export const usersApi = {
  getUsers: (role = null, status = null) => {
    const params = {};
    if (role) params.role = role;
    if (status) params.status = status;
    return axiosClient.get('/users', { params });
  },
  getPendingProsumers: () => {
    return axiosClient.get('/users/pending-prosumers');
  },
  createStaff: (data) => {
    return axiosClient.post('/users/staff', data);
  },
  updateProfile: (nic, data) => {
    return axiosClient.put(`/users/prosumer/${encodeURIComponent(nic)}`, data);
  },
  deactivateAccount: (nic, requestedByNic) => {
    return axiosClient.post(`/users/${encodeURIComponent(nic)}/deactivate`, null, {
      params: { requestedByNic },
    });
  },
  reactivateAccount: (nic, backofficeNic) => {
    return axiosClient.post(`/users/${encodeURIComponent(nic)}/reactivate`, null, {
      params: { backofficeNic },
    });
  },
  approveProsumer: (nic, backofficeNic) => {
    return axiosClient.post(`/users/${encodeURIComponent(nic)}/approve`, null, {
      params: { backofficeNic },
    });
  },
};
