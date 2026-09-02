import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatNPR, formatDate, copyToClipboard } from '../lib/utils';
import {
  Users,
  Gift,
  Copy,
  Check,
  Share2,
  Sparkles,
  TrendingUp,
  Award,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ReferralStats } from '../types';
import { supabase } from '../lib/supabase';

export const ReferralsPage: React.FC = () => {
  const { user, showToast } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referralCode || 'CAPNEST2025';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        const data = await api.getReferrals();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
    const channel = supabase
      .channel(`referral-updates-${user?.id || 'anonymous'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals', filter: `referrer_id=eq.${user?.id}` }, () => void fetchReferrals())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      showToast('Referral link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Namaste! Join me on CapitalNest Nepal to earn guaranteed daily yield on your investments in NPR. Register with my referral code ${referralCode}: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F284E] to-[#07111F] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-amber-500/20">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>CapitalNest Affiliate & Partner Program</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Invite Friends & Earn Fixed Rewards
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Share your unique referral link. After your friend verifies their email, you receive NPR 100 and they receive an NPR 50 welcome bonus, credited securely and automatically.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total Referees</span>
          <div className="text-2xl font-black font-display text-slate-900">
            {stats?.totalReferrals || 0} Friends
          </div>
          <span className="text-[11px] text-slate-400">Joined using your invitation</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total Referral Earnings</span>
          <div className="text-2xl font-black font-display text-emerald-600">
            +{formatNPR(stats?.totalEarnings || 0, false)}
          </div>
          <span className="text-[11px] text-slate-400">NPR 100 for each successful referral</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Fixed Reward</span>
          <div className="text-2xl font-black font-display text-amber-500">
            NPR 100 + NPR 50
          </div>
          <span className="text-[11px] text-slate-400">Referrer + new user bonus</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Pending Referrals</span>
          <div className="text-2xl font-black font-display text-slate-900">{stats?.pendingReferrals || 0}</div>
          <span className="text-[11px] text-slate-400">Awaiting verified completion</span>
        </div>
      </div>

      {/* Referral Link & Code Share Box */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold font-display text-slate-900">Your Invitation Credentials</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Your Referral Code</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralCode}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900"
              />
              <button
                onClick={() => handleCopy(referralCode)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition flex-shrink-0"
                title="Copy code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Your Referral Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-mono text-slate-900 truncate"
              />
              <button
                onClick={() => handleCopy(referralLink)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition flex-shrink-0 shadow-xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp
          </button>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-sm font-display text-slate-900">Invited Investors</h3>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading referral tree...</div>
          ) : !stats?.referees || stats.referees.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No referred users yet. Share your code above to start earning bonuses.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3">Investment Activity</th>
                    <th className="p-3">Commission Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.referees.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-900">{r.fullName}</td>
                      <td className="p-3 text-slate-400">{formatDate(r.joinedAt)}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-600 font-display">
                        +{formatNPR(r.commissionEarned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
