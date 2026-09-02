import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  X,
  ShieldCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  FileText,
  CreditCard,
  Building,
} from 'lucide-react';

export const KYCModal: React.FC = () => {
  const { activeModal, setActiveModal, user, showToast, refreshUserData } = useAuth();

  const [documentType, setDocumentType] = useState('Citizenship Card');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentImage, setDocumentImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (activeModal !== 'kyc') return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentImage(reader.result as string);
        showToast('Document scan attached.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!documentNumber.trim()) {
      setError('Please provide your official document identification number.');
      return;
    }

    try {
      setLoading(true);
      await api.submitKYC({
        documentType,
        documentNumber: documentNumber.trim(),
        documentImage,
      });

      setSubmitted(true);
      showToast('KYC documents submitted for compliance review!', 'success');
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC verification.');
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
            <ShieldCheck className="w-4 h-4" /> AML & KYC Compliance
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
            Identity Verification
          </h3>
          <p className="text-slate-300 text-xs mt-1">
            Required by Nepal regulatory guidelines to unlock unlimited withdrawals.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto ring-8 ring-amber-50">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold font-display text-slate-900">Documents Submitted</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your KYC submission is currently under review by our compliance desk. You will receive an email and in-app notification once verified.
              </p>
              <button
                onClick={() => setActiveModal(null)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#0B192C] text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-medium text-slate-900 focus:border-amber-500 outline-none"
                >
                  <option value="Citizenship Card (Nagarikta)">Citizenship Card (Nagarikta)</option>
                  <option value="National Identity Card (NID)">National Identity Card (NID)</option>
                  <option value="Nepali Passport">Nepali Passport</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Document Identification Number *
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="e.g. 27-01-75-12345"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Upload Photo of Document (Front / Both sides)
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-amber-500 hover:bg-slate-50 cursor-pointer transition text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">
                    {documentImage ? 'Document photo attached' : 'Click to upload or drag & drop'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG or PDF up to 10MB</span>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !documentNumber.trim()}
                className="w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition disabled:bg-slate-200 disabled:text-slate-400"
              >
                {loading ? 'Submitting...' : 'Submit KYC for Verification'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
