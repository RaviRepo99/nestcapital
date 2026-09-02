import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatNPR } from '../lib/utils';
import {
  X,
  Building,
  Smartphone,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { WithdrawalMethod } from '../types';

export const WithdrawModal: React.FC = () => {
  const { activeModal, setActiveModal, wallet, user, showToast, refreshUserData, updateUserWallet } = useAuth();

  const [amount, setAmount] = useState<number>(5000);
  const [method, setMethod] = useState<WithdrawalMethod>('bank_account');
  const [bankName, setBankName] = useState('Nabil Bank Ltd');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [branchName, setBranchName] = useState('Kathmandu Main');
  const [walletId, setWalletId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (activeModal !== 'withdraw') return null;

  const availableBal = wallet?.availableBalance || 0;
  const minWithdrawal = 1000;
  const isInsufficient = availableBal < amount;
  const isKycVerified = user?.kycStatus === 'verified';

  const NEPAL_BANKS = [
    'Nabil Bank Ltd',
    'NIC Asia Bank Ltd',
    'Global IME Bank Ltd',
    'Rastriya Banijya Bank',
    'Sanima Bank Ltd',
    'Standard Chartered Bank Nepal',
    'Everest Bank Ltd',
    'Himalayan Bank Ltd',
    'Prabhu Bank Ltd',
    'Siddhartha Bank Ltd',
    'Kumari Bank Ltd',
    'Prime Commercial Bank Ltd',
    'NMB Bank Ltd',
    'Citizens Bank International',
    'Nepal Investment Mega Bank',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isKycVerified) {
      setError('KYC verification is required before you can withdraw funds.');
      return;
    }

    if (!amount || amount < minWithdrawal) {
      setError(`Minimum withdrawal amount is ${formatNPR(minWithdrawal)}.`);
      return;
    }

    if (isInsufficient) {
      setError(`Insufficient available balance (${formatNPR(availableBal)}).`);
      return;
    }

    const accountDetails =
      method === 'bank_account'
        ? { bankName, accountNumber, accountHolderName, branchName }
        : { walletId, accountHolderName };

    if (method === 'bank_account' && (!accountNumber || !accountHolderName)) {
      setError('Bank account number and account holder name are required.');
      return;
    }

    if ((method === 'esewa' || method === 'khalti') && (!walletId || !accountHolderName)) {
      setError('Wallet ID and registered account name are required.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createWithdrawal({
        amount,
        method,
        accountDetails,
      });

      updateUserWallet(res.wallet);
      setSubmitted(true);
      showToast(`Withdrawal request of ${formatNPR(amount)} placed successfully.`, 'success');
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || 'Failed to request withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B192C] via-[#0F284E] to-[#07111F] text-white p-5 sm:p-6 relative">
          <button
            onClick={() => setActiveModal(null)}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
            Withdraw Funds
          </h3>
          <p className="text-slate-300 text-xs mt-1">
            Transfer your investment earnings and available balance to your bank or digital wallet.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold font-display text-slate-900">Withdrawal Request Placed</h4>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <strong className="text-slate-900">{formatNPR(amount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-semibold uppercase text-slate-800">{method.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payout Target:</span>
                  <span className="font-mono text-slate-800">
                    {method === 'bank_account' ? `${bankName} (${accountNumber})` : walletId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-600 uppercase">Pending Verification</span>
                </div>
              </div>
              <p className="max-w-sm mx-auto text-center text-sm font-bold text-slate-900">
                Withdrawal will arrive within 48 hours.
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Payout requests are reviewed by our treasury desk and disbursed via ConnectIPS or direct merchant wallet transfer.
              </p>
              <button
                onClick={() => setActiveModal(null)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#0B192C] text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isKycVerified && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
                  <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                  <span>Verify your KYC before requesting a withdrawal.</span>
                </div>
              )}

              {/* Available Balance Status */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Available for Withdrawal</span>
                  <span className="font-bold text-slate-900 font-display text-base">
                    {formatNPR(availableBal)}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  Min: {formatNPR(minWithdrawal, false)}
                </span>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Withdrawal Amount (NPR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    NPR
                  </span>
                  <input
                    type="number"
                    min={minWithdrawal}
                    max={availableBal || undefined}
                    step={100}
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-300 pl-16 pr-4 py-2.5 text-base font-bold font-display text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                    placeholder="5,000"
                    required
                  />
                </div>
                {/* Max Quick Fill */}
                <div className="flex items-center justify-between mt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setAmount(Math.floor(availableBal))}
                    className="text-amber-600 font-semibold hover:underline"
                  >
                    Withdraw All (Max)
                  </button>
                  {isInsufficient && (
                    <span className="text-rose-600 font-semibold text-[11px]">Amount exceeds balance</span>
                  )}
                </div>
              </div>

              {/* Method Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Payout Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bank_account', label: 'Bank Account', icon: Building },
                    { id: 'esewa', label: 'eSewa Wallet', icon: Smartphone },
                    { id: 'khalti', label: 'Khalti Wallet', icon: Smartphone },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id as WithdrawalMethod)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs text-slate-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-amber-600" />
                        <span className="text-xs">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method Specific Fields */}
              {method === 'bank_account' ? (
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Bank Name
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:border-amber-500 outline-none"
                    >
                      {NEPAL_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 01928374619"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold bg-white text-slate-900 focus:border-amber-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="As in bank book"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:border-amber-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. New Road / Thamel"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white text-slate-900 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {method === 'esewa' ? 'eSewa ID (Mobile Number) *' : 'Khalti ID (Mobile Number) *'}
                    </label>
                    <input
                      type="text"
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      placeholder="e.g. 9841234567"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold bg-white text-slate-900 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Wallet Registered Name *
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Full Name on Digital Wallet"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white text-slate-900 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Information Alert */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-800 text-[11px]">
                <Info className="w-4 h-4 flex-shrink-0 text-blue-600 mt-0.5" />
                <span>
                  Withdrawals are processed from your available wallet balance. Verified requests are dispatched within 24 business hours.
                </span>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading || isInsufficient || amount < minWithdrawal || !isKycVerified}
                className="w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
