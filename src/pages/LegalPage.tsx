import React, { useState } from 'react';
import { Lock, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';

interface LegalProps {
  initialTab?: 'terms' | 'privacy' | 'risk';
}

export const LegalPage: React.FC<LegalProps> = ({ initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'risk'>(initialTab);

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold font-display text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-amber-500" />
          Legal & Compliance Documentation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          CapitalNest Nepal corporate policies, terms of service, and mandatory risk disclosures.
        </p>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'terms'
                ? 'bg-[#0B192C] text-amber-400 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Terms & Conditions
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'privacy'
                ? 'bg-[#0B192C] text-amber-400 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'risk'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Risk Disclosure
          </button>
        </div>
      </div>

      {/* Mandatory Investment Risk Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-slate-900 text-xs leading-relaxed flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-950 font-bold block mb-0.5">Mandatory Risk Warning:</strong>
          Investment involves risk. Please review the applicable terms and conditions before investing. Capital returns and investment yield rates are subject to plan terms. Past performance does not guarantee future results.
        </div>
      </div>

      {/* Content Body */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-xs text-slate-600 leading-relaxed">
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the CapitalNest Nepal platform ("Service"), you agree to be legally bound by these Terms of Service. If you do not agree to these terms, do not access or use the Service.
            </p>

            <h2 className="text-lg font-bold font-display text-slate-900">2. Eligibility & KYC Verification</h2>
            <p>
              To use CapitalNest Nepal, you must be at least 18 years of age and legally capable of entering into binding financial contracts under the laws of Nepal. You agree to provide accurate, current, and complete information, including valid Nepali identification (Citizenship Card, NID, or Passport) for Anti-Money Laundering (AML) and Know-Your-Customer (KYC) compliance.
            </p>

            <h2 className="text-lg font-bold font-display text-slate-900">3. Deposits and Treasury Management</h2>
            <p>
              All deposits made via eSewa, Khalti, ConnectIPS, or Commercial Banks are credited to user wallets upon manual or algorithmic treasury verification of transaction reference identifiers. CapitalNest Nepal reserves the right to reject deposits from unauthorized third-party accounts.
            </p>

            <h2 className="text-lg font-bold font-display text-slate-900">4. Investment Contracts & Payouts</h2>
            <p>
              Investments in fixed-return plans are locked for the duration specified in the contract term. Daily yields are calculated and credited automatically to the user's available wallet balance. Principal capital is unlocked and returned in full upon contract maturity.
            </p>

            <h2 className="text-lg font-bold font-display text-slate-900">5. Withdrawals</h2>
            <p>
              Withdrawals are processed exclusively to verified Nepali bank accounts or registered digital wallets in the account holder's name. Processing turnaround times typically range from 1 to 24 business hours.
            </p>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display text-slate-900">1. Data Collection</h2>
            <p>
              We collect information you provide directly to us when opening an account, including your full legal name, email address, mobile phone number, and KYC identity documentation.
            </p>

            <h2 className="text-lg font-bold font-display text-slate-900">2. Usage of Information</h2>
            <p>
              Your personal and financial information is used strictly to process transactions, prevent financial crime, fulfill regulatory compliance obligations in Nepal, and maintain secure user authentication sessions.
            </p>

            <h2 className="text-lg font-bold font-display text-slate-900">3. Data Security & Storage</h2>
            <p>
              We employ enterprise TLS 256-bit cryptographic encryption across all client-server communications. We never sell or lease user data to third-party advertising brokers.
            </p>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display text-slate-900">Comprehensive Risk Disclosure</h2>
            <p>
              CapitalNest Nepal operates structured capital allocations across verified algorithmic yielding systems, asset-backed lending, and diversified financial vehicles in Nepal. However, all investments carry inherent market risks.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Yield rates and projected returns depend on the fulfillment of contract terms and macroeconomic conditions.</li>
              <li>Early contract termination is subject to plan-specific liquidation terms and potential penalty adjustments.</li>
              <li>Users should only invest capital they can allocate for the duration of the chosen investment plan.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
