import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatNPR, formatDate, getStatusBadgeClass } from '../lib/utils';
import {
  Wallet,
  TrendingUp,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Investment, Transaction } from '../types';

export const DashboardPage: React.FC = () => {
  const {
    user,
    wallet,
    navigate,
    setActiveModal,
    refreshUserData,
  } = useAuth();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReferralAd, setShowReferralAd] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invData, txData] = await Promise.all([
          api.getInvestments(),
          api.getTransactions(),
        ]);
        setInvestments(invData);
        setRecentTransactions(txData.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeInvestments = investments.filter((i) => i.status === 'active');
  const availableBal = wallet?.availableBalance || 0;
  const investedBal = wallet?.investedBalance || 0;
  const totalProfits = wallet?.totalEarnings || 0;
  const referralBonus = wallet?.referralEarnings || 0;

  return (
    <div className="space-y-6 pb-12">
      {showReferralAd && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowReferralAd(false)}
            className="absolute right-3 top-3 z-10 rounded-full bg-slate-900/80 p-2 text-white transition hover:bg-slate-900"
            aria-label="Close referral advertisement"
            title="Close"
          >
            <span className="text-base leading-none">X</span>
          </button>
          <button type="button" onClick={() => navigate('referrals')} className="block w-full text-left">
            <img src="/referads.png" alt="Refer and earn rewards" className="h-auto max-h-64 w-full object-cover object-center" />
          </button>
        </div>
      )}

      {/* Top Welcome & KYC Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#0B192C] via-[#0F284E] to-[#07111F] text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
            Namaste, {user?.fullName || 'Investor'}! 👋
          </h1>
          <p className="text-slate-300 text-xs mt-0.5">
            Your CapitalNest portfolio is active and yielding returns.
          </p>
        </div>

        {/* KYC Status Badge & Action */}
        <div className="flex items-center gap-3">
          {user?.kycStatus === 'verified' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>KYC Verified</span>
            </div>
          ) : (
            <button
              onClick={() => setActiveModal('kyc')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-semibold transition"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>KYC {user?.kycStatus === 'pending' ? 'Under Review' : 'Verification Needed'}</span>
            </button>
          )}

          <button
            onClick={() => setActiveModal('chat')}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs"
            title="Live Support Chat"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KYC Alert if not verified */}
      {user?.kycStatus === 'unverified' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Complete your identity verification (Citizenship/NID) to unlock unlimited withdrawal thresholds.</span>
          </div>
          <button
            onClick={() => setActiveModal('kyc')}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition ml-2 flex-shrink-0"
          >
            Verify
          </button>
        </div>
      )}

      {/* 4-CARD PORTFOLIO OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Available Wallet Balance */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Available Balance</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-slate-900 tracking-tight">
              {formatNPR(availableBal, false)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ready for withdrawal or re-investment</div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveModal('deposit')}
              className="py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition shadow-xs"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
            </button>
            <button
              onClick={() => setActiveModal('withdraw')}
              className="py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1 transition"
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
            </button>
          </div>
        </div>

        {/* 2. Active Invested Capital */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Active Investments</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-slate-900 tracking-tight">
              {formatNPR(investedBal, false)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across <strong className="text-slate-700">{activeInvestments.length}</strong> active portfolio plans
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('plans')}
              className="w-full py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1 transition"
            >
              <span>+ Explore New Plans</span>
            </button>
          </div>
        </div>

        {/* 3. Total Return / Profits Earned */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Total Profit Yield</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-emerald-600 tracking-tight">
              +{formatNPR(totalProfits, false)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Automated daily profit disbursements</div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('investments')}
              className="w-full py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 transition"
            >
              <span>View Yield Schedule</span>
            </button>
          </div>
        </div>

        {/* 4. Referral Commissions */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Referral Earnings</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-display text-slate-900 tracking-tight">
              {formatNPR(referralBonus, false)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Earn 5% - 10% per invited friend</div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('referrals')}
              className="w-full py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center gap-1 transition"
            >
              <span>Invite Friends</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
          Quick Financial Operations
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveModal('deposit')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-500/50 hover:shadow-xs transition text-left"
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Add Money</div>
              <div className="text-[10px] text-slate-400">eSewa / Khalti / Bank</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('withdraw')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-500/50 hover:shadow-xs transition text-left"
          >
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Withdraw</div>
              <div className="text-[10px] text-slate-400">To Nepali Bank</div>
            </div>
          </button>

          <button
            onClick={() => navigate('plans')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-500/50 hover:shadow-xs transition text-left"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">New Plan</div>
              <div className="text-[10px] text-slate-400">12% – 28% Returns</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('chat')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-500/50 hover:shadow-xs transition text-left"
          >
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Support Desk</div>
              <div className="text-[10px] text-slate-400">Instant Help</div>
            </div>
          </button>
        </div>
      </div>

      {/* ACTIVE PORTFOLIO TRACKER & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Investments (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" /> Active Investment Plans
            </h3>
            <button
              onClick={() => navigate('investments')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View all ({investments.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeInvestments.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">No active investments yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choose one of our tailored investment plans to begin earning guaranteed daily yields in NPR.
              </p>
              <button
                onClick={() => navigate('plans')}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Browse Investment Plans
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeInvestments.slice(0, 3).map((inv) => {
                const percent = Math.min(100, Math.round(((inv.durationDays - inv.daysRemaining) / inv.durationDays) * 100));
                return (
                  <div
                    key={inv.id}
                    className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 font-display">{inv.planName}</h4>
                        <span className="text-[11px] text-slate-400">
                          Started on {formatDate(inv.startDate)}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                        {inv.returnRate}% Net Return
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Principal Invested</span>
                        <strong className="text-slate-900">{formatNPR(inv.amount)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Earned Profit</span>
                        <strong className="text-emerald-600 font-display">+{formatNPR(inv.profitEarnedSoFar)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Daily Yield</span>
                        <span className="font-semibold text-slate-700">+{formatNPR(inv.dailyReturnAmount)}/day</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Progress: {percent}%</span>
                        <span>{inv.daysRemaining} days remaining</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Recent Transactions Stream (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900">Recent Activity</h3>
            <button
              onClick={() => navigate('transactions')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              All History <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-3xl bg-white p-4 border border-slate-200/80 divide-y divide-slate-100">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No transactions recorded yet</div>
            ) : (
              recentTransactions.map((tx) => {
                const isCredit = tx.direction === 'in';
                return (
                  <div key={tx.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 capitalize">
                          {tx.type.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-slate-400">{formatDate(tx.createdAt)}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-bold font-display ${
                          isCredit ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatNPR(tx.amount, false)}
                      </div>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${getStatusBadgeClass(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('referrals')}
        className="group flex w-full items-center justify-between rounded-3xl border-2 border-amber-300 bg-white p-5 text-left shadow-sm transition hover:border-amber-500 hover:bg-amber-50/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Refer & Earn</div>
            <div className="text-xs text-slate-500">Share your link and manage all referral rewards</div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-amber-600 transition group-hover:translate-x-1" />
      </button>

      {/* Mandatory Investment Risk Note */}
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Investor Safety Notice:</strong> CapitalNest Nepal maintains ring-fenced cold treasury funds for principal security. Returns are disbursed according to plan schedules. Investment involves market risk.
        </p>
      </div>
    </div>
  );
};
