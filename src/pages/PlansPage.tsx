import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PLANS } from '../data/plans';
import { formatNPR, calculateProfit, calculateTotalReturn } from '../lib/utils';
import {
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Building,
  Award,
} from 'lucide-react';
import { InvestmentPlan } from '../types';

export const PlansPage: React.FC = () => {
  const { openInvestModal, isAuthenticated, navigate } = useAuth();
  const [calculatorAmount, setCalculatorAmount] = useState<number>(50000);
  const [selectedPlanForCalc, setSelectedPlanForCalc] = useState<InvestmentPlan>(PLANS[1]);

  const calcProfit = calculateProfit(calculatorAmount, selectedPlanForCalc.returnRate);
  const calcTotal = calculateTotalReturn(calculatorAmount, selectedPlanForCalc.returnRate);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>High-Yield Investment Portfolios</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
          Fixed-Return Investment Plans
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
          Select from our transparent range of investment tiers. Earn scheduled daily returns in NPR with full principal return at plan maturity.
        </p>
      </div>

      {/* PLANS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl p-6 bg-white border transition-all duration-200 flex flex-col justify-between ${
              plan.isPopular
                ? 'border-amber-500 shadow-xl ring-2 ring-amber-500/20 relative'
                : 'border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300'
            }`}
          >
            {plan.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow-xs">
                Most Popular Choice
              </span>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold font-display text-slate-900">{plan.name}</h3>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                  {plan.durationDays} Days
                </span>
              </div>

              <div className="mb-5">
                <div className="text-3xl font-black font-display text-slate-900">
                  {plan.returnRate}% <span className="text-xs text-slate-500 font-normal">Net Return</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Daily Yield: ~{(plan.returnRate / plan.durationDays).toFixed(2)}% / day
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4 mb-6">
                <div className="flex justify-between">
                  <span>Minimum Capital:</span>
                  <strong className="text-slate-900">{formatNPR(plan.minimumAmount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Maximum Capital:</span>
                  <strong className="text-slate-900">{formatNPR(plan.maximumAmount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Payout Frequency:</span>
                  <span className="font-semibold text-slate-900">{plan.payoutFrequency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Principal Protection:</span>
                  <span className="font-semibold text-emerald-600">100% Guaranteed</span>
                </div>
                <div className="flex justify-between">
                  <span>Withdrawal Fees:</span>
                  <span className="font-semibold text-slate-900">0% (Free)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (isAuthenticated) {
                  openInvestModal(plan);
                } else {
                  navigate('register');
                }
              }}
              className={`w-full py-3 rounded-2xl font-bold text-xs transition active:scale-98 ${
                plan.isPopular
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-[#0B192C] hover:bg-slate-800 text-white'
              }`}
            >
              Invest In {plan.name}
            </button>
          </div>
        ))}
      </div>

      {/* INTERACTIVE COMPARISON CALCULATOR */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#0F284E] to-[#07111F] text-white p-6 sm:p-8 shadow-2xl border border-amber-500/20 max-w-4xl mx-auto">
        <div className="text-center mb-6 space-y-1">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
            Live Profit Modeler
          </span>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
            Simulate Your Investment Earnings
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Choose Plan
              </label>
              <select
                value={selectedPlanForCalc.id}
                onChange={(e) => {
                  const p = PLANS.find((plan) => plan.id === e.target.value) || PLANS[0];
                  setSelectedPlanForCalc(p);
                  if (calculatorAmount < p.minimumAmount) {
                    setCalculatorAmount(p.minimumAmount);
                  }
                }}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
              >
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.returnRate}% • {p.durationDays} Days)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300">Investment Amount</span>
                <span className="font-bold text-amber-400 font-display text-sm">
                  {formatNPR(calculatorAmount, false)}
                </span>
              </div>
              <input
                type="range"
                min={selectedPlanForCalc.minimumAmount}
                max={500000}
                step={5000}
                value={calculatorAmount}
                onChange={(e) => setCalculatorAmount(Number(e.target.value))}
                className="w-full accent-amber-400 bg-slate-700 rounded-lg h-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Results Display */}
          <div className="p-5 rounded-2xl bg-[#07111F] border border-slate-700/80 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Net Yield:</span>
              <strong className="text-amber-400 font-bold">{selectedPlanForCalc.returnRate}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duration Term:</span>
              <span className="text-slate-200">{selectedPlanForCalc.durationDays} Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Daily Earnings:</span>
              <strong className="text-emerald-400">
                +{formatNPR(calculateProfit(calculatorAmount, selectedPlanForCalc.returnRate) / selectedPlanForCalc.durationDays)} / day
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Expected Profit:</span>
              <strong className="text-emerald-400 font-display text-base">
                +{formatNPR(calcProfit)}
              </strong>
            </div>
            <div className="pt-2.5 border-t border-slate-700 flex justify-between font-bold text-sm">
              <span className="text-white">Total Payout at Maturity:</span>
              <span className="text-amber-400 font-display text-base">{formatNPR(calcTotal)}</span>
            </div>

            <button
              onClick={() => {
                if (isAuthenticated) {
                  openInvestModal(selectedPlanForCalc);
                } else {
                  navigate('register');
                }
              }}
              className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              Invest {formatNPR(calculatorAmount, false)} Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
