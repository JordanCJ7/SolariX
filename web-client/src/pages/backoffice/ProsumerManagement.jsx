import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/usersApi';
import { authApi } from '../../api/authApi';
import ProsumerTable from '../../components/backoffice/ProsumerTable';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { UserPlus, Shield, Zap } from 'lucide-react';

const ProsumerManagement = () => {
  const { user } = useAuth();
  const [prosumers, setProsumers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // New Prosumer Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nic: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: 'Password@123',
    address: '',
    solarCapacityKW: 5.0,
  });
  const [registering, setRegistering] = useState(false);

  const fetchProsumers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getUsers('Prosumer');
      setProsumers(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch prosumers from API.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProsumers();
  }, []);

  const handleApprove = async (prosumerNic) => {
    try {
      await usersApi.approveProsumer(prosumerNic, user.nic);
      setToast({
        type: 'success',
        message: `Prosumer '${prosumerNic}' successfully approved and activated.`,
      });
      fetchProsumers();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to approve prosumer.' });
    }
  };

  const handleDeactivate = async (prosumerNic) => {
    try {
      await usersApi.deactivateAccount(prosumerNic, user.nic);
      setToast({
        type: 'warning',
        message: `Prosumer '${prosumerNic}' has been deactivated.`,
      });
      fetchProsumers();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to deactivate account.' });
    }
  };

  const handleReactivate = async (prosumerNic) => {
    try {
      await usersApi.reactivateAccount(prosumerNic, user.nic);
      setToast({
        type: 'success',
        message: `Account '${prosumerNic}' successfully reactivated by Backoffice officer '${user.nic}'.`,
      });
      fetchProsumers();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Reactivation failed.' });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      await authApi.registerProsumer(registerForm);

      setToast({
        type: 'success',
        message: `Prosumer '${registerForm.nic}' registered successfully.`,
      });
      setIsRegisterOpen(false);
      setRegisterForm({
        nic: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        password: 'Password@123',
        address: '',
        solarCapacityKW: 5.0,
      });
      fetchProsumers();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Registration failed.' });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-amber-400" />
            Prosumer Account Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Backoffice control center for verifying identities (NIC), handling approvals, and enforcing exclusive account reactivations.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 solar-gradient hover:opacity-95 transition-opacity shadow-md self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard New Prosumer</span>
        </button>
      </div>

      {/* Prosumer Table Component */}
      <ProsumerTable
        prosumers={prosumers}
        loading={loading}
        onApprove={handleApprove}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
      />

      {/* Manual Prosumer Onboarding Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Onboard Solar Prosumer"
        subtitle="Register prosumer using National Identity Card (NIC) as primary identity key."
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                NIC Number (Primary Key)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 200012345678"
                value={registerForm.nic}
                onChange={(e) => setRegisterForm({ ...registerForm, nic: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sunimal Perera"
                value={registerForm.fullName}
                onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="prosumer@domain.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                placeholder="+94 77 123 4567"
                value={registerForm.phoneNumber}
                onChange={(e) => setRegisterForm({ ...registerForm, phoneNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Residential / Array Address
              </label>
              <input
                type="text"
                placeholder="12 Solar Way, Colombo"
                value={registerForm.address}
                onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Solar Array Capacity (kW)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                required
                value={registerForm.solarCapacityKW}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, solarCapacityKW: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2 rounded-xl font-bold text-slate-950 solar-gradient hover:opacity-95 transition-opacity disabled:opacity-50 shadow-lg"
            >
              {registering ? 'Registering...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProsumerManagement;
