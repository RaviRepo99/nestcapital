import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PLANS } from '../data/plans';
import { FAQS } from '../data/faqs';
import { BrandLogo } from '../components/BrandLogo';
import { formatNPR, calculateProfit, calculateTotalReturn } from '../lib/utils';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Users,
  Smartphone,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  ChevronDown,
  HelpCircle,
  Clock,
  Award,
  Wallet,
  Coins,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate, openInvestModal, isAuthenticated } = useAuth();

  // Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(25000);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_silver');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const activePlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];
  const projectedProfit = calculateProfit(calcAmount, activePlan.returnRate);
  const projectedTotal = calculateTotalReturn(calcAmount, activePlan.returnRate);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#07111F] via-[#0B192C] to-[#0F284E] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Background glow decorations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Heading & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Nepal's Premier Smart Wealth & Yield Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.1]">
              Grow Your Wealth With <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                Guaranteed Yields
              </span>{' '}
              In Nepal.
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              CapitalNest Nepal empowers individual investors and institutions with transparent, high-performing investment plans. Enjoy daily profit payouts in NPR deposited straight to your Nepali bank, eSewa, or Khalti.
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-lg sm:text-2xl font-bold font-display text-amber-400">NPR 45M+</div>
                <div className="text-[11px] text-slate-400">Total Capital Managed</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-lg sm:text-2xl font-bold font-display text-emerald-400">100%</div>
                <div className="text-[11px] text-slate-400">On-Time Daily Payouts</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-lg sm:text-2xl font-bold font-display text-amber-400">8,500+</div>
                <div className="text-[11px] text-slate-400">Active Nepali Investors</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-3">
              <button
                onClick={() => navigate(isAuthenticated ? 'dashboard' : 'register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-98"
              >
                <span>{isAuthenticated ? 'Go To My Dashboard' : 'Open Free Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('plans')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-semibold text-sm transition"
              >
                Explore All Plans
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Yield Calculator Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-gradient-to-b from-slate-900/95 to-[#0B192C]/95 border border-amber-500/30 p-6 shadow-2xl backdrop-blur-md text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold font-display text-white">Profit Return Calculator</h3>
                  <p className="text-[11px] text-slate-400">Estimate your returns in NPR instantly</p>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Plan Select Pills */}
              <div className="space-y-1.5 mb-4">
                <label className="text-[11px] font-semibold text-slate-400">Select Investment Plan</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PLANS.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPlanId(p.id);
                        if (calcAmount < p.minimumAmount) setCalcAmount(p.minimumAmount);
                      }}
                      className={`p-2 rounded-xl text-center text-xs font-semibold transition border ${
                        selectedPlanId === p.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      <div>{p.name.replace(' Plan', '')}</div>
                      <div className="text-[10px] opacity-80">{p.returnRate}%</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Slider & Input */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Investment Capital (NPR)</span>
                  <span className="font-bold text-amber-400 text-sm font-display">
                    {formatNPR(calcAmount, false)}
                  </span>
                </div>
                <input
                  type="range"
                  min={activePlan.minimumAmount}
                  max={250000}
                  step={2500}
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-700 rounded-lg h-2 cursor-pointer"
                />
              </div>

              {/* Breakdown */}
              <div className="rounded-2xl bg-[#07111F] p-4 space-y-2.5 border border-slate-800/80 mb-5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Return Rate:</span>
                  <span className="font-bold text-amber-400">{activePlan.returnRate}% Net Yield</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Duration Term:</span>
                  <span className="text-slate-200">{activePlan.durationDays} Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Estimated Profit:</span>
                  <span className="font-bold text-emerald-400 font-display text-sm">
                    +{formatNPR(projectedProfit)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm">
                  <span className="text-white">Total Payout:</span>
                  <span className="text-amber-400 font-display text-base">
                    {formatNPR(projectedTotal)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (isAuthenticated) {
                    openInvestModal(activePlan);
                  } else {
                    navigate('register');
                  }
                }}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Invest in {activePlan.name} Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE CAPITALNEST NEPAL */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-amber-600 font-bold text-xs uppercase tracking-wider">
            Engineered For Nepali Investors
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-display">
            Why Thousands Choose CapitalNest Nepal
          </h2>
          <p className="text-slate-600 text-sm">
            Institutional-grade risk management tailored specifically to local digital payment gateways and Nepal banking rails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-amber-500/40 hover:shadow-lg transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-slate-900">Instant Local Integration</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Deposit and withdraw seamlessly using eSewa, Khalti, ConnectIPS, or direct transfers across all 20+ Commercial Banks in Nepal.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-amber-500/40 hover:shadow-lg transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-slate-900">Daily Automated Yields</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Earnings are calculated algorithmically and credited daily to your accessible wallet balance, ready for instant withdrawal.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-amber-500/40 hover:shadow-lg transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-slate-900">Secured & Encrypted</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Strict KYC verification, 256-bit TLS encrypted sessions, and audited cold reserve treasury safeguards your hard-earned wealth.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED INVESTMENT PLANS */}
      <section className="py-20 bg-slate-50 border-y border-slate-200/70 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-amber-600 font-bold text-xs uppercase tracking-wider">
              Transparent Portfolios
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Curated Investment Plans
            </h2>
            <p className="text-slate-600 text-sm">
              Choose the duration and return structure that matches your personal wealth goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 transition-all duration-200 bg-white border flex flex-col justify-between ${
                  plan.isPopular
                    ? 'border-amber-500 shadow-xl ring-2 ring-amber-500/20 relative'
                    : 'border-slate-200 hover:shadow-md'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow-xs">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-display text-slate-900">{plan.name}</h3>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                      {plan.durationDays} Days
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="text-3xl font-black font-display text-slate-900">
                      {plan.returnRate}% <span className="text-xs text-slate-500 font-normal">Net Return</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Daily Payout: ~{(plan.returnRate / plan.durationDays).toFixed(2)}%/day
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4 mb-6">
                    <div className="flex justify-between">
                      <span>Minimum Investment:</span>
                      <strong className="text-slate-900">{formatNPR(plan.minimumAmount)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum Investment:</span>
                      <strong className="text-slate-900">{formatNPR(plan.maximumAmount)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Payout Frequency:</span>
                      <span className="font-semibold text-slate-900">{plan.payoutFrequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Principal Return:</span>
                      <span className="font-semibold text-emerald-600">100% at Maturity</span>
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
                  Invest In This Plan
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => navigate('plans')}
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
            >
              <span>View all 5 Investment Plans (Including Institutional)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* SUPPORTED NEPAL PAYMENT GATEWAYS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-100">
        <div className="text-center mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Seamlessly Integrated With Nepal's Financial Rails
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2">
              eSewa
            </div>
            <div className="font-bold text-xs text-slate-900">eSewa Wallet</div>
            <div className="text-[10px] text-slate-500">Instant Deposit & Payout</div>
          </div>

          <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm mb-2">
              Khalti
            </div>
            <div className="font-bold text-xs text-slate-900">Khalti Digital</div>
            <div className="text-[10px] text-slate-500">Quick QR Verification</div>
          </div>

          <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-2">
              IPS
            </div>
            <div className="font-bold text-xs text-slate-900">ConnectIPS</div>
            <div className="text-[10px] text-slate-500">Direct Account Transfer</div>
          </div>

          <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm mb-2">
              Banks
            </div>
            <div className="font-bold text-xs text-slate-900">All Commercial Banks</div>
            <div className="text-[10px] text-slate-500">Nabil, NIC Asia, Global IME+</div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <span className="text-amber-600 font-bold text-xs uppercase tracking-wider">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.slice(0, 5).map((faq) => {
            const isOpen = expandedFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-amber-600 transition"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* MANDATORY RISK WARNING & FOOTER */}
      <footer className="bg-[#07111F] text-slate-400 border-t border-slate-800/80 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Mandatory Risk Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed flex items-start gap-3">
            <Lock className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Important Risk Disclosure:</strong>
              Investment involves risk. Please review the applicable terms and conditions before investing. Capital returns and investment yield rates are subject to plan terms. Past performance does not guarantee future results.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
            <div className="space-y-3 md:col-span-2">
              <BrandLogo size="md" variant="white" />
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                CapitalNest Nepal is a modern fintech investment platform dedicated to empowering Nepali investors with stable, automated daily yield portfolios.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-white text-sm font-display mb-2">Quick Navigation</div>
              <div><button onClick={() => navigate('plans')} className="hover:text-amber-400">Investment Plans</button></div>
              <div><button onClick={() => navigate('faq')} className="hover:text-amber-400">Help & FAQs</button></div>
              <div><button onClick={() => navigate('support')} className="hover:text-amber-400">Customer Desk</button></div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-white text-sm font-display mb-2">Legal & Compliance</div>
              <div><button onClick={() => navigate('terms')} className="hover:text-amber-400">Terms & Conditions</button></div>
              <div><button onClick={() => navigate('privacy')} className="hover:text-amber-400">Privacy Policy</button></div>
              <div><button onClick={() => navigate('risk')} className="hover:text-amber-400">Risk Disclosure</button></div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} CapitalNest Nepal Pvt. Ltd. All rights reserved. Registered under Company Registrar of Nepal.
          </div>
        </div>
      </footer>
    </div>
  );
};
