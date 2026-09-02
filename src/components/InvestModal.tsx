import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatNPR, calculateProfit, calculateDailyReturn, calculateTotalReturn } from '../lib/utils';
import { X, TrendingUp, Calendar, ShieldCheck, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const InvestModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedPlan,
    wallet,
    updateUserWallet,
    showToast,
    refreshUserData,
    navigate,
  } = useAuth();

  const [amount, setAmount] = useState<number>(selectedPlan?.minimumAmount || 5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedPlan) {
      setAmount(selectedPlan.minimumAmount);
      setError(null);
      setSuccess(false);
      void refreshUserData();
    }
  }, [selectedPlan]);

  if (activeModal !== 'invest' || !selectedPlan) return null;

  const minAmount = selectedPlan.minimumAmount;
  const maxAmount = selectedPlan.maximumAmount || 1000000;
  const availableBal = wallet?.availableBalance || 0;
  const isInsufficient = availableBal < amount;
  const minimumShortfall = Math.max(0, minAmount - availableBal);

  const totalProfit = calculateProfit(amount, selectedPlan.returnRate);
  const totalReturn = calculateTotalReturn(amount, selectedPlan.returnRate);
  const dailyYield = calculateDailyReturn(amount, selectedPlan.returnRate, selectedPlan.durationDays);

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + selectedPlan.durationDays * 24 * 60 * 60 * 1000);

  const handleConfirm = async () => {
    setError(null);

    if (amount < minAmount) {
      setError(`Minimum investment for this plan is ${formatNPR(minAmount)}.`);
      return;
    }

    if (amount > maxAmount) {
      setError(`Maximum investment for this plan is ${formatNPR(maxAmount)}.`);
      return;
    }

    if (isInsufficient) {
      setError(`Insufficient wallet balance. You need ${formatNPR(amount - availableBal)} more.`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.createInvestment({
        planId: selectedPlan.id,
        amount,
      });

      updateUserWallet(res.wallet);
      setSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#F59E0B', '#0B192C', '#10B981'],
      });

      showToast(`Successfully invested ${formatNPR(amount)} into ${selectedPlan.name}!`, 'success');
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || 'Failed to activate investment.');
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

          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Confirm Investment
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
            {selectedPlan.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="bg-amber-500 text-slate-950 font-extrabold text-xs px-2.5 py-0.5 rounded-md">
              {selectedPlan.returnRate}% Net Return
            </span>
            <span className="bg-slate-800 text-slate-300 font-medium text-xs px-2.5 py-0.5 rounded-md">
              {selectedPlan.durationDays} Days Term
            </span>
            <span className="bg-slate-800 text-slate-300 font-medium text-xs px-2.5 py-0.5 rounded-md">
              Paid at Maturity
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold font-display text-slate-900">Investment Activated!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your investment of <strong className="text-slate-900">{formatNPR(amount)}</strong> has been confirmed. Principal and the configured percentage profit will be credited after the {selectedPlan.durationDays}-day term.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => {
                    setActiveModal(null);
                    navigate('investments');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0B192C] text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  View Active Portfolio
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Wallet Balance Status */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs">
                  <span className="text-slate-500 block">Available Wallet Balance</span>
                  <span className="font-bold text-base text-slate-900 font-display">
                    {formatNPR(availableBal)}
                  </span>
                </div>
                {isInsufficient ? (
                  <button
                    onClick={() => setActiveModal('deposit')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
                  >
                    + Add Funds
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5" /> Sufficient Funds
                  </span>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Investment Amount (NPR)</span>
                  <span className="text-slate-400 font-normal">Min: {formatNPR(minAmount, false)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    NPR
                  </span>
                  <input
                    type="number"
                    min={minAmount}
                    max={maxAmount}
                    step={1000}
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-300 pl-16 pr-4 py-3 text-lg font-bold font-display text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                    placeholder="Enter amount"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
                  {[minAmount, minAmount + 5000, minAmount + 10000, minAmount + 25000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                        amount === preset
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {formatNPR(preset, false)}
                    </button>
                  ))}
                </div>
                {(isInsufficient || amount < minAmount) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                    {minimumShortfall > 0
                      ? `You need ${formatNPR(minimumShortfall)} more to buy this package.`
                      : `Minimum for this package is ${formatNPR(minAmount)}.`}
                  </div>
                )}
              </div>

              {/* Dynamic Projection Breakdown */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-[#0B192C] text-white p-4 space-y-3">
                <div className="text-xs font-semibold text-amber-400 flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <span>Portfolio Projection</span>
                  <span>{selectedPlan.durationDays} Days</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Expected Net Profit</span>
                    <span className="text-base font-bold text-amber-400 font-display">
                      +{formatNPR(totalProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Total Return (Principal + Profit)</span>
                    <span className="text-base font-bold text-white font-display">
                      {formatNPR(totalReturn)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Profit at Maturity</span>
                    <span className="text-xs font-semibold text-emerald-400 font-display">
                      +{formatNPR(totalProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Maturity Date</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Legal Disclaimer */}
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Investment involves risk. Expected returns are credited automatically based on configured plan schedules. Principal capital is unlocked upon plan maturity.
              </p>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading || isInsufficient || amount < minAmount}
                  className={`w-2/3 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition ${
                    isInsufficient || amount < minAmount
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-98'
                  }`}
                >
                  {loading ? (
                    <span>Processing Investment...</span>
                  ) : (
                    <>
                      <span>Confirm & Invest</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
