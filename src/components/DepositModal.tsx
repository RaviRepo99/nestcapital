import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatNPR, copyToClipboard } from '../lib/utils';
import {
  X,
  QrCode,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Clock,
  ShieldCheck,
  Smartphone,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { PaymentMethod, PaymentSetting } from '../types';

export const DepositModal: React.FC = () => {
  const { activeModal, setActiveModal, wallet, showToast, refreshUserData } = useAuth();

  const [amount, setAmount] = useState<number>(15000);
  const [method, setMethod] = useState<PaymentMethod>('esewa');
  const [reference, setReference] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);

  useEffect(() => {
    api.getPaymentSettings().then(setPaymentSettings).catch(() => undefined);
  }, []);

  if (activeModal !== 'deposit') return null;

  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      showToast('Copied to clipboard!', 'info');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result as string);
        showToast('Payment receipt uploaded.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || amount <= 0) {
      setError('Please enter a valid deposit amount.');
      return;
    }

    if (!reference.trim()) {
      setError('Transaction Reference / UTR Number is required for verification.');
      return;
    }

    try {
      setLoading(true);
      await api.createDeposit({
        amount,
        paymentMethod: method,
        paymentReference: reference.trim(),
        senderName: senderName.trim(),
        senderAccount: senderAccount.trim(),
        paymentProof,
        notes: notes.trim(),
      });

      setSubmitted(true);
      showToast('Deposit request submitted! Our treasury team is verifying your payment.', 'success');
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit deposit.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = paymentSettings.find((setting) => setting.id === method) || {
    title: method === 'fonepay' ? 'Fonepay Merchant' : method === 'khalti' ? 'Khalti Merchant ID' : 'eSewa Merchant Wallet',
    accountId: '',
    accountName: '',
    qrImage: '',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-3rem)] rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-y-auto text-slate-900 animate-in fade-in zoom-in-95 my-0 sm:my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B192C] via-[#0F284E] to-[#07111F] text-white p-5 sm:p-6 relative">
          <button
            onClick={() => setActiveModal(null)}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
            Add Money / Deposit
          </h3>
          <p className="text-slate-300 text-xs mt-1">
            Deposit funds via official Nepal banking channels or digital wallets.
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto ring-8 ring-amber-50 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold font-display text-slate-900">Deposit Request Received</h4>
              <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <strong className="text-slate-900">{formatNPR(amount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-semibold uppercase text-slate-800">{method.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-mono text-slate-800">{reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-700 uppercase">Pending Verification</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Our treasury team will verify the incoming transfer against our merchant ledger. Once approved, your wallet balance will update automatically.
              </p>
              <button
                onClick={() => setActiveModal(null)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#0B192C] text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Available Balance Preview */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="text-slate-500">Current Available Balance:</span>
                <span className="font-bold text-slate-900 font-display text-sm">
                  {formatNPR(wallet?.availableBalance)}
                </span>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Deposit Amount (NPR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    NPR
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-300 pl-16 pr-4 py-2.5 text-base font-bold font-display text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                    placeholder="5,000"
                    required
                  />
                </div>
                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {[5000, 15000, 25000, 50000, 95000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition ${
                        amount === val
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {formatNPR(val, false)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'esewa', label: 'eSewa', icon: Smartphone, color: 'text-emerald-600' },
                    { id: 'khalti', label: 'Khalti', icon: Smartphone, color: 'text-purple-600' },
                    { id: 'fonepay', label: 'Fonepay', icon: CreditCard, color: 'text-rose-600' },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id as PaymentMethod)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${m.color}`} />
                        <span className="text-xs font-bold text-slate-900">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Receiver Account Details Box */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0B192C] text-white space-y-2 text-xs">
                <div className="flex items-center justify-between text-amber-400 font-semibold border-b border-slate-700/60 pb-1.5">
                    <span>{selectedAccount.title}</span>
                  <span className="text-[10px] text-slate-400">Official Merchant</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-400 text-[11px]">Account Name:</span>
                    <span className="font-semibold text-white text-right break-words">{selectedAccount.accountName}</span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-400 text-[11px]">Account Number / ID:</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-amber-300 text-sm">
                        {selectedAccount.accountId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedAccount.accountId, 'acc')}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Copy account number"
                      >
                        {copiedKey === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Scan to pay with QR:</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" /> Merchant QR Active
                  </span>
                </div>
                {selectedAccount.qrImage && (
                  <img src={selectedAccount.qrImage} alt={`${selectedAccount.title} QR code`} className="mx-auto mt-2 h-36 w-36 rounded-xl bg-white object-contain p-2" />
                )}
              </div>

              {/* Transaction Reference (Required) */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between mb-1">
                  <span>Transaction ID / Reference Number *</span>
                  <span className="text-slate-400 font-normal">From receipt</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. ESEWA-998822 or NABIL-TX-1092"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  required
                />
              </div>

              {/* Sender Name & Account */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Sender Account Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Your legal name"
                    className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Sender Mobile / Account
                  </label>
                  <input
                    type="text"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    placeholder="e.g. 9841..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Upload Payment Screenshot / Slip (Optional)
                </label>
                <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-slate-200 rounded-xl hover:border-amber-500 hover:bg-slate-50 cursor-pointer transition text-xs text-slate-600">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>{paymentProof ? 'Receipt Selected (Click to change)' : 'Select image or slip'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
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
                disabled={loading || !reference.trim() || !amount}
                className="w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Deposit Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
