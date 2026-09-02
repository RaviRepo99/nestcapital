import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDate } from '../lib/utils';
import {
  HelpCircle,
  MessageCircle,
  PlusCircle,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  Building,
} from 'lucide-react';
import { SupportTicket } from '../types';
import { supabase } from '../lib/supabase';

export const SupportPage: React.FC = () => {
  const { setActiveModal, showToast, user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('deposit');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Selected Ticket for thread viewing
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await api.getSupportTickets();
      setTickets(data);
      if (selectedTicket) {
        const updated = data.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const channel = supabase
      .channel(`support-ticket-updates-${user?.id || 'anonymous'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user?.id}` }, () => void fetchTickets())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    try {
      setSubmitting(true);
      await api.createSupportTicket({
        subject: subject.trim(),
        category,
        message: message.trim(),
      });
      setShowCreateModal(false);
      setSubject('');
      setMessage('');
      showToast('Support ticket created. Our team will review shortly.', 'success');
      await fetchTickets();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit ticket.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setReplying(true);
      await api.replySupportTicket(selectedTicket.id, replyMessage.trim());
      setReplyMessage('');
      showToast('Reply submitted.', 'success');
      await fetchTickets();
    } catch (err: any) {
      showToast(err.message || 'Failed to reply.', 'error');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-500" />
            Customer Desk & Help
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            24/7 dedicated support for deposits, payouts, verification, and portfolio queries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveModal('chat')}
            className="px-4 py-2.5 rounded-2xl bg-[#0B192C] hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <MessageCircle className="w-4 h-4 text-amber-400" /> Live Chat
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" /> Open Ticket
          </button>
        </div>
      </div>

      {/* Support Channels Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Email Support</span>
            <span className="text-[11px] text-slate-500 block">support@capitalnestnepal.com</span>
            <span className="text-[10px] text-amber-600 font-semibold mt-1 block">Response within 2 hours</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Nepal Phone Helpline</span>
            <span className="text-[11px] text-slate-500 block">+977 1-4428900</span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Sun - Fri (9 AM - 6 PM)</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Kathmandu Office</span>
            <span className="text-[11px] text-slate-500 block">Putalisadak, Kathmandu, Nepal</span>
            <span className="text-[10px] text-blue-600 font-semibold mt-1 block">Registered Capital HQ</span>
          </div>
        </div>
      </div>

      {/* Tickets Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm font-display text-slate-900">Your Support Tickets</h3>
          <span className="text-xs text-slate-400">{tickets.length} Total</span>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading support tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-3">
              <MessageCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <div>You haven't opened any support tickets yet.</div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Create First Ticket
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    selectedTicket?.id === t.id
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {t.category}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        t.status === 'open'
                          ? 'bg-amber-100 text-amber-800'
                          : t.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{t.subject}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{t.message}</p>
                  <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 flex justify-between">
                    <span>{t.replies.length} messages</span>
                    <span>{formatDate(t.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Ticket Thread Modal / View */}
      {selectedTicket && (
        <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                Ticket Thread #{selectedTicket.id.slice(0, 8)}
              </span>
              <h3 className="text-base font-bold text-slate-900 font-display">{selectedTicket.subject}</h3>
            </div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
            >
              Close Thread
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto p-2">
            {selectedTicket.replies.map((m) => (
              <div
                key={m.id}
                className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                  m.senderRole === 'user'
                    ? 'bg-slate-50 border border-slate-200 text-slate-900 ml-6'
                    : 'bg-[#0B192C] text-white mr-6'
                }`}
              >
                <div className="flex justify-between font-bold text-[10px]">
                  <span className={m.senderRole === 'user' ? 'text-slate-700' : 'text-amber-400'}>
                    {m.senderName}
                  </span>
                  <span className="text-slate-400">
                    {formatDate(m.createdAt)}
                  </span>
                </div>
                <p className="leading-relaxed">{m.message}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleReplyTicket} className="flex gap-2 pt-2">
            <input
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your response to support..."
              className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 outline-none"
            />
            <button
              type="submit"
              disabled={replying || !replyMessage.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" /> Reply
            </button>
          </form>
        </div>
      )}

      {/* New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-900 animate-in fade-in">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-4">Open Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Deposit confirmation inquiry"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 outline-none"
                >
                  <option value="deposit">Deposit & Payment Verification</option>
                  <option value="withdrawal">Withdrawal & Payout Processing</option>
                  <option value="investment">Investment Plan Questions</option>
                  <option value="kyc">KYC & Verification</option>
                  <option value="general">General Inquiries</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide all relevant reference IDs or questions..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  {submitting ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
