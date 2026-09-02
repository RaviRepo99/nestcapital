export type UserRole = 'user' | 'admin';
export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  avatar?: string;
  referralCode: string;
  referredBy?: string;
  kycStatus: KYCStatus;
  kycDocumentType?: string;
  kycDocumentNumber?: string;
  kycDocumentImage?: string;
  kycDocumentImageFront?: string;
  kycDocumentImageBack?: string;
  twoFactorEnabled?: boolean;
  isBlocked?: boolean;
  registrationIp?: string;
  createdAt: string;
}

export interface Wallet {
  userId: string;
  availableBalance: number;
  investedBalance: number;
  totalEarnings: number;
  totalDeposited: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  pendingDeposits: number;
  referralEarnings?: number;
  updatedAt: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  minimumAmount: number;
  maximumAmount?: number;
  returnRate: number; // in percentage e.g. 20 for 20%
  durationDays: number;
  payoutFrequency: 'daily' | 'completion';
  status: 'active' | 'inactive';
  badge?: string;
  description: string;
  isPopular?: boolean;
  totalInvestors?: number;
  totalInvestedNPR?: number;
}

export type InvestmentStatus = 'active' | 'completed' | 'cancelled';

export interface Investment {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  returnRate: number;
  expectedReturn: number;
  dailyReturnAmount: number;
  profitEarnedSoFar: number;
  startDate: string;
  endDate: string;
  nextPayoutDate: string;
  durationDays: number;
  daysRemaining: number;
  progressPercentage: number;
  status: InvestmentStatus;
  lastPayoutAt?: string;
  createdAt: string;
}

export type PaymentMethod = 'esewa' | 'khalti' | 'fonepay' | 'bank_transfer' | 'connect_ips';

export interface PaymentSetting {
  id: 'esewa' | 'khalti' | 'fonepay';
  title: string;
  accountName: string;
  accountId: string;
  qrImage?: string;
}
export type DepositStatus = 'pending' | 'approved' | 'rejected';

export interface Deposit {
  id: string;
  userId: string;
  userFullName?: string;
  userEmail?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  senderName?: string;
  senderAccount?: string;
  paymentProof?: string;
  notes?: string;
  status: DepositStatus;
  adminNote?: string;
  createdAt: string;
  verifiedAt?: string;
}

export type WithdrawalMethod = 'bank_account' | 'esewa' | 'khalti' | 'connect_ips';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface WithdrawalAccountDetails {
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  branchName?: string;
  walletId?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userFullName?: string;
  userEmail?: string;
  amount: number;
  method: WithdrawalMethod;
  accountDetails: WithdrawalAccountDetails;
  status: WithdrawalStatus;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

export type TransactionType =
  | 'deposit'
  | 'investment'
  | 'profit'
  | 'withdrawal'
  | 'referral_bonus'
  | 'admin_adjustment';

export type TransactionStatus = 'pending' | 'approved' | 'completed' | 'rejected';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  direction: 'in' | 'out';
  amount: number;
  reference: string;
  description: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  status: 'pending' | 'active';
  totalInvestedByReferred: number;
  bonusEarned: number;
  createdAt: string;
}

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalBonusEarned: number;
  totalReferred?: number;
  totalEarnings?: number;
  referralEarnings?: number;
  commissionRate: number; // e.g. 5%
  referralHistory: ReferralRecord[];
  referees?: ReferralRecord[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'deposit' | 'investment' | 'withdrawal' | 'referral' | 'system' | 'security';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface TicketReply {
  id: string;
  senderRole: 'user' | 'admin';
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'deposit' | 'withdrawal' | 'investment' | 'account' | 'general';
  message: string;
  attachment?: string;
  status: 'open' | 'in_progress' | 'resolved';
  replies: TicketReply[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalActiveUsers: number;
  totalDepositsVolume: number;
  totalInvestedVolume: number;
  totalProfitPaid: number;
  totalProfit?: number;
  totalWithdrawalsVolume: number;
  pendingDepositsCount: number;
  pendingWithdrawalsCount: number;
  totalDeposited?: number;
  totalInvested?: number;
  pendingDeposits?: number;
  pendingWithdrawals?: number;
  activeInvestmentsCount: number;
  openTicketsCount: number;
  platformReserveBalance: number;
  recentActivity: Transaction[];
}

export interface AuthResponse {
  user?: User;
  wallet?: Wallet;
  token?: string;
  emailVerificationRequired?: boolean;
}
