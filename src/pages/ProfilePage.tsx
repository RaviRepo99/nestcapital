import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDate } from '../lib/utils';
import {
  User as UserIcon,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  Lock,
  Edit2,
  CheckCircle2,
  Sparkles,
  Award,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUserData, showToast, setActiveModal } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateProfile({ fullName, phone });
      await refreshUserData();
      setIsEditing(false);
      showToast('Profile details updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0B192C&color=D4AF37&bold=true`
            }
            alt={user?.fullName}
            className="w-20 h-20 rounded-3xl object-cover ring-2 ring-amber-400 shadow-md"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center text-white">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900">{user?.fullName}</h1>
            <span className="text-xs uppercase font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 self-center sm:self-auto">
              {user?.role === 'admin' ? '⚡ Administrator' : 'Verified Investor'}
            </span>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5" /> {user?.email}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                user?.kycStatus === 'verified'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {user?.kycStatus === 'verified' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> KYC Verified
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" /> KYC {user?.kycStatus}
                </>
              )}
            </span>

            <span className="text-xs text-slate-400">
              Joined {formatDate(user?.createdAt || new Date().toISOString())}
            </span>
          </div>
        </div>
      </div>

      {/* KYC Compliance Section */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Identity & KYC Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Regulatory compliance required for unrestricted payouts in Nepal.
            </p>
          </div>

          {user?.kycStatus !== 'verified' && (
            <button
              onClick={() => setActiveModal('kyc')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition"
            >
              {user?.kycStatus === 'pending' ? 'Update KYC' : 'Verify Now'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-0.5">KYC Status</span>
            <strong className="capitalize text-slate-900">{user?.kycStatus}</strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Document Type</span>
            <span className="font-semibold text-slate-900">{user?.kycDocumentType || 'Not Provided'}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Document ID</span>
            <span className="font-mono font-bold text-slate-900">{user?.kycDocumentNumber || '—'}</span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-slate-900">Personal Information</h3>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel' : 'Edit Details'}</span>
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                disabled={!isEditing}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                disabled={!isEditing}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-500 bg-slate-50 cursor-not-allowed"
            />
          </div>

          {isEditing && (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
