import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Settings,
  Lock,
  Shield,
  Bell,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, showToast, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Preference switches
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [dailyYieldNotif, setDailyYieldNotif] = useState(true);
  const [twoFactorSim, setTwoFactorSim] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Please fill all password fields.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Password updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold font-display text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-500" />
          Security & Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your credentials, two-factor authentication, and notifications.
        </p>
      </div>

      {/* Password Management */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" /> Change Account Password
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-md">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Current Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="•••••••• (Min 6 chars)"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Features */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" /> Account Security Controls
        </h3>

        <div className="divide-y divide-slate-100 text-xs text-slate-600">
          <div className="py-3 flex items-center justify-between">
            <div>
              <strong className="text-slate-900 block font-semibold">Two-Factor Authentication (2FA)</strong>
              <span className="text-[11px] text-slate-500">Require an SMS or authenticator OTP when logging in.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTwoFactorSim(!twoFactorSim);
                showToast(`2FA has been ${!twoFactorSim ? 'activated' : 'deactivated'}.`, 'info');
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                twoFactorSim ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  twoFactorSim ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <strong className="text-slate-900 block font-semibold">Daily Yield Notification</strong>
              <span className="text-[11px] text-slate-500">Receive alert when daily profits credit to your wallet.</span>
            </div>
            <button
              type="button"
              onClick={() => setDailyYieldNotif(!dailyYieldNotif)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                dailyYieldNotif ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  dailyYieldNotif ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <strong className="text-slate-900 block font-semibold">Email Transaction Slips</strong>
              <span className="text-[11px] text-slate-500">Receive digital receipts for deposits and withdrawal approvals.</span>
            </div>
            <button
              type="button"
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                emailAlerts ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  emailAlerts ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-200/80 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-rose-950 font-display">Active Session</h4>
          <p className="text-xs text-rose-800/80 mt-0.5">End your current session on this device.</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};
