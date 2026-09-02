import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatNPR, formatDate, getStatusBadgeClass } from '../lib/utils';
import {
  ShieldAlert,
  Users,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  PlusCircle,
  Edit2,
  Send,
  Bell,
  RefreshCw,
  Search,
  MessageCircle,
  Sparkles,
  X,
} from 'lucide-react';
import {
  AdminAnalytics,
  Deposit,
  Investment,
  InvestmentPlan,
  SupportTicket,
  User,
  Wallet,
  Withdrawal,
  PaymentSetting,
} from '../types';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, showToast } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'deposits' | 'withdrawals' | 'users' | 'referrals' | 'kyc' | 'investments' | 'plans' | 'payment-settings' | 'tickets' | 'broadcast'
  >('overview');

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [usersList, setUsersList] = useState<(User & { wallet: Wallet; investmentsCount: number; referrer?: string | null; referralEarnings?: number; investments?: Partial<Investment>[]; referralsGiven?: Array<{ id: string; referredUserName: string; referredUserEmail: string; totalInvestedByReferred: number; bonusEarned: number; status: string; createdAt: string; referrerName: string; referrerEmail: string }> })[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [selectedKycUser, setSelectedKycUser] = useState<User | null>(null);
  const [balanceAction, setBalanceAction] = useState<'add' | 'deduct' | 'set'>('add');
  const [balanceAmount, setBalanceAmount] = useState<number>(10000);
  const [balanceReason, setBalanceReason] = useState<string>('Admin credit adjustment');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Ticket response state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [
        analyticsData,
        depData,
        withData,
        userData,
        invData,
        plansData,
        ticketData,
        paymentSettingsData,
      ] = await Promise.all([
        api.admin.getAnalytics(),
        api.admin.getDeposits(),
        api.admin.getWithdrawals(),
        api.admin.getUsers(),
        api.admin.getInvestments(),
        api.admin.getPlans(),
        api.admin.getTickets(),
        api.getPaymentSettings(),
      ]);

      setAnalytics(analyticsData);
      setDeposits(depData);
      setWithdrawals(withData);
      setUsersList(userData);
      setInvestments(invData);
      setPlans(plansData);
      setTickets(ticketData);
      setPaymentSettings(paymentSettingsData);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl border border-rose-200 max-w-md shadow-lg space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold font-display text-slate-900">Administrator Access Restricted</h2>
          <p className="text-xs text-slate-600">
            This module requires a verified administrator account. Open the dedicated admin login page to continue.
          </p>
        </div>
      </div>
    );
  }

  // Action Handlers
  const handleApproveDeposit = async (id: string) => {
    try {
      await api.admin.approveDeposit(id, 'Approved by treasury desk');
      showToast('Deposit approved and user wallet credited!', 'success');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve deposit', 'error');
    }
  };

  const handleRejectDeposit = async (id: string) => {
    const reason = prompt('Enter rejection reason:') || 'Payment reference invalid or not received';
    try {
      await api.admin.rejectDeposit(id, reason);
      showToast('Deposit rejected.', 'info');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject deposit', 'error');
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      await api.admin.approveWithdrawal(id, 'Dispatched via ConnectIPS / bank transfer');
      showToast('Withdrawal marked as approved & dispatched!', 'success');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve withdrawal', 'error');
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    const reason = prompt('Enter rejection reason:') || 'Bank account details mismatch';
    try {
      await api.admin.rejectWithdrawal(id, reason);
      showToast('Withdrawal rejected and funds refunded to user wallet.', 'info');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject withdrawal', 'error');
    }
  };

  const handleTriggerPayout = async (id: string) => {
    try {
      await api.admin.triggerInvestmentPayout(id);
      showToast('Daily yield payout processed successfully!', 'success');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Payout failed', 'error');
    }
  };

  const handleCompleteInvestment = async (id: string) => {
    try {
      await api.admin.completeInvestment(id);
      showToast('Investment contract completed & principal unlocked.', 'success');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete investment', 'error');
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBalance) return;
    try {
      await api.admin.adjustUserBalance(selectedUserForBalance.id, {
        action: balanceAction,
        amount: balanceAmount,
        reason: balanceReason,
      });
      showToast(`User balance adjusted (${balanceAction} ${formatNPR(balanceAmount)})`, 'success');
      setSelectedUserForBalance(null);
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Balance update failed', 'error');
    }
  };

  const handleUpdateKYC = async (userId: string, status: 'verified' | 'rejected') => {
    try {
      await api.admin.updateUserKYC(userId, status);
      showToast(`KYC status updated to ${status}.`, 'success');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'KYC update failed', 'error');
    }
  };

  const handleUpdateCredentials = async (registeredUser: User) => {
    const nextEmail = prompt(`New email for ${registeredUser.fullName} (leave blank to keep current):`, registeredUser.email) || '';
    const nextPassword = prompt('New password (leave blank to keep current):') || '';
    if (!nextEmail && !nextPassword) return;
    try {
      await api.admin.updateUserCredentials(registeredUser.id, {
        email: nextEmail.trim() || undefined,
        password: nextPassword || undefined,
      });
      showToast('User login credentials updated successfully.', 'success');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Credential update failed.', 'error');
    }
  };

  const handleAdminProfile = async () => {
    if (!user) return;
    const nextEmail = prompt('New admin email (leave blank to keep current):', user.email) || '';
    const nextPassword = prompt('New admin password (leave blank to keep current):') || '';
    if (!nextEmail && !nextPassword) return;
    try {
      await api.admin.updateUserCredentials(user.id, { email: nextEmail.trim() || undefined, password: nextPassword || undefined });
      showToast('Admin login credentials updated.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Admin credential update failed.', 'error');
    }
  };

  const handleCreateAdmin = async () => {
    const fullName = prompt('New admin full name:') || '';
    const email = prompt('New admin email:') || '';
    const password = prompt('New admin password (minimum 6 characters):') || '';
    if (!fullName || !email || !password) return;
    try {
      await api.admin.createAdmin({ fullName, email, password });
      showToast('New admin account created.', 'success');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Admin creation failed.', 'error');
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      await api.admin.broadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
      });
      showToast('Broadcast notification dispatched to all users!', 'success');
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      showToast(err.message || 'Broadcast failed', 'error');
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyText.trim()) return;
    try {
      await api.admin.replyTicket(selectedTicket.id, ticketReplyText.trim(), 'resolved');
      showToast('Reply dispatched and ticket resolved.', 'success');
      setTicketReplyText('');
      setSelectedTicket(null);
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Ticket reply failed', 'error');
    }
  };

  const handlePaymentSettingChange = (id: PaymentSetting['id'], field: keyof PaymentSetting, value: string) => {
    setPaymentSettings((current) => current.map((setting) => setting.id === id ? { ...setting, [field]: value } : setting));
  };

  const handlePaymentQrUpload = (id: PaymentSetting['id'], event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handlePaymentSettingChange(id, 'qrImage', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSavePaymentSettings = async () => {
    try {
      const response = await api.admin.updatePaymentSettings(paymentSettings);
      setPaymentSettings(response.settings);
      showToast('Payment account and QR settings updated.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment settings.', 'error');
    }
  };

  const referralRecords = usersList.flatMap((registeredUser) => registeredUser.referralsGiven || []);

  return (
    <div className="w-full min-w-0 space-y-6 pb-16">
      {/* Header */}
      <div className="flex min-w-0 flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden bg-gradient-to-r from-[#0B192C] via-[#0F284E] to-[#07111F] text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-amber-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded">
              Super Admin Console
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white mt-1 break-words">
            CapitalNest Management Center
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Full control over treasury deposits, payout authorizations, investments, and customer support.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={handleAdminProfile} className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-left transition hover:bg-slate-700" title="Change admin email or password">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-slate-950">{user?.fullName?.slice(0, 1).toUpperCase() || 'A'}</span>
            <span className="hidden sm:block"><span className="block text-[10px] font-bold uppercase text-amber-300">Admin profile</span><span className="block max-w-[150px] truncate text-xs text-slate-200">{user?.email}</span></span>
          </button>
          <button onClick={handleCreateAdmin} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400" title="Create another administrator">New Admin</button>
          <button onClick={loadAllAdminData} className="rounded-xl bg-slate-800 p-2 text-slate-200 transition hover:bg-slate-700" title="Refresh data"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {/* ADMIN KPI METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold block">Total Investors</span>
          <div className="text-xl font-bold font-display text-slate-900 mt-0.5">
            {analytics?.totalUsers || 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold block">Active Investments</span>
          <div className="text-xl font-bold font-display text-amber-600 mt-0.5">
            {formatNPR(analytics?.totalInvested || 0, false)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold block">Total Deposited</span>
          <div className="text-xl font-bold font-display text-emerald-600 mt-0.5">
            {formatNPR(analytics?.totalDeposited || 0, false)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold block">Pending Deposits</span>
          <div className="text-xl font-bold font-display text-amber-500 mt-0.5">
            {analytics?.pendingDeposits || 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-semibold block">Pending Withdrawals</span>
          <div className="text-xl font-bold font-display text-rose-600 mt-0.5">
            {analytics?.pendingWithdrawals || 0}
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'deposits', label: `Deposits (${deposits.filter((d) => d.status === 'pending').length} pending)` },
          { id: 'withdrawals', label: `Withdrawals (${withdrawals.filter((w) => w.status === 'pending').length} pending)` },
          { id: 'users', label: `Users (${usersList.length})` },
          { id: 'referrals', label: `Referrals (${referralRecords.length})` },
          { id: 'kyc', label: `KYC Review (${usersList.filter((registeredUser) => registeredUser.kycStatus === 'pending').length} pending)` },
          { id: 'investments', label: `Active Yields (${investments.length})` },
          { id: 'plans', label: `Investment Plans (${plans.length})` },
          { id: 'payment-settings', label: 'Payment Settings' },
          { id: 'tickets', label: `Support Tickets (${tickets.length})` },
          { id: 'broadcast', label: 'Broadcast Notification' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`min-w-0 px-2 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold leading-tight transition ${
              activeTab === tab.id
                ? 'bg-[#0B192C] text-amber-400 shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT PANELS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Action Queue */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base font-display text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Pending Action Requests
            </h3>
            <div className="space-y-3 text-xs">
              <div
                onClick={() => setActiveTab('deposits')}
                className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between cursor-pointer hover:bg-amber-50"
              >
                <div>
                  <strong className="text-slate-900 block font-bold">Unverified Deposits</strong>
                  <span className="text-slate-500">Requires bank reference matching</span>
                </div>
                <span className="text-sm font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                  {deposits.filter((d) => d.status === 'pending').length} requests
                </span>
              </div>

              <div
                onClick={() => setActiveTab('withdrawals')}
                className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between cursor-pointer hover:bg-rose-50"
              >
                <div>
                  <strong className="text-slate-900 block font-bold">Pending Withdrawal Requests</strong>
                  <span className="text-slate-500">Requires ConnectIPS / bank transfer</span>
                </div>
                <span className="text-sm font-bold text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-rose-200">
                  {withdrawals.filter((w) => w.status === 'pending').length} requests
                </span>
              </div>

              <div
                onClick={() => setActiveTab('tickets')}
                className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between cursor-pointer hover:bg-blue-50"
              >
                <div>
                  <strong className="text-slate-900 block font-bold">Open Support Inquiries</strong>
                  <span className="text-slate-500">Awaiting agent response</span>
                </div>
                <span className="text-sm font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                  {tickets.filter((t) => t.status === 'open').length} open
                </span>
              </div>

              <div
                onClick={() => setActiveTab('kyc')}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100"
              >
                <div>
                  <strong className="text-slate-900 block font-bold">Pending KYC Reviews</strong>
                  <span className="text-slate-500">Review identity documents and applicant details</span>
                </div>
                <span className="text-sm font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {usersList.filter((registeredUser) => registeredUser.kycStatus === 'pending').length} requests
                </span>
              </div>
            </div>
          </div>

          {/* Quick System Actions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base font-display text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Administrative Operations
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => setActiveTab('broadcast')}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-500 text-left transition"
              >
                <Bell className="w-5 h-5 text-amber-500 mb-2" />
                <strong className="block text-slate-900">Broadcast Alert</strong>
                <span className="text-slate-500 text-[11px]">Send notification to all</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-500 text-left transition"
              >
                <Users className="w-5 h-5 text-blue-500 mb-2" />
                <strong className="block text-slate-900">Adjust Balances</strong>
                <span className="text-slate-500 text-[11px]">Manual credit or debit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPOSITS MANAGEMENT */}
      {activeTab === 'deposits' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm font-display text-slate-900">Deposit Verification Desk</h3>
            <span className="text-xs text-slate-400">{deposits.length} total entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Sender Details</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-900">{d.paymentReference}</td>
                    <td className="p-3 font-medium text-slate-900">{d.senderName || d.userId}</td>
                    <td className="p-3 uppercase font-semibold text-slate-700">{d.paymentMethod.replace('_', ' ')}</td>
                    <td className="p-3 font-bold text-slate-900 font-display">{formatNPR(d.amount)}</td>
                    <td className="p-3 text-[11px] text-slate-500">{d.senderAccount || '—'}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadgeClass(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {d.paymentProof && (
                        <button
                          onClick={() => setSelectedDeposit(d)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-bold text-[11px] transition"
                        >
                          View Screenshot
                        </button>
                      )}
                      {d.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveDeposit(d.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectDeposit(d.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WITHDRAWALS MANAGEMENT */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm font-display text-slate-900">Withdrawal Authorizations</h3>
            <span className="text-xs text-slate-400">{withdrawals.length} total requests</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Account Details</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono text-[11px]">#{w.id.slice(0, 8)}</td>
                    <td className="p-3 uppercase font-semibold">{w.method.replace('_', ' ')}</td>
                    <td className="p-3 font-mono text-slate-900">
                      {w.method === 'bank_account'
                        ? `${w.accountDetails?.bankName} - ${w.accountDetails?.accountNumber} (${w.accountDetails?.accountHolderName})`
                        : `${w.accountDetails?.walletId} (${w.accountDetails?.accountHolderName})`}
                    </td>
                    <td className="p-3 font-bold text-slate-900 font-display">{formatNPR(w.amount)}</td>
                    <td className="p-3 text-slate-400">{formatDate(w.createdAt)}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadgeClass(w.status)}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {w.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveWithdrawal(w.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-xs"
                          >
                            Dispatched / Paid
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(w.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition"
                          >
                            Reject & Refund
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm font-display text-slate-900">Registered Investors Directory</h3>
            <span className="text-xs text-slate-400">{usersList.length} total users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">User & Contact</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Referrer / Earnings</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">KYC Status</th>
                  <th className="p-3">Available Balance</th>
                  <th className="p-3">Invested Capital</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] text-slate-400">{u.email} • {u.phone}</div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">{u.registrationIp || 'Not recorded'}</td>
                    <td className="p-3 text-[11px]">
                      <div className="font-semibold text-slate-700">{u.referrer || 'Direct signup'}</div>
                      <div className="text-emerald-600 font-bold">Referral: {formatNPR(u.referralEarnings || 0)}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadgeClass(u.kycStatus)}`}>
                          {u.kycStatus}
                        </span>
                        {u.kycStatus === 'pending' && (
                          <button
                            onClick={() => handleUpdateKYC(u.id, 'verified')}
                            className="text-[10px] text-emerald-600 font-bold hover:underline"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-slate-900 font-display">
                      {formatNPR(u.wallet?.availableBalance || 0)}
                    </td>
                    <td className="p-3 font-bold text-slate-900 font-display">
                      {formatNPR(u.wallet?.investedBalance || 0)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleUpdateCredentials(u)}
                        className="mr-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[11px] transition"
                      >
                        Change Login
                      </button>
                      <button
                        onClick={() => setSelectedUserForBalance(u)}
                        className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition"
                      >
                        Adjust Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVESTMENTS MANAGEMENT */}
      {activeTab === 'payment-settings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-xs border border-slate-200">
            <div><h3 className="font-bold text-base font-display text-slate-900">Deposit Payment Settings</h3><p className="mt-1 text-xs text-slate-500">These details and QR codes appear on the user deposit screen.</p></div>
            <button onClick={handleSavePaymentSettings} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700">Save All Changes</button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {paymentSettings.map((setting) => (
              <div key={setting.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <h4 className="font-bold text-sm font-display text-slate-900 uppercase">{setting.id}</h4>
                <div><label className="mb-1 block text-[11px] font-bold text-slate-700">Payment Title</label><input value={setting.title} onChange={(event) => handlePaymentSettingChange(setting.id, 'title', event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" /></div>
                <div><label className="mb-1 block text-[11px] font-bold text-slate-700">Account Name</label><input value={setting.accountName} onChange={(event) => handlePaymentSettingChange(setting.id, 'accountName', event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" /></div>
                <div><label className="mb-1 block text-[11px] font-bold text-slate-700">Account Number / ID</label><input value={setting.accountId} onChange={(event) => handlePaymentSettingChange(setting.id, 'accountId', event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" /></div>
                <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-3 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"><span>{setting.qrImage ? 'Replace QR Code' : 'Upload QR Code'}</span><input type="file" accept="image/*" onChange={(event) => handlePaymentQrUpload(setting.id, event)} className="hidden" /></label>
                {setting.qrImage && <img src={setting.qrImage} alt={`${setting.id} QR preview`} className="mx-auto h-36 w-36 rounded-xl border border-slate-200 object-contain p-2" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVESTMENTS MANAGEMENT */}
      {activeTab === 'kyc' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm font-display text-slate-900">KYC Verification Desk</h3>
            <span className="text-xs text-slate-400">Review identity documents before approval</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Applicant</th>
                  <th className="p-3">Document</th>
                  <th className="p-3">Document Photo</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.filter((registeredUser) => registeredUser.role === 'user').map((kycUser) => (
                  <tr key={kycUser.id} className="hover:bg-slate-50/70">
                    <td className="p-3"><div className="font-bold text-slate-900">{kycUser.fullName}</div><div className="text-[11px] text-slate-500">{kycUser.email} · {kycUser.phone}</div></td>
                    <td className="p-3"><div className="font-semibold text-slate-900">{kycUser.kycDocumentType || 'Not submitted'}</div><div className="font-mono text-[11px] text-slate-500">{kycUser.kycDocumentNumber || '—'}</div></td>
                    <td className="p-3">{kycUser.kycDocumentImage ? <button onClick={() => setSelectedKycUser(kycUser)} className="overflow-hidden rounded-lg border border-slate-200"><img src={kycUser.kycDocumentImage} alt={`${kycUser.fullName} identity document`} className="h-14 w-24 object-cover" /></button> : <span className="text-slate-400">No photo</span>}</td>
                    <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadgeClass(kycUser.kycStatus)}`}>{kycUser.kycStatus}</span></td>
                    <td className="p-3 text-right space-x-1.5">{kycUser.kycStatus === 'pending' && <><button onClick={() => handleUpdateKYC(kycUser.id, 'verified')} className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition">Approve</button><button onClick={() => handleUpdateKYC(kycUser.id, 'rejected')} className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition">Reject</button></>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedKycUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl text-slate-900">
            <button onClick={() => setSelectedKycUser(null)} className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" aria-label="Close KYC document"><X className="h-4 w-4" /></button>
            <h3 className="pr-10 text-base font-bold font-display">KYC Document Review</h3>
            <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2"><span><strong>Name:</strong> {selectedKycUser.fullName}</span><span><strong>Email:</strong> {selectedKycUser.email}</span><span><strong>Phone:</strong> {selectedKycUser.phone}</span><span><strong>Document:</strong> {selectedKycUser.kycDocumentType || '—'}</span><span><strong>Number:</strong> {selectedKycUser.kycDocumentNumber || '—'}</span><span><strong>Status:</strong> {selectedKycUser.kycStatus}</span></div>
            {selectedKycUser.kycDocumentImage && <img src={selectedKycUser.kycDocumentImage} alt={`${selectedKycUser.fullName} identity document`} className="mt-4 max-h-[65vh] w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain" />}
            {selectedKycUser.kycStatus === 'pending' && <div className="mt-4 flex justify-end gap-2"><button onClick={() => { handleUpdateKYC(selectedKycUser.id, 'rejected'); setSelectedKycUser(null); }} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">Reject</button><button onClick={() => { handleUpdateKYC(selectedKycUser.id, 'verified'); setSelectedKycUser(null); }} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Approve KYC</button></div>}
          </div>
        </div>
      )}

      {/* INVESTMENTS MANAGEMENT */}
      {activeTab === 'referrals' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm font-display text-slate-900">Referral Earnings Ledger</h3>
            <span className="text-xs text-slate-400">{referralRecords.length} referral records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Referrer</th>
                  <th className="p-3">Referred User</th>
                  <th className="p-3">Referred Investment</th>
                  <th className="p-3">Referral Earned</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referralRecords.map((referral) => (
                  <tr key={referral.id} className="hover:bg-slate-50/70">
                    <td className="p-3"><div className="font-bold text-slate-900">{referral.referrerName}</div><div className="text-[11px] text-slate-400">{referral.referrerEmail}</div></td>
                    <td className="p-3"><div className="font-semibold text-slate-900">{referral.referredUserName}</div><div className="text-[11px] text-slate-400">{referral.referredUserEmail}</div></td>
                    <td className="p-3 font-bold text-slate-900">{formatNPR(referral.totalInvestedByReferred)}</td>
                    <td className="p-3 font-bold text-emerald-600">{formatNPR(referral.bonusEarned)}</td>
                    <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadgeClass(referral.status)}`}>{referral.status}</span></td>
                    <td className="p-3 text-slate-400">{formatDate(referral.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVESTMENTS MANAGEMENT */}
      {activeTab === 'investments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm font-display text-slate-900">Active Investment Contracts Monitor</h3>
            <span className="text-xs text-slate-400">{investments.length} contracts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Investor</th>
                  <th className="p-3">Plan Name</th>
                  <th className="p-3">Principal</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3">Earned Yield</th>
                  <th className="p-3">Daily Yield</th>
                  <th className="p-3">Days Left</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{(inv as Investment & { userFullName?: string }).userFullName || inv.userId}</div>
                      <div className="text-[11px] text-slate-400">{(inv as Investment & { userEmail?: string }).userEmail}</div>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{inv.planName}</td>
                    <td className="p-3 font-bold text-slate-900 font-display">{formatNPR(inv.amount)}</td>
                    <td className="p-3 font-semibold text-amber-600">{inv.returnRate}%</td>
                    <td className="p-3 font-bold text-emerald-600 font-display">+{formatNPR(inv.totalEarned)}</td>
                    <td className="p-3 font-semibold text-slate-700">+{formatNPR(inv.dailyYield)}</td>
                    <td className="p-3 text-slate-500">{inv.daysRemaining} days</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadgeClass(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {inv.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleTriggerPayout(inv.id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition shadow-xs"
                            title="Credit 1 day profit immediately"
                          >
                            Trigger Payout
                          </button>
                          <button
                            onClick={() => handleCompleteInvestment(inv.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition"
                            title="Complete contract and return capital"
                          >
                            Maturity Complete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLANS MANAGEMENT */}
      {activeTab === 'plans' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base font-display text-slate-900">Investment Plans Configuration</h3>
            <span className="text-xs text-slate-500">{plans.length} configured plans</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <strong className="text-slate-900 text-sm font-display">{p.name}</strong>
                  <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                    {p.returnRate}% Net
                  </span>
                </div>
                <div className="text-slate-500 space-y-1">
                  <div>Duration: {p.durationDays} Days</div>
                  <div>Min: {formatNPR(p.minimumAmount)}</div>
                  <div>Max: {formatNPR(p.maximumAmount)}</div>
                  <div>Payout: {p.payoutFrequency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TICKETS DESK */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-base font-display text-slate-900">Support Inquiries Desk</h3>
          <div className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <div key={t.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{t.subject}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusBadgeClass(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{t.message}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(t)}
                  className="px-3 py-1.5 rounded-xl bg-[#0B192C] text-white font-bold text-[11px] hover:bg-slate-800 transition"
                >
                  Respond
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BROADCAST TAB */}
      {activeTab === 'broadcast' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 max-w-xl mx-auto space-y-4">
          <h3 className="font-bold text-base font-display text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" /> Broadcast System Notification
          </h3>
          <p className="text-xs text-slate-500">
            This message will appear in every user's notification bell and center immediately.
          </p>

          <form onSubmit={handleBroadcast} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Alert Title</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Special Festival Yield Bonus Active!"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Announcement Message</label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Write message to all registered investors..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-amber-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              Send Broadcast to All Users
            </button>
          </form>
        </div>
      )}

      {/* ADJUST BALANCE MODAL */}
      {selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-5 sm:p-6 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedDeposit(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              aria-label="Close payment screenshot"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="pr-10 text-base font-bold font-display">Payment Screenshot</h3>
            <p className="mt-1 text-xs text-slate-500">
              {selectedDeposit.userFullName || selectedDeposit.userId} · {selectedDeposit.paymentReference} · {formatNPR(selectedDeposit.amount)}
            </p>
            <div className="mt-4 flex min-h-72 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <img
                src={selectedDeposit.paymentProof}
                alt={`Payment proof for ${selectedDeposit.paymentReference}`}
                className="max-h-[65vh] max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ADJUST BALANCE MODAL */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-900 animate-in fade-in">
            <h3 className="text-base font-bold font-display text-slate-900 mb-1">
              Adjust Wallet Balance
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              For {selectedUserForBalance.fullName} ({selectedUserForBalance.email})
            </p>

            <form onSubmit={handleAdjustBalance} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Action Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['add', 'deduct', 'set'] as const).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setBalanceAction(act)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition ${
                        balanceAction === act
                          ? 'bg-[#0B192C] text-amber-400'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {act} Funds
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Amount (NPR)</label>
                <input
                  type="number"
                  min={1}
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForBalance(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET RESPONSE MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-900 animate-in fade-in">
            <h3 className="text-base font-bold font-display text-slate-900 mb-1">
              Respond to Ticket #{selectedTicket.id.slice(0, 8)}
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 my-3">
              <strong>{selectedTicket.subject}</strong>
              <p className="mt-1 text-slate-500">{selectedTicket.message}</p>
            </div>

            <form onSubmit={handleReplyTicket} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Admin Response</label>
                <textarea
                  rows={4}
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  placeholder="Type official response..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  Send Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
