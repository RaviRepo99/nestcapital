import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatNPR, formatDate, getStatusBadgeClass } from '../lib/utils';
import {
  Layers,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Investment } from '../types';

export const InvestmentsPage: React.FC = () => {
  const { navigate } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        setLoading(true);
        const data = await api.getInvestments();
        setInvestments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestments();
  }, []);

  const filteredInvestments = investments.filter((i) => {
    if (activeTab === 'all') return true;
    return i.status === activeTab;
  });

  const totalInvested = investments.reduce((acc, i) => acc + (i.status === 'active' ? i.amount : 0), 0);
  const totalEarned = investments.reduce((acc, i) => acc + i.profitEarnedSoFar, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-500" />
            My Investment Portfolio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active yields, daily return disbursements, and maturity timelines.
          </p>
        </div>

        <button
          onClick={() => navigate('plans')}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Investment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Active Capital</span>
          <div className="text-2xl font-black font-display text-slate-900">
            {formatNPR(totalInvested, false)}
          </div>
          <span className="text-[11px] text-slate-400">Currently generating daily returns</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total Profits Realized</span>
          <div className="text-2xl font-black font-display text-emerald-600">
            +{formatNPR(totalEarned, false)}
          </div>
          <span className="text-[11px] text-slate-400">Credited to accessible wallet</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total Contracts</span>
          <div className="text-2xl font-black font-display text-amber-500">
            {investments.length}
          </div>
          <span className="text-[11px] text-slate-400">{investments.filter(i => i.status === 'active').length} Active • {investments.filter(i => i.status === 'completed').length} Matured</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(['all', 'active', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
              activeTab === tab
                ? 'bg-[#0B192C] text-amber-400 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab} Plans ({investments.filter((i) => (tab === 'all' ? true : i.status === tab)).length})
          </button>
        ))}
      </div>

      {/* Investments List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading investment records...</div>
      ) : filteredInvestments.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-display text-slate-900">No investment plans found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any investments in this tab yet. Explore our high-yield packages to start growing your capital.
          </p>
          <button
            onClick={() => navigate('plans')}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            Browse Plans & Invest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInvestments.map((inv) => {
            const percent = Math.min(100, Math.round(((inv.durationDays - inv.daysRemaining) / inv.durationDays) * 100));
            const isActive = inv.status === 'active';

            return (
              <div
                key={inv.id}
                className="rounded-3xl bg-white p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-base font-bold font-display text-slate-900">{inv.planName}</h3>
                      <span className="text-[11px] text-slate-400">
                        Contract ID: #{inv.id.slice(0, 10)}
                      </span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${getStatusBadgeClass(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs my-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Principal</span>
                      <strong className="text-slate-900">{formatNPR(inv.amount)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Yield Rate</span>
                      <strong className="text-amber-600">{inv.returnRate}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Total Return</span>
                      <strong className="text-slate-900">{formatNPR(inv.expectedReturn)}</strong>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Total Earned So Far:</span>
                      <strong className="text-emerald-600 font-display">+{formatNPR(inv.profitEarnedSoFar)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Payout Rate:</span>
                      <span className="font-semibold text-slate-900">+{formatNPR(inv.dailyReturnAmount)} / day</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span>{formatDate(inv.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maturity Date:</span>
                      <span className="font-semibold text-slate-900">{formatDate(inv.endDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Maturity: {percent}%</span>
                    <span>{isActive ? `${inv.daysRemaining} days left` : 'Completed'}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isActive ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-emerald-500'
                      }`}
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
  );
};
