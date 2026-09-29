import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/usersApi';
import StaffTable from '../../components/backoffice/StaffTable';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { UserPlus, ShieldAlert } from 'lucide-react';

const StaffManagement = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // New Staff Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nic: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: 'Password@123',
    role: 'GridOperator', // Default
  });
  const [registering, setRegistering] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const allUsers = await usersApi.getUsers();
      // Filter out only staff (GridOperator and Backoffice)
      const staffUsers = allUsers.filter(
        (u) => u.role === 'GridOperator' || u.role === 'Backoffice'
      );
      setStaff(staffUsers);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch staff from API.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDeactivate = async (staffNic) => {
    try {
      if (staffNic === user.nic) {
        setToast({ type: 'error', message: 'You cannot deactivate your own account.' });
        return;
      }
      await usersApi.deactivateAccount(staffNic, user.nic);
      setToast({
        type: 'warning',
        message: `Staff member '${staffNic}' has been deactivated.`,
      });
      fetchStaff();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to deactivate account.' });
    }
  };

  const handleReactivate = async (staffNic) => {
    try {
      await usersApi.reactivateAccount(staffNic, user.nic);
      setToast({
        type: 'success',
        message: `Account '${staffNic}' successfully reactivated.`,
      });
      fetchStaff();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Reactivation failed.' });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      await usersApi.createStaff(registerForm);

      setToast({
        type: 'success',
        message: `${registerForm.role} '${registerForm.nic}' registered successfully.`,
      });
      setIsRegisterOpen(false);
      setRegisterForm({
        nic: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        password: 'Password@123',
        role: 'GridOperator',
      });
      fetchStaff();
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
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            Staff Account Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Central administration for creating and managing Grid Operators and Backoffice personnel.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 solar-gradient hover:opacity-95 transition-opacity shadow-md self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table Component */}
      <StaffTable
        staff={staff}
        loading={loading}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
      />

      {/* Manual Staff Onboarding Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Add Staff Member"
        subtitle="Create a new Backoffice Admin or Grid Operator account."
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                NIC Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 199012345678"
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
                placeholder="e.g. Kamal Perera"
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
                placeholder="staff@solarix.com"
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
                Staff Role
              </label>
              <select
                value={registerForm.role}
                onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/70"
              >
                <option value="GridOperator">Grid Operator</option>
                <option value="Backoffice">Backoffice Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Default Password
              </label>
              <input
                type="text"
                readOnly
                value={registerForm.password}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-400 font-mono focus:outline-none cursor-not-allowed"
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
              {registering ? 'Creating...' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffManagement;
