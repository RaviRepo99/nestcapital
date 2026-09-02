import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatNPR, formatDate, getStatusBadgeClass } from '../lib/utils';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Smartphone,
  CreditCard,
  Layers,
} from 'lucide-react';
import { Deposit, Withdrawal } from '../types';

export const WalletPage: React.FC = () => {
  const { wallet, setActiveModal, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [depData, withData] = await Promise.all([
          api.getDeposits(),
          api.getWithdrawals(),
        ]);
        setDeposits(depData);
        setWithdrawals(withData);
      } catch (err) {
        console.error('Failed to load wallet logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-500" />
            My Funds & Wallet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deposit capital, manage payout accounts, and review incoming/outgoing fund transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveModal('deposit')}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
          >
            <ArrowDownLeft className="w-4 h-4" /> Add Money
          </button>
          <button
            onClick={() => setActiveModal('withdraw')}
            className="px-4 py-2.5 rounded-2xl bg-[#0B192C] hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0B192C] to-[#0F284E] text-white shadow-md border border-amber-500/20">
          <span className="text-xs text-amber-300/90 font-semibold block mb-1">Available Balance</span>
          <div className="text-2xl font-black font-display text-white">
            {formatNPR(wallet?.availableBalance, false)}
          </div>
          <span className="text-[10px] text-slate-300 mt-1 block">Withdrawable immediately</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Locked in Investments</span>
          <div className="text-2xl font-black font-display text-slate-900">
            {formatNPR(wallet?.investedBalance, false)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Principal capital locked</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total Lifetime Profit</span>
          <div className="text-2xl font-black font-display text-emerald-600">
            +{formatNPR(wallet?.totalEarnings, false)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Automated yield disbursements</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total Withdrawn</span>
          <div className="text-2xl font-black font-display text-slate-900">
            {formatNPR(wallet?.totalWithdrawn, false)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Successfully disbursed</span>
        </div>
      </div>

      {/* TABS: Deposits vs Withdrawals */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center gap-4 p-4 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'deposits'
                ? 'bg-[#0B192C] text-amber-400 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Deposit History ({deposits.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'withdrawals'
                ? 'bg-[#0B192C] text-amber-400 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Withdrawal History ({withdrawals.length})
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading wallet ledger...</div>
          ) : activeTab === 'deposits' ? (
            deposits.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No deposit history yet. Click "Add Money" to make your first deposit.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Reference / ID</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deposits.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-slate-900">{d.paymentReference}</td>
                        <td className="p-3 font-medium uppercase">{d.paymentMethod.replace('_', ' ')}</td>
                        <td className="p-3 font-bold text-slate-900 font-display">{formatNPR(d.amount)}</td>
                        <td className="p-3 text-slate-400">{formatDate(d.createdAt)}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadgeClass(d.status)}`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : withdrawals.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No withdrawal requests recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Target Details</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono text-[11px] text-slate-400">#{w.id.slice(0, 8)}</td>
                      <td className="p-3 font-semibold uppercase">{w.method.replace('_', ' ')}</td>
                      <td className="p-3 font-mono text-slate-800">
                        {w.method === 'bank_account'
                          ? `${w.accountDetails?.bankName} (${w.accountDetails?.accountNumber})`
                          : `${w.accountDetails?.walletId} (${w.accountDetails?.accountHolderName})`}
                      </td>
                      <td className="p-3 font-bold text-slate-900 font-display">{formatNPR(w.amount)}</td>
                      <td className="p-3 text-slate-400">{formatDate(w.createdAt)}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadgeClass(w.status)}`}>
                          {w.status}
                        </span>
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
