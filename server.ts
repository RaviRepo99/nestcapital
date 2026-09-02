import express, { Request, Response } from 'express';
import 'dotenv/config';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PLANS } from './src/data/plans.js';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', override: true });
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

let dbReady: Promise<void> = Promise.resolve();
app.use(async (_req, _res, next) => {
  try {
    if (supabase) {
      await hydrateDbFromSupabase();
    } else {
      await dbReady;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Database directory & path
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
const supabaseAuth = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'CapitalNest Nepal <notifications@capitalnest.np>';
const PENDING_REGISTRATIONS = new Map<string, {
  fullName: string;
  phone: string;
  passwordHash: string;
  referralCode?: string;
  registrationIp: string;
  registrationDeviceId?: string;
}>();
let liveDb: any | null = null;

// Password hashing helper
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'CAPITALNEST_NEPAL_SALT_2026').digest('hex');
}

function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0];
  return (forwardedIp || req.ip || req.socket.remoteAddress || '').replace(/^::ffff:/, '').trim();
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('977') && digits.length === 13 ? digits.slice(3) : digits;
}

function mapSupabaseTicket(ticket: any): any {
  return {
    id: ticket.id,
    userId: ticket.user_id,
    userName: ticket.user_name || '',
    userEmail: ticket.user_email || '',
    subject: ticket.subject,
    category: ticket.category,
    message: ticket.message,
    attachment: ticket.attachment || undefined,
    status: ticket.status,
    replies: Array.isArray(ticket.replies) ? ticket.replies : [],
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  };
}

function makeUniqueReferralCode(name: string, users: any[]): string {
  const prefix = name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 8) || 'USER';
  let code = '';
  do code = `${prefix}${crypto.randomInt(100000, 1000000)}`;
  while (users.some((candidate: any) => candidate.referralCode?.toUpperCase() === code));
  return code;
}

const DEFAULT_PAYMENT_SETTINGS = [
  { id: 'esewa', title: 'eSewa Merchant Wallet', accountName: 'CapitalNest Nepal Pvt. Ltd.', accountId: '9841234567', qrImage: '' },
  { id: 'khalti', title: 'Khalti Merchant ID', accountName: 'CapitalNest Nepal Pvt. Ltd.', accountId: '9801234567', qrImage: '' },
  { id: 'fonepay', title: 'Fonepay Merchant', accountName: 'CapitalNest Nepal Pvt. Ltd.', accountId: '9841234567', qrImage: '' },
];

function getPaymentSettings(db: any) {
  if (!Array.isArray(db.paymentSettings)) {
    db.paymentSettings = DEFAULT_PAYMENT_SETTINGS.map((setting) => ({ ...setting }));
  }
  return db.paymentSettings;
}

// Initial Database Seeder
function getInitialDb() {
  const investorId = 'usr_investor_01';
  const adminId = 'usr_admin_01';

  return {
    users: [
      {
        id: investorId,
        email: 'investor@capitalnest.np',
        passwordHash: hashPassword('password123'),
        role: 'user',
        fullName: 'Aayush Sharma',
        phone: '+977 9841234567',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
        referralCode: '482917',
        referredBy: undefined,
        kycStatus: 'verified',
        kycDocumentType: 'citizenship',
        kycDocumentNumber: '27-01-78-04921',
        twoFactorEnabled: false,
        isBlocked: false,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: adminId,
        email: process.env.ADMIN_SEED_EMAIL || `admin-${crypto.randomBytes(8).toString('hex')}@local.invalid`,
        passwordHash: hashPassword(process.env.ADMIN_SEED_PASSWORD || crypto.randomBytes(32).toString('hex')),
        role: 'admin',
        fullName: 'Chief Investment Officer',
        phone: '+977 9801234567',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
        referralCode: '731604',
        kycStatus: 'verified',
        twoFactorEnabled: true,
        isBlocked: false,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'usr_sarah_02',
        email: 'sarah.thapa@gmail.com',
        passwordHash: hashPassword('password123'),
        role: 'user',
        fullName: 'Sarah Thapa',
        phone: '+977 9851098765',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
        referralCode: '906251',
        referredBy: '482917',
        kycStatus: 'verified',
        twoFactorEnabled: false,
        isBlocked: false,
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    wallets: [
      {
        userId: investorId,
        availableBalance: 45000,
        investedBalance: 25000,
        totalEarnings: 8750,
        totalDeposited: 70000,
        totalWithdrawn: 15000,
        pendingWithdrawals: 0,
        pendingDeposits: 0,
        updatedAt: new Date().toISOString(),
      },
      {
        userId: adminId,
        availableBalance: 500000,
        investedBalance: 0,
        totalEarnings: 0,
        totalDeposited: 500000,
        totalWithdrawn: 0,
        pendingWithdrawals: 0,
        pendingDeposits: 0,
        updatedAt: new Date().toISOString(),
      },
      {
        userId: 'usr_sarah_02',
        availableBalance: 12000,
        investedBalance: 15000,
        totalEarnings: 3000,
        totalDeposited: 25000,
        totalWithdrawn: 0,
        pendingWithdrawals: 0,
        pendingDeposits: 0,
        updatedAt: new Date().toISOString(),
      }
    ],
    plans: INITIAL_PLANS,
    investments: [
      {
        id: 'inv_growth_01',
        userId: investorId,
        planId: 'growth',
        planName: 'Growth Plan',
        amount: 25000,
        returnRate: 20,
        expectedReturn: 30000,
        dailyReturnAmount: 166.67,
        profitEarnedSoFar: 2500,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        nextPayoutDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        durationDays: 30,
        daysRemaining: 15,
        progressPercentage: 50,
        status: 'active',
        lastPayoutAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    deposits: [
      {
        id: 'dep_01',
        userId: investorId,
        userFullName: 'Aayush Sharma',
        userEmail: 'investor@capitalnest.np',
        amount: 50000,
        paymentMethod: 'esewa',
        paymentReference: 'ESEWA-NP-99882211',
        senderName: 'Aayush Sharma',
        senderAccount: '9841234567',
        paymentProof: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80',
        notes: 'Initial investment deposit via eSewa merchant',
        status: 'approved',
        adminNote: 'Payment verified from merchant account',
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        verifiedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
      },
      {
        id: 'dep_02',
        userId: investorId,
        userFullName: 'Aayush Sharma',
        userEmail: 'investor@capitalnest.np',
        amount: 20000,
        paymentMethod: 'bank_transfer',
        paymentReference: 'NABIL-TX-882194',
        senderName: 'Aayush Sharma',
        senderAccount: '01928374619283',
        status: 'approved',
        adminNote: 'Verified bank slip',
        createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
        verifiedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000 + 1800000).toISOString(),
      }
    ],
    withdrawals: [
      {
        id: 'wth_01',
        userId: investorId,
        userFullName: 'Aayush Sharma',
        userEmail: 'investor@capitalnest.np',
        amount: 15000,
        method: 'bank_account',
        accountDetails: {
          bankName: 'Nabil Bank Ltd',
          accountNumber: '01928374619283',
          accountHolderName: 'Aayush Sharma',
          branchName: 'Kathmandu Main',
        },
        status: 'completed',
        adminNote: 'Funds transferred via ConnectIPS',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        processedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 7200000).toISOString(),
      }
    ],
    transactions: [
      {
        id: 'tx_01',
        userId: investorId,
        type: 'deposit',
        direction: 'in',
        amount: 50000,
        reference: 'ESEWA-NP-99882211',
        description: 'Deposit via eSewa digital wallet',
        status: 'completed',
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'tx_02',
        userId: investorId,
        type: 'deposit',
        direction: 'in',
        amount: 20000,
        reference: 'NABIL-TX-882194',
        description: 'Deposit via Nabil Bank Transfer',
        status: 'completed',
        createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'tx_03',
        userId: investorId,
        type: 'investment',
        direction: 'out',
        amount: 25000,
        reference: 'INV-GRW-01',
        description: 'Investment into Growth Plan (30 Days @ 20%)',
        status: 'completed',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'tx_04',
        userId: investorId,
        type: 'profit',
        direction: 'in',
        amount: 2500,
        reference: 'PAYOUT-GRW-15D',
        description: 'Accumulated Daily Profit Yield - Growth Plan',
        status: 'completed',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'tx_05',
        userId: investorId,
        type: 'withdrawal',
        direction: 'out',
        amount: 15000,
        reference: 'WTH-01-NABIL',
        description: 'Withdrawal to Nabil Bank Account',
        status: 'completed',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'tx_06',
        userId: investorId,
        type: 'referral_bonus',
        direction: 'in',
        amount: 1250,
        reference: 'REF-SARAH99',
        description: '5% Referral Commission from Sarah Thapa investment',
        status: 'completed',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    referrals: [
      {
        id: 'ref_01',
        referrerId: investorId,
        referredUserId: 'usr_sarah_02',
        referredUserName: 'Sarah Thapa',
        referredUserEmail: 'sarah.thapa@gmail.com',
        status: 'active',
        totalInvestedByReferred: 25000,
        bonusEarned: 1250,
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    notifications: [
      {
        id: 'notif_01',
        userId: investorId,
        title: 'Investment Activated',
        message: 'Your NPR 25,000.00 investment in Growth Plan has been activated. Daily returns will start crediting to your available balance.',
        type: 'investment',
        read: false,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_02',
        userId: investorId,
        title: 'Referral Bonus Credited',
        message: 'You received NPR 1,250.00 referral bonus from Sarah Thapa’s new investment.',
        type: 'referral',
        read: false,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_03',
        userId: investorId,
        title: 'Withdrawal Approved',
        message: 'Your withdrawal request of NPR 15,000.00 has been processed and credited to your Nabil Bank account.',
        type: 'withdrawal',
        read: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    supportTickets: [
      {
        id: 'tkt_01',
        userId: investorId,
        userName: 'Aayush Sharma',
        userEmail: 'investor@capitalnest.np',
        subject: 'Inquiry regarding Diamond plan payout structure',
        category: 'investment',
        message: 'Namaste! I would like to know if Diamond plan returns can be compounded automatically or if daily payouts are credited to wallet balance.',
        status: 'resolved',
        replies: [
          {
            id: 'rep_01',
            senderRole: 'admin',
            senderName: 'CapitalNest Support',
            message: 'Namaste Aayush! Daily payouts are credited directly to your Available Balance every 24 hours. You can either withdraw them anytime or reinvest in additional plans for maximum compounding returns.',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ],
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]
  };
}

// Database helper
function readDb() {
  if (!liveDb) liveDb = getInitialDb();
  return liveDb;
}

function writeDb(data: any) {
  liveDb = data;
  if (supabase) {
    void supabase.from('app_state').upsert({ id: 'capitalnest', data, updated_at: new Date().toISOString() }).then(({ error }) => {
      if (error) console.error(`Error writing Supabase app state: ${error.message}`);
    });
  }
}

function mapSupabaseWallet(wallet: any, userId: string) {
  return {
    userId,
    availableBalance: Number(wallet?.available_balance || 0),
    investedBalance: Number(wallet?.invested_balance || 0),
    totalEarnings: Number(wallet?.total_earnings || 0),
    referralEarnings: Number(wallet?.referral_earnings || 0),
    totalDeposited: Number(wallet?.total_deposited || 0),
    totalWithdrawn: Number(wallet?.total_withdrawn || 0),
    pendingWithdrawals: Number(wallet?.pending_withdrawals || 0),
    pendingDeposits: Number(wallet?.pending_deposits || 0),
    updatedAt: wallet?.updated_at || new Date().toISOString(),
  };
}

async function notifyUser(userId: string, title: string, message: string, type: string, email?: string, subject = title) {
  if (supabase) {
    await supabase.from('notifications').insert({
      id: `notif_${crypto.randomBytes(6).toString('hex')}`,
      user_id: userId,
      title,
      message,
      type,
      read: false,
    });
  }

  if (RESEND_API_KEY && email) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [email], subject, text: message }),
    });
  }

}

async function sendBulkAnnouncement(title: string, message: string) {
  if (!supabase) return 0;
  const { data: profiles, error } = await supabase.from('profiles').select('id, email, phone');
  if (error || !profiles?.length) return 0;
  const rows = profiles.map((profile: any) => ({
    id: `notif_${crypto.randomBytes(6).toString('hex')}`,
    user_id: profile.id,
    title,
    message,
    type: 'system',
    read: false,
  }));
  await supabase.from('notifications').insert(rows);

  if (RESEND_API_KEY) {
    await Promise.all(profiles.filter((profile: any) => profile.email).map((profile: any) => fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [profile.email], subject: title, text: message }),
    })));
  }
  return profiles.length;
}

function getKycImages(profile: any) {
  if (profile.kyc_document_image_front || profile.kyc_document_image_back) {
    return { front: profile.kyc_document_image_front || '', back: profile.kyc_document_image_back || '' };
  }
  try {
    const legacy = JSON.parse(profile.kyc_document_image || '{}');
    return { front: legacy.front || '', back: legacy.back || '' };
  } catch {
    return { front: profile.kyc_document_image || '', back: '' };
  }
}

async function hydrateDbFromSupabase() {
  if (!supabase) {
    liveDb = getInitialDb();
    console.warn('Supabase persistence is disabled: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
    return;
  }

  const { data, error } = await supabase.from('app_state').select('data').eq('id', 'capitalnest').maybeSingle();
  if (error) {
    console.warn(`Supabase app state was not loaded: ${error.message}`);
    return;
  }

  if (data?.data) {
    liveDb = data.data;
  } else {
    liveDb = getInitialDb();
    const { error: seedError } = await supabase.from('app_state').upsert({
      id: 'capitalnest',
      data: liveDb,
      updated_at: new Date().toISOString(),
    });
    if (seedError) console.warn(`Supabase app state was not seeded: ${seedError.message}`);
  }
}

async function applySupabaseSignupReferral(referredUserId: string, referredUserName: string, referredUserEmail: string, referralCode?: string) {
  if (!supabase || !referralCode?.trim()) return null;
  const { data, error } = await supabase.rpc('process_referral_reward', { p_referred_user_id: referredUserId });
  if (error) throw new Error(`Referral reward processing failed: ${error.message}`);
  return data;
}

async function reconcileSupabaseReferrals() {
  return;
}

async function reconcileSupabaseReferralForUser(email: string) {
  if (!supabase) return;
  const { data: profile } = await supabase.from('profiles').select('id, full_name, email, referred_by').eq('email', email).maybeSingle();
  if (profile?.referred_by) {
    await applySupabaseSignupReferral(profile.id, profile.full_name, profile.email, profile.referred_by);
  }
}

// Token / Session store in-memory
const SESSIONS = new Map<string, { userId: string; role: string; email: string }>();
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'capitalnest-session-secret';

function generateToken(user: any): string {
  const payload = Buffer.from(JSON.stringify({ userId: user.id, role: user.role, email: user.email })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `cn_tok_${payload}.${signature}`;
}

// Auth Middleware
function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const session = SESSIONS.get(token);

  if (!session) {
    const signedToken = token.startsWith('cn_tok_') ? token.slice(7) : '';
    const [payload, signature] = signedToken.split('.');
    if (payload && signature) {
      const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
      const signatureBuffer = Buffer.from(signature);
      const expectedSignatureBuffer = Buffer.from(expectedSignature);
      const validSignature = signatureBuffer.length === expectedSignatureBuffer.length
        && crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
      if (validSignature) {
        try {
          const signedSession = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
          if (signedSession.userId) {
            const db = readDb();
            const user = db.users.find((candidate: any) => candidate.id === signedSession.userId);
            if (user && !user.isBlocked) {
              (req as any).user = user;
              return next();
            }
          }
        } catch {
          // Continue with the legacy token checks below.
        }
      }
    }

    // If token exists in mock/default format, check if we can resolve standard demo user
    if (token === 'demo-token-investor') {
      const db = readDb();
      const user = db.users.find((u: any) => u.email === 'investor@capitalnest.np');
      if (user) {
        (req as any).user = user;
        return next();
      }
    }
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.id === session.userId);
  if (!user || user.isBlocked) {
    return res.status(401).json({ error: 'User account disabled or not found.' });
  }

  (req as any).user = user;
  next();
}

function adminMiddleware(req: Request, res: Response, next: Function) {
  authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
  });
}

// Pre-populate default tokens for immediate dev testing
SESSIONS.set('demo-token-investor', { userId: 'usr_investor_01', role: 'user', email: 'investor@capitalnest.np' });

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'CapitalNest Nepal', timestamp: new Date().toISOString() });
});

app.get('/api/payment-settings', (req, res) => {
  if (supabase) {
    void supabase.from('payment_settings').select('*').order('id').then(({ data, error }) => {
      if (!error && data) {
        return res.json(data.map((setting: any) => ({
          id: setting.id,
          title: setting.title,
          accountName: setting.account_name,
          accountId: setting.account_id,
          qrImage: setting.qr_image || '',
        })));
      }
      const db = readDb();
      return res.json(getPaymentSettings(db));
    });
    return;
  }
  const db = readDb();
  const settings = getPaymentSettings(db);
  writeDb(db);
  res.json(settings);
});

// --- AUTHENTICATION ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, phone, password, referralCode, registrationDeviceId } = req.body;

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const db = readDb();
  const normalizedEmail = email.toLowerCase().trim();
  const registrationIp = getClientIp(req);

  if (db.users.some((u: any) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const normalizedPhone = normalizePhone(phone);
  if (db.users.some((u: any) => normalizePhone(String(u.phone || '')) === normalizedPhone)) {
    return res.status(400).json({ error: 'An account with this phone number already exists.' });
  }

  if (registrationDeviceId) {
    const pendingDuplicate = [...PENDING_REGISTRATIONS.values()].some((pending) => pending.registrationDeviceId === registrationDeviceId);
    if (pendingDuplicate) return res.status(400).json({ error: 'This device already has a pending registration.' });
  }

  if (supabase) {
    const [{ data: emailMatch }, { data: phoneMatch }, { data: ipMatch }, { data: deviceMatch }] = await Promise.all([
      supabase.from('profiles').select('id').eq('email', normalizedEmail).limit(1).maybeSingle(),
      supabase.from('profiles').select('id').eq('phone', normalizedPhone).limit(1).maybeSingle(),
      registrationIp ? supabase.from('profiles').select('id').eq('registration_ip', registrationIp).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      registrationDeviceId ? supabase.from('profiles').select('id').eq('registration_device_id', registrationDeviceId).limit(1).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (emailMatch) return res.status(400).json({ error: 'An account with this email already exists.' });
    if (phoneMatch) return res.status(400).json({ error: 'An account with this phone number already exists.' });
    if (ipMatch) return res.status(400).json({ error: 'Only one account can be registered from this IP address.' });
    if (deviceMatch) return res.status(400).json({ error: 'Only one account can be registered from this device.' });
  }

  if (supabaseAuth) {
    PENDING_REGISTRATIONS.set(normalizedEmail, {
      fullName: fullName.trim(),
      phone: normalizedPhone,
      passwordHash: hashPassword(password),
      referralCode: referralCode?.trim() || undefined,
      registrationIp,
      registrationDeviceId,
    });
    return res.status(201).json({
      message: 'Registration details saved temporarily. Verify your email to create the account.',
      emailVerificationRequired: true,
    });
  }

  // Generate clean referral code from full name
  const cleanNameCode = makeUniqueReferralCode(fullName, db.users);
  const userId = 'usr_' + crypto.randomBytes(8).toString('hex');

  // Check referrer if provided
  let referrerId: string | undefined;
  if (referralCode && referralCode.trim()) {
    const cleanRef = referralCode.trim().toUpperCase();
    const referrer = db.users.find((u: any) => u.referralCode?.toUpperCase() === cleanRef);
    if (referrer && referrer.id !== userId) {
      referrerId = referrer.id;
    }
  }

  const newUser = {
    id: userId,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: 'user',
    fullName: fullName.trim(),
    phone: normalizedPhone,
    referralCode: cleanNameCode,
    referredBy: referralCode?.trim() || undefined,
    kycStatus: 'unverified',
    twoFactorEnabled: false,
    isBlocked: false,
    emailVerified: !supabaseAuth,
    emailVerificationSentAt: supabaseAuth ? new Date().toISOString() : undefined,
    registrationIp,
    registrationDeviceId: registrationDeviceId || undefined,
    createdAt: new Date().toISOString(),
  };

  const newWallet = {
    userId: userId,
    availableBalance: 0,
    investedBalance: 0,
    totalEarnings: 0,
    referralEarnings: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    pendingDeposits: 0,
    updatedAt: new Date().toISOString(),
  };

  // Welcome notification
  const welcomeNotif = {
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: userId,
    title: 'Welcome to CapitalNest Nepal! 🇳🇵',
    message: 'Your account is ready. Deposit funds and explore our high-yield investment plans to start growing your wealth.',
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.wallets.push(newWallet);
  db.notifications.push(welcomeNotif);

  // If referred, create referral record
  if (referrerId) {
    const referrerWallet = db.wallets.find((wallet: any) => wallet.userId === referrerId);
    if (referrerWallet) {
      referrerWallet.referralEarnings = (referrerWallet.referralEarnings || 0) + 100;
      referrerWallet.updatedAt = new Date().toISOString();
    }
    newWallet.availableBalance = 50;

    db.referrals.push({
      id: 'ref_' + crypto.randomBytes(6).toString('hex'),
      referrerId: referrerId,
      referredUserId: userId,
      referredUserName: newUser.fullName,
      referredUserEmail: newUser.email,
      status: 'active',
      totalInvestedByReferred: 0,
      bonusEarned: 100,
      createdAt: new Date().toISOString(),
    });

    db.transactions.unshift({
      id: 'tx_' + crypto.randomBytes(6).toString('hex'),
      userId: referrerId,
      type: 'referral_bonus',
      direction: 'in',
      amount: 100,
      reference: `REF-SIGNUP-${userId.toUpperCase()}`,
      description: `NPR 100 referral bonus for inviting ${newUser.fullName}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    db.transactions.unshift({
      id: 'tx_' + crypto.randomBytes(6).toString('hex'),
      userId: userId,
      type: 'referral_bonus',
      direction: 'in',
      amount: 50,
      reference: `WELCOME-REF-${userId.toUpperCase()}`,
      description: 'NPR 50 referral signup welcome bonus',
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    db.notifications.push({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: referrerId,
      title: 'New Referral Registered!',
      message: `${newUser.fullName} registered using your referral code. NPR 100 has been added to your Referral Earnings.`,
      type: 'referral',
      read: false,
      createdAt: new Date().toISOString(),
    });

    db.notifications.push({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: userId,
      title: 'Referral Welcome Bonus Added!',
      message: 'NPR 50 has been added to your available balance for joining through a referral.',
      type: 'referral',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  writeDb(db);

  const token = generateToken(newUser);
  const { passwordHash, ...safeUser } = newUser;

  res.status(201).json({
    message: 'Account created successfully',
    emailVerificationRequired: !!supabaseAuth,
    token,
    user: safeUser,
    wallet: newWallet,
  });
});

// Exchange the verified Supabase session for the app's existing session.
app.post('/api/auth/session', async (req, res) => {
  const authorization = req.headers.authorization || '';
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!supabaseAuth || !accessToken) return res.status(401).json({ error: 'Verified Supabase session required.' });

  const { data, error } = await supabaseAuth.auth.getUser(accessToken);
  const email = data.user?.email?.toLowerCase().trim();
  if (error || !data.user || !email || !data.user.email_confirmed_at) {
    return res.status(401).json({ error: 'Email verification session is invalid or not confirmed.' });
  }

  const db = readDb();
  const user = db.users.find((candidate: any) => candidate.email.toLowerCase() === email);
  const pending = PENDING_REGISTRATIONS.get(email);
  if (!user && !pending) return res.status(404).json({ error: 'CapitalNest account was not found.' });
  let referralRewardResult: any = null;

  if (supabase && data.user) {
    const metadata = data.user.user_metadata || {};
    const profilePayload = {
      id: data.user.id,
      email,
      full_name: user?.fullName || pending?.fullName || metadata.full_name || '',
      phone: user?.phone || pending?.phone || metadata.phone || '',
      role: user?.role || 'user',
      referral_code: user?.referralCode || makeUniqueReferralCode(metadata.full_name || 'USER', db.users),
      referred_by: user?.referredBy || pending?.referralCode || metadata.referral_code || null,
      registration_ip: user?.registrationIp || pending?.registrationIp || null,
      registration_device_id: user?.registrationDeviceId || pending?.registrationDeviceId || null,
      kyc_status: user?.kycStatus || 'unverified',
      email_verified: true,
    };
    const { error: profileError } = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
    if (profileError) console.error(`Supabase profile save failed: ${profileError.message}`);
    const { error: walletError } = await supabase.from('wallets').upsert({ user_id: data.user.id }, { onConflict: 'user_id' });
    if (walletError) console.error(`Supabase wallet save failed: ${walletError.message}`);
    referralRewardResult = await applySupabaseSignupReferral(
      data.user.id,
      profilePayload.full_name,
      email,
      profilePayload.referred_by || undefined,
    );
  }

  if (!user && pending) {
    const cleanNameCode = makeUniqueReferralCode(pending.fullName, db.users);
    const newUser = {
      id: data.user.id,
      email,
      passwordHash: pending.passwordHash,
      role: 'user',
      fullName: pending.fullName,
      phone: pending.phone,
      referralCode: cleanNameCode,
      referredBy: pending.referralCode,
      kycStatus: 'unverified',
      twoFactorEnabled: false,
      isBlocked: false,
      emailVerified: true,
      registrationIp: pending.registrationIp,
      registrationDeviceId: pending.registrationDeviceId,
      createdAt: new Date().toISOString(),
    };
    const newWallet = {
      userId: newUser.id,
      availableBalance: 0,
      investedBalance: 0,
      totalEarnings: 0,
      referralEarnings: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      pendingWithdrawals: 0,
      pendingDeposits: 0,
      updatedAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    db.wallets.push(newWallet);
    db.notifications.push({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: newUser.id,
      title: 'Welcome to CapitalNest Nepal!',
      message: 'Your account is ready. Deposit funds and explore our investment plans.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    });
    if (!referralRewardResult) {
      referralRewardResult = await applySupabaseSignupReferral(newUser.id, newUser.fullName, newUser.email, newUser.referredBy);
    }
    if (referralRewardResult?.rewarded === true) newWallet.availableBalance = 50;
    writeDb(db);
    PENDING_REGISTRATIONS.delete(email);
    const token = generateToken(newUser);
    const { passwordHash, ...safeUser } = newUser;
    return res.json({ message: 'Session created', token, user: safeUser, wallet: newWallet, referralRewarded: referralRewardResult?.rewarded === true });
  }

  user.emailVerified = true;
  delete user.emailVerificationSentAt;
  writeDb(db);

  const token = generateToken(user);
  const wallet = db.wallets.find((candidate: any) => candidate.userId === user.id) || {
    userId: user.id,
    availableBalance: 0,
    investedBalance: 0,
    totalEarnings: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    pendingDeposits: 0,
    updatedAt: new Date().toISOString(),
  };
  const { passwordHash, ...safeUser } = user;
  return res.json({ message: 'Session created', token, user: safeUser, wallet, referralRewarded: referralRewardResult?.rewarded === true });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = readDb();
  const normalizedEmail = email.toLowerCase().trim();
  let user = db.users.find((u: any) => u.email.toLowerCase() === normalizedEmail);

  const seedEmail = process.env.ADMIN_SEED_EMAIL?.toLowerCase().trim();
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  if (seedEmail && seedPassword && normalizedEmail === seedEmail && password === seedPassword) {
    const seededAdmin = db.users.find((candidate: any) => candidate.role === 'admin');
    if (seededAdmin) {
      seededAdmin.email = seedEmail;
      seededAdmin.passwordHash = hashPassword(seedPassword);
      seededAdmin.emailVerified = true;
      user = seededAdmin;
      writeDb(db);
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: 'Your account is suspended. Contact support.' });
  }

  if (supabaseAuth && user.emailVerified === false) {
    return res.status(403).json({ error: 'Please verify your email before signing in.' });
  }

  const inputHash = hashPassword(password);
  if (user.passwordHash !== inputHash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (supabaseAuth) {
    const { error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (authError && /not confirmed|email.*confirm/i.test(authError.message)) {
      return res.status(403).json({ error: 'Please verify your email before signing in.' });
    }
  }

  const token = generateToken(user);
  let wallet = db.wallets.find((w: any) => w.userId === user.id);
  if (!wallet) {
    wallet = {
      userId: user.id,
      availableBalance: 0,
      investedBalance: 0,
      totalEarnings: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      pendingWithdrawals: 0,
      pendingDeposits: 0,
      updatedAt: new Date().toISOString(),
    };
    db.wallets.push(wallet);
    writeDb(db);
  }

  const { passwordHash, ...safeUser } = user;

  res.json({
    message: 'Login successful',
    token,
    user: safeUser,
    wallet,
  });
});

// Get Current User (Me)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  await reconcileSupabaseReferralForUser(user.email);
  const db = readDb();
  if (supabase) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', user.email).maybeSingle();
    if (profile) {
      Object.assign(user, {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        phone: profile.phone,
        avatar: profile.avatar,
        role: profile.role,
        referralCode: profile.referral_code,
        referredBy: profile.referred_by || undefined,
        kycStatus: profile.kyc_status,
        kycDocumentType: profile.kyc_document_type,
        kycDocumentNumber: profile.kyc_document_number,
        twoFactorEnabled: profile.two_factor_enabled,
        isBlocked: profile.is_blocked,
        createdAt: profile.created_at,
      });
    }
  }
  let wallet = db.wallets.find((w: any) => w.userId === user.id) || {
    userId: user.id,
    availableBalance: 0,
    investedBalance: 0,
    totalEarnings: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    pendingDeposits: 0,
    updatedAt: new Date().toISOString(),
  };
  if (supabase) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', user.email).maybeSingle();
    if (profile) {
      const { data: liveWallet } = await supabase.from('wallets').select('*').eq('user_id', profile.id).maybeSingle();
      wallet = mapSupabaseWallet(liveWallet, profile.id);
      user.kycStatus = profile.kyc_status || user.kycStatus;
      user.kycDocumentType = profile.kyc_document_type || user.kycDocumentType;
      user.kycDocumentNumber = profile.kyc_document_number || user.kycDocumentNumber;
      user.kycDocumentImageFront = profile.kyc_document_image_front || user.kycDocumentImageFront;
      user.kycDocumentImageBack = profile.kyc_document_image_back || user.kycDocumentImageBack;
    }
  }

  const unreadNotifs = db.notifications.filter((n: any) => n.userId === user.id && !n.read).length;
  const { passwordHash, ...safeUser } = user;

  res.json({
    user: safeUser,
    wallet,
    unreadNotifications: unreadNotifs,
  });
});

// Update Profile
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { fullName, phone, avatar } = req.body;

  const db = readDb();
  const userIndex = db.users.findIndex((u: any) => u.id === user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (fullName) db.users[userIndex].fullName = fullName.trim();
  if (phone) db.users[userIndex].phone = phone.trim();
  if (avatar) db.users[userIndex].avatar = avatar;

  writeDb(db);

  const { passwordHash, ...safeUser } = db.users[userIndex];
  res.json({ message: 'Profile updated successfully', user: safeUser });
});

// Change Password
app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const db = readDb();
  const userIndex = db.users.findIndex((u: any) => u.id === user.id);

  if (userIndex === -1 || db.users[userIndex].passwordHash !== hashPassword(currentPassword)) {
    return res.status(400).json({ error: 'Current password does not match.' });
  }

  db.users[userIndex].passwordHash = hashPassword(newPassword);
  writeDb(db);

  res.json({ message: 'Password changed successfully.' });
});

// Forgot Password (Simulated Secure Flow)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const db = readDb();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (user) {
    // In production, an email is dispatched. For simulation, provide instant instructions.
    return res.json({
      message: 'Password reset link has been dispatched to your email address.',
      email: user.email,
    });
  }

  // Generic response to avoid email enumeration
  res.json({ message: 'If an account exists with this email, reset instructions have been sent.' });
});

// Submit KYC
app.post('/api/auth/kyc', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const { documentType, documentNumber, documentImageFront, documentImageBack } = req.body;

  if (!documentType || !documentNumber) {
    return res.status(400).json({ error: 'Document type and identification number are required.' });
  }

  const db = readDb();
  const userIndex = db.users.findIndex((u: any) => u.id === user.id);

  if (supabase) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', user.email).maybeSingle();
    if (profile) {
      const kycImages = { front: documentImageFront || '', back: documentImageBack || '' };
      let { error } = await supabase.from('profiles').update({
        kyc_status: 'pending',
        kyc_document_type: documentType,
        kyc_document_number: documentNumber.trim(),
        kyc_document_image_front: documentImageFront || null,
        kyc_document_image_back: documentImageBack || null,
      }).eq('id', profile.id);
      if (error && /column .* does not exist/i.test(error.message)) {
        const fallback = await supabase.from('profiles').update({
          kyc_status: 'pending',
          kyc_document_type: documentType,
          kyc_document_number: documentNumber.trim(),
          kyc_document_image: JSON.stringify(kycImages),
        }).eq('id', profile.id);
        error = fallback.error;
      }
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ message: 'KYC documents submitted for verification.', user: { ...user, kycStatus: 'pending', kycDocumentType: documentType, kycDocumentNumber: documentNumber.trim(), kycDocumentImageFront: documentImageFront, kycDocumentImageBack: documentImageBack } });
    }
  }

  if (userIndex !== -1) {
    db.users[userIndex].kycStatus = 'pending';
    db.users[userIndex].kycDocumentType = documentType;
    db.users[userIndex].kycDocumentNumber = documentNumber;
    if (documentImageFront) db.users[userIndex].kycDocumentImageFront = documentImageFront;
    if (documentImageBack) db.users[userIndex].kycDocumentImageBack = documentImageBack;

    db.notifications.push({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: user.id,
      title: 'KYC Verification Submitted',
      message: 'Your identity verification documents have been submitted and are under review by our compliance team.',
      type: 'security',
      read: false,
      createdAt: new Date().toISOString(),
    });

    writeDb(db);
  }

  const { passwordHash, ...safeUser } = db.users[userIndex];
  res.json({ message: 'KYC documents submitted for verification.', user: safeUser });
});

// --- INVESTMENT PLANS ---

// Get all plans
app.get('/api/plans', (req, res) => {
  const db = readDb();
  const plans = db.plans || INITIAL_PLANS;
  res.json(plans);
});

// --- USER INVESTMENTS ---

// Get user's investments
app.get('/api/investments', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = readDb();
  const userInvestments = db.investments.filter((inv: any) => inv.userId === user.id);

  // Recalculate dynamic progress and days remaining based on current time
  const now = Date.now();
  const updated = userInvestments.map((inv: any) => {
    const start = new Date(inv.startDate).getTime();
    const end = new Date(inv.endDate).getTime();
    const totalDuration = end - start;
    const elapsed = Math.max(0, now - start);
    const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

    return {
      ...inv,
      progressPercentage: progress,
      daysRemaining,
    };
  });

  res.json(updated);
});

// Create new Investment
app.post('/api/investments', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const { planId, amount } = req.body;

  const invAmount = Number(amount);
  if (!planId || !invAmount || invAmount <= 0) {
    return res.status(400).json({ error: 'Valid plan and investment amount are required.' });
  }

  const db = readDb();
  const plan = (db.plans || INITIAL_PLANS).find((p: any) => p.id === planId);

  if (!plan || plan.status !== 'active') {
    return res.status(400).json({ error: 'The selected investment plan is not available.' });
  }

  if (invAmount < plan.minimumAmount) {
    return res.status(400).json({
      error: `Minimum investment for ${plan.name} is NPR ${plan.minimumAmount.toLocaleString('en-IN')}.`,
    });
  }

  if (plan.maximumAmount && invAmount > plan.maximumAmount) {
    return res.status(400).json({
      error: `Maximum investment for ${plan.name} is NPR ${plan.maximumAmount.toLocaleString('en-IN')}.`,
    });
  }

  const walletIndex = db.wallets.findIndex((w: any) => w.userId === user.id);
  if (walletIndex === -1) {
    return res.status(400).json({ error: 'Wallet not found.' });
  }

  let wallet = db.wallets[walletIndex];
  let persistenceUserId = user.id;
  if (supabase) {
    const { data: liveProfile } = await supabase.from('profiles').select('id').eq('email', user.email).maybeSingle();
    if (liveProfile) {
      persistenceUserId = liveProfile.id;
      const { data: liveWallet, error: liveWalletError } = await supabase.from('wallets').select('*').eq('user_id', liveProfile.id).maybeSingle();
      if (liveWalletError) return res.status(500).json({ error: liveWalletError.message });
      if (liveWallet) {
        wallet = {
          ...wallet,
          availableBalance: Number(liveWallet.available_balance || 0),
          investedBalance: Number(liveWallet.invested_balance || 0),
          totalEarnings: Number(liveWallet.total_earnings || 0),
          referralEarnings: Number(liveWallet.referral_earnings || 0),
          totalDeposited: Number(liveWallet.total_deposited || 0),
          totalWithdrawn: Number(liveWallet.total_withdrawn || 0),
          pendingWithdrawals: Number(liveWallet.pending_withdrawals || 0),
          pendingDeposits: Number(liveWallet.pending_deposits || 0),
          updatedAt: liveWallet.updated_at,
        };
        db.wallets[walletIndex] = wallet;
      }
    }
  }
  if (wallet.availableBalance < invAmount) {
    return res.status(400).json({
      error: `Insufficient available balance (NPR ${wallet.availableBalance.toLocaleString('en-IN')}). Please deposit funds first.`,
    });
  }

  // Calculations
  const expectedProfit = (invAmount * plan.returnRate) / 100;
  const expectedTotalReturn = invAmount + expectedProfit;
  const dailyReturn = expectedProfit / plan.durationDays;

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  const nextPayout = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

  const investmentId = 'inv_' + crypto.randomBytes(6).toString('hex');
  const newInvestment = {
    id: investmentId,
    userId: user.id,
    planId: plan.id,
    planName: plan.name,
    amount: invAmount,
    returnRate: plan.returnRate,
    expectedReturn: expectedTotalReturn,
    dailyReturnAmount: Number(dailyReturn.toFixed(2)),
    profitEarnedSoFar: 0,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    nextPayoutDate: nextPayout.toISOString(),
    durationDays: plan.durationDays,
    daysRemaining: plan.durationDays,
    progressPercentage: 0,
    status: 'active',
    createdAt: startDate.toISOString(),
  };

  // Deduct from wallet securely
  wallet.availableBalance -= invAmount;
  wallet.investedBalance += invAmount;
  wallet.updatedAt = new Date().toISOString();

  // Create Transaction
  const txId = 'tx_' + crypto.randomBytes(6).toString('hex');
  const newTx = {
    id: txId,
    userId: user.id,
    type: 'investment',
    direction: 'out',
    amount: invAmount,
    reference: investmentId.toUpperCase(),
    description: `Investment in ${plan.name} (${plan.durationDays} Days @ ${plan.returnRate}%)`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  // Create Notification
  const newNotif = {
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: user.id,
    title: 'Investment Activated! 📈',
    message: `Your investment of NPR ${invAmount.toLocaleString('en-IN')} in ${plan.name} has been activated. Expected return: NPR ${expectedTotalReturn.toLocaleString('en-IN')}.`,
    type: 'investment',
    read: false,
    createdAt: new Date().toISOString(),
  };

  if (supabase && user.referredBy) {
    const { error: commissionError } = await supabase.rpc('process_referral_investment_commission', {
      p_referred_user_id: user.id,
      p_investment_id: investmentId,
      p_investment_amount: invAmount,
    });
    if (commissionError) return res.status(500).json({ error: `Referral commission processing failed: ${commissionError.message}` });
  }

  db.investments.unshift(newInvestment);
  db.transactions.unshift(newTx);
  db.notifications.unshift(newNotif);

  if (supabase) {
    const { error: walletPersistenceError } = await supabase.from('wallets').upsert({
      user_id: persistenceUserId,
      available_balance: wallet.availableBalance,
      invested_balance: wallet.investedBalance,
      total_earnings: wallet.totalEarnings || 0,
      referral_earnings: wallet.referralEarnings || 0,
      total_deposited: wallet.totalDeposited || 0,
      total_withdrawn: wallet.totalWithdrawn || 0,
      pending_withdrawals: wallet.pendingWithdrawals || 0,
      pending_deposits: wallet.pendingDeposits || 0,
      updated_at: wallet.updatedAt,
    }, { onConflict: 'user_id' });
    if (walletPersistenceError) return res.status(500).json({ error: `Investment wallet update failed: ${walletPersistenceError.message}` });

    const { error: investmentPersistenceError } = await supabase.from('investments').upsert({
      id: investmentId,
      user_id: persistenceUserId,
      plan_id: plan.id,
      plan_name: plan.name,
      amount: invAmount,
      return_rate: plan.returnRate,
      expected_return: expectedTotalReturn,
      daily_return_amount: Number(dailyReturn.toFixed(2)),
      end_date: endDate.toISOString(),
      next_payout_date: nextPayout.toISOString(),
      duration_days: plan.durationDays,
      days_remaining: plan.durationDays,
      progress_percentage: 0,
      status: 'active',
      created_at: startDate.toISOString(),
    }, { onConflict: 'id' });
    if (investmentPersistenceError) return res.status(500).json({ error: `Investment save failed: ${investmentPersistenceError.message}` });
    const { error: transactionPersistenceError } = await supabase.from('transactions').upsert({
      id: txId,
      user_id: persistenceUserId,
      type: 'investment',
      direction: 'out',
      amount: invAmount,
      reference: investmentId.toUpperCase(),
      description: newTx.description,
      status: 'completed',
      created_at: startDate.toISOString(),
    }, { onConflict: 'id' });
    if (transactionPersistenceError) return res.status(500).json({ error: `Investment transaction save failed: ${transactionPersistenceError.message}` });
  }

  // If user was referred, check if referrer gets referral commission on first investment
  if (user.referredBy) {
    const referrer = db.users.find(
      (u: any) => u.referralCode?.toUpperCase() === user.referredBy?.toUpperCase() || u.id === user.referredBy
    );
    if (referrer) {
      const commissionRate = 0.05;
      const commissionAmount = invAmount * commissionRate;
      const refRec = db.referrals.find((r: any) => r.referrerId === referrer.id && r.referredUserId === user.id);
      if (refRec?.investmentCommissionRewarded) {
        writeDb(db);
        return res.status(201).json({ message: 'Investment activated successfully!', investment: newInvestment, wallet });
      }

      const refWalletIndex = db.wallets.findIndex((w: any) => w.userId === referrer.id);
      if (refWalletIndex !== -1) {
        const refWallet = db.wallets[refWalletIndex];
        refWallet.referralEarnings = (refWallet.referralEarnings || 0) + commissionAmount;
        const referralBalance = refWallet.referralEarnings;
        if (referralBalance >= 1000) {
          refWallet.availableBalance += referralBalance;
          refWallet.totalEarnings = (refWallet.totalEarnings || 0) + referralBalance;
          refWallet.referralEarnings = 0;
        }
        refWallet.updatedAt = new Date().toISOString();

        if (referralBalance >= 1000) db.transactions.unshift({
          id: 'tx_' + crypto.randomBytes(6).toString('hex'),
          userId: referrer.id,
          type: 'referral_bonus',
          direction: 'in',
          amount: referralBalance,
          reference: 'REF-' + user.fullName.split(' ')[0].toUpperCase(),
          description: `5% Referral Commission from ${user.fullName} investment`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        });

        db.notifications.unshift({
          id: 'notif_' + crypto.randomBytes(6).toString('hex'),
          userId: referrer.id,
          title: 'Referral Bonus Earned! 🎁',
          message: referralBalance >= 1000
            ? `Your referral earnings reached NPR ${referralBalance.toLocaleString('en-IN')} and were added to your available balance.`
            : `NPR ${commissionAmount.toLocaleString('en-IN')} referral earning added. NPR ${(1000 - referralBalance).toLocaleString('en-IN')} more is needed to unlock it.`,
          type: 'referral',
          read: false,
          createdAt: new Date().toISOString(),
        });

        // Update referral record
          if (refRec && !refRec.investmentCommissionRewarded) {
          refRec.status = 'active';
          refRec.totalInvestedByReferred = (refRec.totalInvestedByReferred || 0) + invAmount;
          refRec.bonusEarned = (refRec.bonusEarned || 0) + commissionAmount;
            refRec.investmentCommissionRewarded = true;
        }
      }
    }
  }

  writeDb(db);

  res.status(201).json({
    message: 'Investment activated successfully!',
    investment: newInvestment,
    wallet,
  });
});

// --- DEPOSITS ---

// Get user's deposits
app.get('/api/deposits', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = readDb();
  const deposits = db.deposits.filter((d: any) => d.userId === user.id);
  res.json(deposits);
});

// Submit deposit request
app.post('/api/deposits', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { amount, paymentMethod, paymentReference, senderName, senderAccount, paymentProof, notes } = req.body;

  const depAmount = Number(amount);
  if (!depAmount || depAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid deposit amount.' });
  }

  if (!paymentMethod || !paymentReference) {
    return res.status(400).json({ error: 'Payment method and transaction reference are required.' });
  }

  const db = readDb();
  const depositId = 'dep_' + crypto.randomBytes(6).toString('hex');

  const newDeposit = {
    id: depositId,
    userId: user.id,
    userFullName: user.fullName,
    userEmail: user.email,
    amount: depAmount,
    paymentMethod,
    paymentReference: paymentReference.trim(),
    senderName: senderName?.trim() || user.fullName,
    senderAccount: senderAccount?.trim() || '',
    paymentProof: paymentProof || undefined,
    notes: notes?.trim() || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Transaction record with pending status
  const newTx = {
    id: 'tx_' + crypto.randomBytes(6).toString('hex'),
    userId: user.id,
    type: 'deposit',
    direction: 'in',
    amount: depAmount,
    reference: paymentReference.trim(),
    description: `Deposit via ${paymentMethod.replace('_', ' ').toUpperCase()} (Pending)`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Notification
  const newNotif = {
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: user.id,
    title: 'Deposit Submitted',
    message: `Your deposit request of NPR ${depAmount.toLocaleString('en-IN')} is under verification. Funds will be credited once verified.`,
    type: 'deposit',
    read: false,
    createdAt: new Date().toISOString(),
  };

  // Update pending deposit count on wallet
  const wallet = db.wallets.find((w: any) => w.userId === user.id);
  if (wallet) {
    wallet.pendingDeposits = (wallet.pendingDeposits || 0) + depAmount;
    wallet.updatedAt = new Date().toISOString();
  }

  db.deposits.unshift(newDeposit);
  db.transactions.unshift(newTx);
  db.notifications.unshift(newNotif);

  writeDb(db);

  res.status(201).json({
    message: 'Deposit request submitted successfully. Pending admin verification.',
    deposit: newDeposit,
    wallet,
  });
});

// --- WITHDRAWALS ---

// Get user's withdrawals
app.get('/api/withdrawals', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = readDb();
  const withdrawals = db.withdrawals.filter((w: any) => w.userId === user.id);
  res.json(withdrawals);
});

// Submit withdrawal request
app.post('/api/withdrawals', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { amount, method, accountDetails } = req.body;

  if (user.kycStatus !== 'verified') {
    return res.status(403).json({ error: 'KYC verification is required before you can withdraw funds.' });
  }

  const wthAmount = Number(amount);
  if (!wthAmount || wthAmount < 1000) {
    return res.status(400).json({ error: 'Minimum withdrawal amount is NPR 1,000.' });
  }
  if (wthAmount > 50000) {
    return res.status(400).json({ error: 'Maximum withdrawal amount is NPR 50,000.' });
  }

  if (!method || !accountDetails) {
    return res.status(400).json({ error: 'Withdrawal method and payout account details are required.' });
  }

  const db = readDb();
  const walletIndex = db.wallets.findIndex((w: any) => w.userId === user.id);
  if (walletIndex === -1) {
    return res.status(400).json({ error: 'Wallet not found.' });
  }

  const wallet = db.wallets[walletIndex];
  if (wallet.availableBalance < wthAmount) {
    return res.status(400).json({
      error: `Insufficient available balance (NPR ${wallet.availableBalance.toLocaleString('en-IN')}).`,
    });
  }

  // Deduct from available balance and move to pending withdrawals
  wallet.availableBalance -= wthAmount;
  wallet.pendingWithdrawals = (wallet.pendingWithdrawals || 0) + wthAmount;
  wallet.updatedAt = new Date().toISOString();

  const withdrawalId = 'wth_' + crypto.randomBytes(6).toString('hex');
  const newWithdrawal = {
    id: withdrawalId,
    userId: user.id,
    userFullName: user.fullName,
    userEmail: user.email,
    amount: wthAmount,
    method,
    accountDetails,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const newTx = {
    id: 'tx_' + crypto.randomBytes(6).toString('hex'),
    userId: user.id,
    type: 'withdrawal',
    direction: 'out',
    amount: wthAmount,
    reference: withdrawalId.toUpperCase(),
    description: `Withdrawal request to ${method.replace('_', ' ').toUpperCase()} (Pending)`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const newNotif = {
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: user.id,
    title: 'Withdrawal Requested 💸',
    message: `Withdrawal request of NPR ${wthAmount.toLocaleString('en-IN')} submitted. Our treasury team is processing your transfer.`,
    type: 'withdrawal',
    read: false,
    createdAt: new Date().toISOString(),
  };

  db.withdrawals.unshift(newWithdrawal);
  db.transactions.unshift(newTx);
  db.notifications.unshift(newNotif);

  writeDb(db);

  res.status(201).json({
    message: 'Withdrawal request placed successfully. It will be credited after processing.',
    withdrawal: newWithdrawal,
    wallet,
  });
});

// --- WALLET & TRANSACTIONS ---

// Get Wallet
app.get('/api/wallet', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  await reconcileSupabaseReferralForUser(user.email);
  const db = readDb();
  let wallet = db.wallets.find((w: any) => w.userId === user.id);

  if (!wallet) {
    wallet = {
      userId: user.id,
      availableBalance: 0,
      investedBalance: 0,
      totalEarnings: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      pendingWithdrawals: 0,
      pendingDeposits: 0,
      updatedAt: new Date().toISOString(),
    };
    if (supabase) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', user.email).maybeSingle();
      if (profile) {
        const { data: liveWallet } = await supabase.from('wallets').select('*').eq('user_id', profile.id).maybeSingle();
        wallet = mapSupabaseWallet(liveWallet, profile.id);
      }
    }
  }

  res.json(wallet);
});

// Get Transactions
app.get('/api/transactions', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { type, status, search } = req.query;

  const db = readDb();
  let userTx = db.transactions.filter((tx: any) => tx.userId === user.id);

  if (type && type !== 'all') {
    userTx = userTx.filter((tx: any) => tx.type === type);
  }

  if (status && status !== 'all') {
    userTx = userTx.filter((tx: any) => tx.status === status);
  }

  if (search) {
    const s = String(search).toLowerCase();
    userTx = userTx.filter(
      (tx: any) =>
        tx.reference.toLowerCase().includes(s) ||
        tx.description.toLowerCase().includes(s) ||
        String(tx.amount).includes(s)
    );
  }

  res.json(userTx);
});

// --- REFERRALS ---

// Get Referral stats
app.get('/api/referrals', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const db = readDb();
  if (supabase) {
    const [{ data: profile }, { data: referrals }, { data: wallet }, { data: investments }] = await Promise.all([
      supabase.from('profiles').select('id, referral_code').eq('email', user.email).maybeSingle(),
      supabase.from('referrals').select('*').order('created_at', { ascending: false }),
      supabase.from('wallets').select('referral_earnings').eq('user_id', user.id).maybeSingle(),
      supabase.from('investments').select('user_id, amount, status'),
    ]);
    if (profile && referrals) {
      const { data: liveWallet } = await supabase.from('wallets').select('referral_earnings').eq('user_id', profile.id).maybeSingle();
      const userReferrals = referrals.filter((referral: any) => referral.referrer_id === profile.id);
      const referredIds = userReferrals.map((referral: any) => referral.referred_user_id);
      const { data: referredProfiles } = referredIds.length
        ? await supabase.from('profiles').select('id, full_name, email, created_at').in('id', referredIds)
        : { data: [] };
      const profileById = new Map((referredProfiles || []).map((referredProfile: any) => [referredProfile.id, referredProfile]));
      const referralHistory = userReferrals.map((referral: any) => {
        const referredProfile = profileById.get(referral.referred_user_id) as any;
        return {
          id: referral.id,
          referredUserId: referral.referred_user_id,
          referredUserName: referredProfile?.full_name || referral.referred_user_id,
          referredUserEmail: referredProfile?.email || '',
          status: referral.status,
          totalInvestedByReferred: Number(referral.total_invested_by_referred),
          bonusEarned: Number(referral.bonus_earned),
          createdAt: referral.created_at,
          fullName: referredProfile?.full_name || referredProfile?.email || referral.referred_user_id,
          joinedAt: referredProfile?.created_at || referral.created_at,
          commissionEarned: Number(referral.bonus_earned),
          investmentActivity: (investments || [])
            .filter((investment: any) => investment.user_id === referral.referred_user_id)
            .reduce((sum: number, investment: any) => sum + Number(investment.amount || 0), 0),
        };
      });
      return res.json({
        referralCode: profile.referral_code,
        referralLink: `${req.protocol}://${req.get('host')}/register?ref=${profile.referral_code}`,
        totalReferrals: referralHistory.length,
        activeReferrals: referralHistory.filter((referral: any) => referral.status === 'successful' || referral.status === 'active').length,
        totalBonusEarned: referralHistory.reduce((sum: number, referral: any) => sum + referral.bonusEarned, 0),
        totalReferred: referralHistory.length,
        totalEarnings: referralHistory.reduce((sum: number, referral: any) => sum + referral.commissionEarned, 0),
        referralEarnings: Number(liveWallet?.referral_earnings || wallet?.referral_earnings || 0),
        pendingReferrals: referralHistory.filter((referral: any) => referral.status === 'pending').length,
        commissionRate: 5,
        referralHistory,
        referees: referralHistory,
      });
    }
  }

  const userReferrals = db.referrals.filter((r: any) => r.referrerId === user.id);
  const totalBonus = userReferrals.reduce((sum: number, r: any) => sum + (r.bonusEarned || 0), 0);
  const activeCount = userReferrals.filter((r: any) => r.status === 'successful' || r.status === 'active').length;
  const wallet = db.wallets.find((candidate: any) => candidate.userId === user.id);

  res.json({
    referralCode: user.referralCode,
    referralLink: `${req.protocol}://${req.get('host')}/register?ref=${user.referralCode}`,
    totalReferrals: userReferrals.length,
    activeReferrals: activeCount,
    totalBonusEarned: totalBonus,
    totalReferred: userReferrals.length,
    totalEarnings: totalBonus,
    referralEarnings: wallet?.referralEarnings || 0,
    pendingReferrals: userReferrals.filter((referral: any) => referral.status === 'pending').length,
    commissionRate: 5, // 5%
    referralHistory: userReferrals,
    referees: userReferrals,
  });
});

// --- NOTIFICATIONS ---

// Get notifications
app.get('/api/notifications', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = readDb();
  const userNotifs = db.notifications.filter((n: any) => n.userId === user.id);
  res.json(userNotifs);
});

// Mark single notification as read
app.patch('/api/notifications/:id/read', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const db = readDb();
  const notif = db.notifications.find((n: any) => n.id === id && n.userId === user.id);
  if (notif) {
    notif.read = true;
    writeDb(db);
  }

  res.json({ success: true });
});

// Mark all as read
app.post('/api/notifications/read-all', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = readDb();

  db.notifications.forEach((n: any) => {
    if (n.userId === user.id) {
      n.read = true;
    }
  });

  writeDb(db);
  res.json({ success: true });
});

// --- SUPPORT TICKETS ---

// Get support tickets
app.get('/api/support/tickets', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  if (supabase) {
    const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json((data || []).map(mapSupabaseTicket));
  }
  const db = readDb();
  const tickets = db.supportTickets.filter((t: any) => t.userId === user.id);
  res.json(tickets);
});

// Create support ticket
app.post('/api/support/tickets', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const { subject, category, message, attachment } = req.body;

  if (!subject || !message) {
      if (supabase) {
        const ticket = {
          id: `tkt_${crypto.randomBytes(6).toString('hex')}`,
          user_id: user.id,
          user_name: user.fullName,
          user_email: user.email,
          subject: subject.trim(),
          category: category || 'general',
          message: message.trim(),
          attachment: attachment || null,
          status: 'open',
          replies: [],
        };
        const { data, error } = await supabase.from('support_tickets').insert(ticket).select('*').single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json({ message: 'Support ticket submitted successfully.', ticket: mapSupabaseTicket(data) });
      }
    return res.status(400).json({ error: 'Subject and message are required.' });
  }

  const db = readDb();
  const ticketId = 'tkt_' + crypto.randomBytes(6).toString('hex');

  const newTicket = {
    id: ticketId,
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    subject: subject.trim(),
    category: category || 'general',
    message: message.trim(),
    attachment: attachment || undefined,
    status: 'open',
    replies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.supportTickets.unshift(newTicket);
  writeDb(db);

  res.status(201).json({ message: 'Support ticket submitted successfully.', ticket: newTicket });
});

// Reply to support ticket
app.post('/api/support/tickets/:id/reply', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
      if (supabase) {
        const { data: ticket, error: lookupError } = await supabase.from('support_tickets').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
        if (lookupError) return res.status(500).json({ error: lookupError.message });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
        const reply = { id: `rep_${crypto.randomBytes(6).toString('hex')}`, senderRole: 'user', senderName: user.fullName, message: message.trim(), createdAt: new Date().toISOString() };
        const { data: updated, error } = await supabase.from('support_tickets').update({ replies: [...(ticket.replies || []), reply], status: 'open', updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ message: 'Reply sent', ticket: mapSupabaseTicket(updated) });
      }
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const db = readDb();
  const ticket = db.supportTickets.find((t: any) => t.id === id && t.userId === user.id);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  const newReply = {
    id: 'rep_' + crypto.randomBytes(6).toString('hex'),
    senderRole: 'user',
    senderName: user.fullName,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  ticket.replies.push(newReply);
  ticket.updatedAt = new Date().toISOString();
  if (ticket.status === 'resolved') {
    ticket.status = 'open';
  }

  writeDb(db);
  res.json({ message: 'Reply sent', ticket });
});

// ==========================================
// ADMIN API ROUTES
// ==========================================

function userReferralsForAdmin(db: any, userId: string): number {
  return db.referrals
    .filter((referral: any) => referral.referrerId === userId)
    .reduce((total: number, referral: any) => total + (referral.bonusEarned || 0), 0);
}

app.put('/api/admin/payment-settings', adminMiddleware, async (req, res) => {
  const updates = Array.isArray(req.body) ? req.body : [];
  if (supabase) {
    const rows = updates.map((setting: any) => ({
      id: setting.id,
      title: String(setting.title || '').trim(),
      account_name: String(setting.accountName || '').trim(),
      account_id: String(setting.accountId || '').trim(),
      qr_image: typeof setting.qrImage === 'string' ? setting.qrImage : '',
      updated_at: new Date().toISOString(),
    })).filter((setting: any) => ['esewa', 'khalti', 'fonepay'].includes(setting.id));
    const { data, error } = await supabase.from('payment_settings').upsert(rows, { onConflict: 'id' }).select('*').order('id');
    if (error) return res.status(500).json({ error: error.message });
    return res.json({
      message: 'Payment settings updated successfully.',
      settings: (data || []).map((setting: any) => ({ id: setting.id, title: setting.title, accountName: setting.account_name, accountId: setting.account_id, qrImage: setting.qr_image || '' })),
    });
  }
  const db = readDb();
  const currentSettings = getPaymentSettings(db);

  currentSettings.forEach((setting: any) => {
    const update = updates.find((candidate: any) => candidate.id === setting.id);
    if (!update) return;
    setting.title = String(update.title || setting.title).trim();
    setting.accountName = String(update.accountName || '').trim();
    setting.accountId = String(update.accountId || '').trim();
    setting.qrImage = typeof update.qrImage === 'string' ? update.qrImage : setting.qrImage;
  });

  writeDb(db);
  res.json({ message: 'Payment settings updated successfully.', settings: currentSettings });
});

app.put('/api/admin/users/:id/credentials', adminMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase admin authentication is not configured.' });
  const db = readDb();
  const user = db.users.find((candidate: any) => candidate.id === req.params.id);
  const currentEmail = typeof req.body.currentEmail === 'string' ? req.body.currentEmail.trim().toLowerCase() : user?.email?.toLowerCase();
  let targetProfile: any = null;
  if (currentEmail) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', currentEmail).maybeSingle();
    targetProfile = profile;
  }
  if (!user && !targetProfile) return res.status(404).json({ error: 'User not found.' });
  const resolvedUser = user || {
    id: targetProfile.id,
    email: targetProfile.email,
    fullName: targetProfile.full_name,
    role: targetProfile.role,
    phone: targetProfile.phone || '',
    referralCode: targetProfile.referral_code,
    kycStatus: targetProfile.kyc_status,
    createdAt: targetProfile.created_at,
  };

  const nextEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : undefined;
  const nextPassword = typeof req.body.password === 'string' ? req.body.password : undefined;
  if (!nextEmail && !nextPassword) return res.status(400).json({ error: 'Enter a new email or password.' });
  if (nextEmail && !/^\S+@\S+\.\S+$/.test(nextEmail)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (nextPassword && nextPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return res.status(500).json({ error: `Could not find Supabase user: ${listError.message}` });
  const authUser = (authUsers.users as any[]).find((candidate: any) => candidate.id === targetProfile?.id || candidate.email?.toLowerCase() === resolvedUser.email.toLowerCase());
  if (!authUser) return res.status(404).json({ error: 'Matching Supabase Auth user not found.' });

  const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
    ...(nextEmail ? { email: nextEmail } : {}),
    ...(nextPassword ? { password: nextPassword } : {}),
  });
  if (updateError) return res.status(400).json({ error: updateError.message });

  if (nextEmail) {
    resolvedUser.email = nextEmail;
    const profileUpdate = await supabase.from('profiles').update({ email: nextEmail }).eq('id', authUser.id);
    if (profileUpdate.error) return res.status(500).json({ error: `Auth updated, but profile update failed: ${profileUpdate.error.message}` });
  }
  writeDb(db);
  const { passwordHash, ...safeUser } = resolvedUser;
  return res.json({ user: safeUser, message: 'User credentials updated successfully.' });
});

app.post('/api/admin/admins', adminMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase admin authentication is not configured.' });
  const fullName = String(req.body.fullName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
    return res.status(400).json({ error: 'Enter a valid name, email, and password of at least 6 characters.' });
  }

  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (authError || !created.user) return res.status(400).json({ error: authError?.message || 'Could not create Supabase admin.' });

  const db = readDb();
  const referralCode = makeUniqueReferralCode(fullName, db.users);
  const { error: profileError } = await supabase.from('profiles').insert({
    id: created.user.id,
    email,
    full_name: fullName,
    role: 'admin',
    referral_code: referralCode,
    kyc_status: 'verified',
    email_verified: true,
  });
  if (profileError) return res.status(500).json({ error: `Admin Auth created, but profile save failed: ${profileError.message}` });
  await supabase.from('wallets').insert({ user_id: created.user.id });

  const localUser = {
    id: 'usr_' + crypto.randomBytes(8).toString('hex'),
    email,
    passwordHash: hashPassword(password),
    role: 'admin',
    fullName,
    phone: '',
    referralCode,
    kycStatus: 'verified',
    twoFactorEnabled: true,
    isBlocked: false,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  };
  db.users.push(localUser);
  db.wallets.push({ userId: localUser.id, availableBalance: 0, investedBalance: 0, totalEarnings: 0, referralEarnings: 0, totalDeposited: 0, totalWithdrawn: 0, pendingWithdrawals: 0, pendingDeposits: 0, updatedAt: new Date().toISOString() });
  writeDb(db);
  const { passwordHash, ...safeUser } = localUser;
  return res.status(201).json({ user: safeUser, message: 'Administrator account created successfully.' });
});

// Admin Analytics & Summary
app.get('/api/admin/analytics', adminMiddleware, (req, res) => {
  const db = readDb();

  const totalUsers = db.users.filter((u: any) => u.role === 'user').length;
  const totalDepositsVolume = db.deposits
    .filter((d: any) => d.status === 'approved')
    .reduce((sum: number, d: any) => sum + d.amount, 0);

  const totalInvestedVolume = db.investments
    .filter((i: any) => i.status === 'active' || i.status === 'completed')
    .reduce((sum: number, i: any) => sum + i.amount, 0);

  const totalProfitPaid = db.transactions
    .filter((t: any) => t.type === 'profit' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalWithdrawalsVolume = db.withdrawals
    .filter((w: any) => w.status === 'completed' || w.status === 'approved')
    .reduce((sum: number, w: any) => sum + w.amount, 0);

  const pendingDepositsCount = db.deposits.filter((d: any) => d.status === 'pending').length;
  const pendingWithdrawalsCount = db.withdrawals.filter((w: any) => w.status === 'pending').length;
  const activeInvestmentsCount = db.investments.filter((i: any) => i.status === 'active').length;
  const openTicketsCount = db.supportTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length;

  res.json({
    totalUsers,
    totalActiveUsers: Math.max(1, db.investments.length),
    totalDepositsVolume,
    totalInvestedVolume,
    totalProfitPaid,
    totalProfit: totalProfitPaid,
    totalWithdrawalsVolume,
    pendingDepositsCount,
    pendingWithdrawalsCount,
    pendingDeposits: pendingDepositsCount,
    pendingWithdrawals: pendingWithdrawalsCount,
    totalDeposited: totalDepositsVolume,
    totalInvested: totalInvestedVolume,
    activeInvestmentsCount,
    openTicketsCount,
    platformReserveBalance: Math.max(0, totalDepositsVolume - totalWithdrawalsVolume),
    recentActivity: db.transactions.slice(0, 10),
  });
});

// Admin Get All Users
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  const db = readDb();
  if (supabase) {
    const [{ data: profiles, error: profilesError }, { data: wallets, error: walletsError }, { data: investments, error: investmentsError }, { data: referrals, error: referralsError }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('wallets').select('*'),
      supabase.from('investments').select('*'),
      supabase.from('referrals').select('*'),
    ]);

    if (!profilesError && !walletsError && !investmentsError && !referralsError && profiles) {
      const profilesById = new Map(profiles.map((profile: any) => [profile.id, profile]));
      return res.json(profiles.map((profile: any) => {
        const kycImages = getKycImages(profile);
        const userWallet = wallets?.find((wallet: any) => wallet.user_id === profile.id);
        const userInvestments = investments?.filter((investment: any) => investment.user_id === profile.id) || [];
        const userReferrals = referrals?.filter((referral: any) => referral.referrer_id === profile.id) || [];
        const referrer = profile.referred_by && (profilesById.get(profile.referred_by) as any);
        return {
          id: profile.id,
          role: profile.role,
          email: profile.email,
          phone: profile.phone,
          avatar: profile.avatar,
          fullName: profile.full_name,
          referredBy: profile.referred_by,
          referralCode: profile.referral_code,
          kycStatus: profile.kyc_status,
          kycDocumentType: profile.kyc_document_type,
          kycDocumentNumber: profile.kyc_document_number,
          kycDocumentImageFront: kycImages.front,
          kycDocumentImageBack: kycImages.back,
          twoFactorEnabled: profile.two_factor_enabled,
          isBlocked: profile.is_blocked,
          emailVerified: profile.email_verified,
          createdAt: profile.created_at,
          wallet: userWallet ? {
            userId: userWallet.user_id,
            availableBalance: Number(userWallet.available_balance),
            investedBalance: Number(userWallet.invested_balance),
            totalEarnings: Number(userWallet.total_earnings),
            referralEarnings: Number(userWallet.referral_earnings),
            totalDeposited: Number(userWallet.total_deposited),
            totalWithdrawn: Number(userWallet.total_withdrawn),
            pendingWithdrawals: Number(userWallet.pending_withdrawals),
            pendingDeposits: Number(userWallet.pending_deposits),
            updatedAt: userWallet.updated_at,
          } : undefined,
          investmentsCount: userInvestments.length,
          investments: userInvestments.map((investment: any) => ({
            id: investment.id,
            planName: investment.plan_name,
            amount: Number(investment.amount),
            expectedReturn: Number(investment.expected_return),
            profitEarnedSoFar: Number(investment.profit_earned_so_far || 0),
            status: investment.status,
          })),
          referrer: referrer?.email || profile.referred_by || null,
          referralEarnings: Number(userWallet?.referral_earnings || 0),
          referralsGiven: userReferrals.map((referral: any) => ({
            id: referral.id,
            referredUserName: (profilesById.get(referral.referred_user_id) as any)?.full_name || referral.referred_user_id,
            referredUserEmail: (profilesById.get(referral.referred_user_id) as any)?.email || '',
            totalInvestedByReferred: Number(referral.total_invested_by_referred),
            bonusEarned: Number(referral.bonus_earned),
            status: referral.status,
            createdAt: referral.created_at,
            referrerName: profile.full_name,
            referrerEmail: profile.email,
          })),
        };
      }));
    }
  }

  const safeUsers = db.users.map((u: any) => {
    const { passwordHash, ...safe } = u;
    const wallet = db.wallets.find((w: any) => w.userId === u.id);
    const userInvestments = db.investments.filter((i: any) => i.userId === u.id);
    return {
      ...safe,
      wallet,
      investmentsCount: userInvestments.length,
      investments: userInvestments.map((investment: any) => ({
        id: investment.id,
        planName: investment.planName,
        amount: investment.amount,
        expectedReturn: investment.expectedReturn,
        profitEarnedSoFar: investment.profitEarnedSoFar || 0,
        status: investment.status,
      })),
      referrer: safe.referredBy
        ? db.users.find((referrer: any) => referrer.id === safe.referredBy || referrer.referralCode === safe.referredBy)?.email || safe.referredBy
        : null,
      referralEarnings: userReferralsForAdmin(db, u.id),
      referralsGiven: db.referrals
        .filter((referral: any) => referral.referrerId === u.id)
        .map((referral: any) => ({
          ...referral,
          referrerName: u.fullName,
          referrerEmail: u.email,
        })),
    };
  });

  res.json(safeUsers);
});

app.get('/api/admin/referrals', adminMiddleware, async (_req, res) => {
  const db = readDb();
  if (supabase) {
    const [{ data: profiles }, { data: referrals }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email'),
      supabase.from('referrals').select('*').order('created_at', { ascending: false }),
    ]);
    const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
    return res.json((referrals || []).map((referral: any) => {
      const referrer = profileById.get(referral.referrer_id) as any;
      const referred = profileById.get(referral.referred_user_id) as any;
      return {
        id: referral.id,
        referrerName: referrer?.full_name || referral.referrer_id,
        referrerEmail: referrer?.email || '',
        referredUserName: referred?.full_name || referral.referred_user_id,
        referredUserEmail: referred?.email || '',
        referralCode: referral.referral_code,
        referrerReward: Number(referral.referrer_reward),
        referredReward: Number(referral.referred_reward),
        status: referral.status,
        createdAt: referral.created_at,
        rewardedAt: referral.rewarded_at || undefined,
      };
    }));
  }
  res.json(db.referrals.map((referral: any) => {
    const referrer = db.users.find((candidate: any) => candidate.id === referral.referrerId);
    const referred = db.users.find((candidate: any) => candidate.id === referral.referredUserId);
    return {
      id: referral.id,
      referrerName: referrer?.fullName || referral.referrerId,
      referrerEmail: referrer?.email || '',
      referredUserName: referred?.fullName || referral.referredUserName || referral.referredUserId,
      referredUserEmail: referred?.email || referral.referredUserEmail || '',
      referralCode: referrer?.referralCode || referral.referralCode || '',
      referrerReward: Number(referral.referrerReward || referral.bonusEarned || 100),
      referredReward: Number(referral.referredReward || 50),
      status: referral.status === 'active' ? 'successful' : referral.status,
      createdAt: referral.createdAt,
      rewardedAt: referral.rewardedAt,
    };
  }));
});

// Admin Adjust User Balance
app.put('/api/admin/users/:id/balance', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { action, amount, reason } = req.body; // action: 'add' | 'deduct' | 'set'
  const db = readDb();

  const adjAmount = Number(amount);
  if (isNaN(adjAmount)) {
    return res.status(400).json({ error: 'Valid amount is required.' });
  }

  if (!['add', 'deduct', 'set'].includes(action)) {
    return res.status(400).json({ error: 'Invalid balance action.' });
  }

  if (supabase) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', id).maybeSingle();
    if (profile) {
      const { data: currentWallet, error: walletError } = await supabase.from('wallets').select('*').eq('user_id', id).maybeSingle();
      if (walletError) return res.status(500).json({ error: walletError.message });
      const previousBalance = Number(currentWallet?.available_balance || 0);
      const availableBalance = action === 'add'
        ? previousBalance + adjAmount
        : action === 'deduct'
          ? Math.max(0, previousBalance - adjAmount)
          : adjAmount;
      const now = new Date().toISOString();
      const { data: updatedWallet, error: updateError } = await supabase.from('wallets').upsert({
        user_id: id,
        available_balance: availableBalance,
        invested_balance: Number(currentWallet?.invested_balance || 0),
        total_earnings: Number(currentWallet?.total_earnings || 0),
        referral_earnings: Number(currentWallet?.referral_earnings || 0),
        total_deposited: Number(currentWallet?.total_deposited || 0),
        total_withdrawn: Number(currentWallet?.total_withdrawn || 0),
        pending_withdrawals: Number(currentWallet?.pending_withdrawals || 0),
        pending_deposits: Number(currentWallet?.pending_deposits || 0),
        updated_at: now,
      }, { onConflict: 'user_id' }).select('*').single();
      if (updateError) return res.status(500).json({ error: updateError.message });

      const difference = availableBalance - previousBalance;
      const cachedWallet = db.wallets.find((candidate: any) => candidate.userId === id);
      if (cachedWallet) {
        cachedWallet.availableBalance = availableBalance;
        cachedWallet.updatedAt = now;
      }
      await supabase.from('transactions').insert({
        id: `tx_${crypto.randomBytes(6).toString('hex')}`,
        user_id: id,
        type: 'admin_adjustment',
        direction: difference >= 0 ? 'in' : 'out',
        amount: Math.abs(difference),
        reference: 'ADMIN-ADJ',
        description: `Admin manual balance adjustment: ${reason || 'Administrative credit/debit'}`,
        status: 'completed',
        created_at: now,
      });
      await supabase.from('notifications').insert({
        id: `notif_${crypto.randomBytes(6).toString('hex')}`,
        user_id: id,
        title: 'Account Balance Adjustment',
        message: `Your available balance has been updated by administrator. New balance: NPR ${availableBalance.toLocaleString('en-IN')}.`,
        type: 'system',
        read: false,
        created_at: now,
      });
      return res.json({ message: 'User balance updated successfully', wallet: mapSupabaseWallet(updatedWallet, id) });
    }
  }

  const user = db.users.find((u: any) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  let wallet = db.wallets.find((w: any) => w.userId === id);
  if (!wallet) {
    wallet = {
      userId: id,
      availableBalance: 0,
      investedBalance: 0,
      totalEarnings: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      pendingWithdrawals: 0,
      pendingDeposits: 0,
      updatedAt: new Date().toISOString(),
    };
    db.wallets.push(wallet);
  }

  const prevBalance = wallet.availableBalance;
  if (action === 'add') {
    wallet.availableBalance += adjAmount;
  } else if (action === 'deduct') {
    wallet.availableBalance = Math.max(0, wallet.availableBalance - adjAmount);
  } else if (action === 'set') {
    wallet.availableBalance = adjAmount;
  }

  wallet.updatedAt = new Date().toISOString();

  // Create transaction log
  const diff = wallet.availableBalance - prevBalance;
  db.transactions.unshift({
    id: 'tx_' + crypto.randomBytes(6).toString('hex'),
    userId: id,
    type: 'admin_adjustment',
    direction: diff >= 0 ? 'in' : 'out',
    amount: Math.abs(diff),
    reference: 'ADMIN-ADJ',
    description: `Admin manual balance adjustment: ${reason || 'Administrative credit/debit'}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  // Notify user
  db.notifications.unshift({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: id,
    title: 'Account Balance Adjustment',
    message: `Your available balance has been updated by administrator. New balance: NPR ${wallet.availableBalance.toLocaleString('en-IN')}.`,
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  res.json({ message: 'User balance updated successfully', wallet });
});

// Admin Approve/Reject KYC
app.put('/api/admin/users/:id/kyc', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body; // 'verified' | 'rejected'

  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'KYC status must be verified or rejected.' });
  }

  if (supabase) {
    const { data: profile, error: profileLookupError } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (profileLookupError) return res.status(500).json({ error: profileLookupError.message });
    if (!profile) return res.status(404).json({ error: 'User not found.' });
    const { error: updateError } = await supabase.from('profiles').update({ kyc_status: status }).eq('id', id);
    if (updateError) return res.status(500).json({ error: updateError.message });
    await supabase.from('notifications').insert({
      id: `notif_${crypto.randomBytes(6).toString('hex')}`,
      user_id: id,
      title: status === 'verified' ? 'KYC Verified Successfully!' : 'KYC Verification Rejected',
      message: status === 'verified' ? 'Your identity documents have been approved. Full platform features and limits are unlocked.' : `Your identity verification was rejected. Reason: ${note || 'Document unreadable or invalid'}. Please resubmit.`,
      type: 'security',
      read: false,
    });
    return res.json({ message: `User KYC ${status}`, user: { ...profile, kyc_status: status } });
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.kycStatus = status;

  db.notifications.unshift({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: id,
    title: status === 'verified' ? 'KYC Verified Successfully! 🛡️' : 'KYC Verification Rejected',
    message:
      status === 'verified'
        ? 'Your identity documents have been approved. Full platform features and limits are unlocked.'
        : `Your identity verification was rejected. Reason: ${note || 'Document unreadable or invalid'}. Please resubmit.`,
    type: 'security',
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  res.json({ message: `User KYC ${status}`, user });
});

// Admin Get All Deposits
app.get('/api/admin/deposits', adminMiddleware, (req, res) => {
  const db = readDb();
  res.json(db.deposits);
});

// Admin Approve Deposit
app.post('/api/admin/deposits/:id/approve', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  const db = readDb();
  const deposit = db.deposits.find((d: any) => d.id === id);
  if (!deposit) return res.status(404).json({ error: 'Deposit request not found.' });

  if (deposit.status === 'approved') {
    return res.status(400).json({ error: 'Deposit has already been approved.' });
  }

  deposit.status = 'approved';
  deposit.adminNote = note || 'Verified & approved by admin';
  deposit.verifiedAt = new Date().toISOString();

  // Credit user wallet
  let wallet = db.wallets.find((w: any) => w.userId === deposit.userId);
  if (wallet) {
    wallet.availableBalance += deposit.amount;
    wallet.totalDeposited = (wallet.totalDeposited || 0) + deposit.amount;
    wallet.pendingDeposits = Math.max(0, (wallet.pendingDeposits || 0) - deposit.amount);
    wallet.updatedAt = new Date().toISOString();
  }

  // Update corresponding transaction to completed
  const tx = db.transactions.find((t: any) => t.userId === deposit.userId && t.reference === deposit.paymentReference);
  if (tx) {
    tx.status = 'completed';
    tx.description = `Deposit via ${deposit.paymentMethod.replace('_', ' ').toUpperCase()} (Approved)`;
  } else {
    db.transactions.unshift({
      id: 'tx_' + crypto.randomBytes(6).toString('hex'),
      userId: deposit.userId,
      type: 'deposit',
      direction: 'in',
      amount: deposit.amount,
      reference: deposit.paymentReference,
      description: `Deposit via ${deposit.paymentMethod.replace('_', ' ').toUpperCase()} (Approved)`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
  }

  // Notify User
  db.notifications.unshift({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: deposit.userId,
    title: 'Deposit Approved! 💰',
    message: `Your deposit of NPR ${deposit.amount.toLocaleString('en-IN')} has been verified and added to your available balance.`,
    type: 'deposit',
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  await notifyUser(
    deposit.userId,
    'Deposit Approved',
    `Your deposit of NPR ${deposit.amount.toLocaleString('en-IN')} has been verified and added to your available balance.`,
    'deposit',
    deposit.userEmail,
  );
  res.json({ message: 'Deposit approved and wallet credited successfully.', deposit, wallet });
});

// Admin Reject Deposit
app.post('/api/admin/deposits/:id/reject', adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const db = readDb();
  const deposit = db.deposits.find((d: any) => d.id === id);
  if (!deposit) return res.status(404).json({ error: 'Deposit request not found.' });

  deposit.status = 'rejected';
  deposit.adminNote = reason || 'Payment reference could not be verified.';

  const wallet = db.wallets.find((w: any) => w.userId === deposit.userId);
  if (wallet) {
    wallet.pendingDeposits = Math.max(0, (wallet.pendingDeposits || 0) - deposit.amount);
    wallet.updatedAt = new Date().toISOString();
  }

  const tx = db.transactions.find((t: any) => t.userId === deposit.userId && t.reference === deposit.paymentReference);
  if (tx) {
    tx.status = 'rejected';
  }

  db.notifications.unshift({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: deposit.userId,
    title: 'Deposit Rejected',
    message: `Your deposit request of NPR ${deposit.amount.toLocaleString('en-IN')} was rejected. Reason: ${reason || 'Invalid reference or proof'}.`,
    type: 'deposit',
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  res.json({ message: 'Deposit rejected.', deposit });
});

// Admin Get All Withdrawals
app.get('/api/admin/withdrawals', adminMiddleware, (req, res) => {
  const db = readDb();
  res.json(db.withdrawals);
});

// Admin Approve Withdrawal (Payout)
app.post('/api/admin/withdrawals/:id/approve', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  const db = readDb();
  const withdrawal = db.withdrawals.find((w: any) => w.id === id);
  if (!withdrawal) return res.status(404).json({ error: 'Withdrawal request not found.' });

  if (withdrawal.status === 'completed') {
    return res.status(400).json({ error: 'Withdrawal already completed.' });
  }

  withdrawal.status = 'completed';
  withdrawal.adminNote = note || 'Processed and transferred via ConnectIPS/Bank';
  withdrawal.processedAt = new Date().toISOString();

  let wallet = db.wallets.find((w: any) => w.userId === withdrawal.userId);
  if (wallet) {
    wallet.pendingWithdrawals = Math.max(0, (wallet.pendingWithdrawals || 0) - withdrawal.amount);
    wallet.totalWithdrawn = (wallet.totalWithdrawn || 0) + withdrawal.amount;
    wallet.updatedAt = new Date().toISOString();
  }

  const tx = db.transactions.find((t: any) => t.userId === withdrawal.userId && t.reference === withdrawal.id.toUpperCase());
  if (tx) {
    tx.status = 'completed';
    tx.description = `Withdrawal to ${withdrawal.method.replace('_', ' ').toUpperCase()} (Completed)`;
  }

  db.notifications.unshift({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: withdrawal.userId,
    title: 'Withdrawal Completed! ✅',
    message: `Your withdrawal of NPR ${withdrawal.amount.toLocaleString('en-IN')} has been sent to your ${withdrawal.method.replace('_', ' ')} account.`,
    type: 'withdrawal',
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  await notifyUser(
    withdrawal.userId,
    'Withdrawal Completed',
    `Your withdrawal of NPR ${withdrawal.amount.toLocaleString('en-IN')} has been sent to your ${withdrawal.method.replace('_', ' ')} account.`,
    'withdrawal',
    withdrawal.userEmail,
  );
  res.json({ message: 'Withdrawal approved and completed.', withdrawal, wallet });
});

// Admin Reject Withdrawal (Refund)
app.post('/api/admin/withdrawals/:id/reject', adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const db = readDb();
  const withdrawal = db.withdrawals.find((w: any) => w.id === id);
  if (!withdrawal) return res.status(404).json({ error: 'Withdrawal request not found.' });

  if (withdrawal.status === 'rejected') {
    return res.status(400).json({ error: 'Withdrawal is already rejected.' });
  }

  withdrawal.status = 'rejected';
  withdrawal.adminNote = reason || 'Account details invalid.';

  // Refund back to available balance
  let wallet = db.wallets.find((w: any) => w.userId === withdrawal.userId);
  if (wallet) {
    wallet.availableBalance += withdrawal.amount;
    wallet.pendingWithdrawals = Math.max(0, (wallet.pendingWithdrawals || 0) - withdrawal.amount);
    wallet.updatedAt = new Date().toISOString();
  }

  const tx = db.transactions.find((t: any) => t.userId === withdrawal.userId && t.reference === withdrawal.id.toUpperCase());
  if (tx) {
    tx.status = 'rejected';
    tx.description = `Withdrawal request rejected and refunded: ${reason || 'Details mismatched'}`;
  }

  db.notifications.unshift({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: withdrawal.userId,
    title: 'Withdrawal Rejected & Refunded',
    message: `Your withdrawal request of NPR ${withdrawal.amount.toLocaleString('en-IN')} was rejected. Amount has been refunded to your available balance. Reason: ${reason || 'Invalid account details'}.`,
    type: 'withdrawal',
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  res.json({ message: 'Withdrawal rejected and refunded to user.', withdrawal, wallet });
});

// Admin Get All Investments
app.get('/api/admin/investments', adminMiddleware, (req, res) => {
  const db = readDb();
  res.json(db.investments.map((investment: any) => {
    const owner = db.users.find((candidate: any) => candidate.id === investment.userId);
    return {
      ...investment,
      userFullName: owner?.fullName || 'Unknown user',
      userEmail: owner?.email || '',
      totalEarned: investment.profitEarnedSoFar || 0,
      dailyYield: investment.dailyReturnAmount || 0,
    };
  }));
});

// Admin Trigger Payout for an Investment (Daily Yield)
app.post('/api/admin/investments/:id/payout', adminMiddleware, (req, res) => {
  const { id } = req.params;

  const db = readDb();
  const investment = db.investments.find((i: any) => i.id === id);
  if (!investment) return res.status(404).json({ error: 'Investment not found.' });

  if (investment.status !== 'active') {
    return res.status(400).json({ error: 'Investment is not active.' });
  }

  if (new Date(investment.endDate).getTime() > Date.now()) {
    return res.status(400).json({ error: `This package pays after its ${investment.durationDays}-day term ends.` });
  }

  const expectedProfit = Math.max(0, (investment.expectedReturn || investment.amount) - investment.amount);
  const remainingProfit = Math.max(0, expectedProfit - (investment.profitEarnedSoFar || 0));
  if (remainingProfit <= 0) {
    return res.status(400).json({ error: 'The investment has no remaining profit to pay out.' });
  }
  const dailyPayout = Math.min(
    investment.dailyReturnAmount || Number((expectedProfit / investment.durationDays).toFixed(2)),
    remainingProfit
  );

  investment.profitEarnedSoFar = (investment.profitEarnedSoFar || 0) + dailyPayout;
  investment.lastPayoutAt = new Date().toISOString();
  investment.nextPayoutDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Credit user wallet
  const wallet = db.wallets.find((w: any) => w.userId === investment.userId);
  if (wallet) {
    wallet.availableBalance += dailyPayout;
    wallet.totalEarnings = (wallet.totalEarnings || 0) + dailyPayout;
    wallet.updatedAt = new Date().toISOString();
  }

  // Log transaction
  db.transactions.unshift({
    id: 'tx_' + crypto.randomBytes(6).toString('hex'),
    userId: investment.userId,
    type: 'profit',
    direction: 'in',
    amount: dailyPayout,
    reference: `PAYOUT-${investment.id.toUpperCase()}`,
    description: `Daily Yield Payout from ${investment.planName}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  // Notify user
  db.notifications.unshift({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: investment.userId,
    title: 'Daily Profit Credited! 💵',
    message: `NPR ${dailyPayout.toLocaleString('en-IN')} daily yield from ${investment.planName} has been credited to your available balance.`,
    type: 'investment',
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  res.json({ message: 'Daily payout executed successfully.', investment, wallet });
});

// Admin Complete Investment (Return Principal)
app.post('/api/admin/investments/:id/complete', adminMiddleware, (req, res) => {
  const { id } = req.params;

  const db = readDb();
  const investment = db.investments.find((i: any) => i.id === id);
  if (!investment) return res.status(404).json({ error: 'Investment not found.' });

  if (investment.status !== 'active') {
    return res.status(400).json({ error: 'Investment has already been completed.' });
  }

  if (new Date(investment.endDate).getTime() > Date.now()) {
    return res.status(400).json({ error: 'Investment has not reached its maturity date yet.' });
  }

  investment.status = 'completed';
  investment.progressPercentage = 100;
  investment.daysRemaining = 0;

  // Return principal back to available balance
  const wallet = db.wallets.find((w: any) => w.userId === investment.userId);
  const expectedProfit = Math.max(0, (investment.expectedReturn || investment.amount) - investment.amount);
  const remainingProfit = Math.max(0, expectedProfit - (investment.profitEarnedSoFar || 0));
  if (wallet) {
    wallet.investedBalance = Math.max(0, wallet.investedBalance - investment.amount);
    wallet.availableBalance += investment.amount + remainingProfit;
    wallet.totalEarnings = (wallet.totalEarnings || 0) + remainingProfit;
    wallet.updatedAt = new Date().toISOString();
  }

  db.transactions.unshift({
    id: 'tx_' + crypto.randomBytes(6).toString('hex'),
    userId: investment.userId,
    type: 'investment',
    direction: 'in',
    amount: investment.amount + remainingProfit,
    reference: `MATURITY-${investment.id.toUpperCase()}`,
    description: `Maturity return including remaining interest: ${investment.planName}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  db.notifications.unshift({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: investment.userId,
    title: 'Investment Matured! 🏆',
    message: `Your ${investment.planName} investment matured. NPR ${(investment.amount + remainingProfit).toLocaleString('en-IN')} including remaining interest has been returned to your available balance.`,
    type: 'investment',
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  res.json({ message: 'Investment matured and principal plus remaining interest returned.', investment, wallet });
});

// Admin Investment Plans Management
app.get('/api/admin/plans', adminMiddleware, (req, res) => {
  const db = readDb();
  res.json(db.plans || INITIAL_PLANS);
});

app.post('/api/admin/plans', adminMiddleware, (req, res) => {
  const { name, minimumAmount, maximumAmount, returnRate, durationDays, payoutFrequency, badge, description, isPopular } = req.body;

  if (!name || !minimumAmount || !returnRate || !durationDays) {
    return res.status(400).json({ error: 'Name, minimum amount, return rate, and duration are required.' });
  }

  const db = readDb();
  if (!db.plans) db.plans = INITIAL_PLANS;

  const newPlan = {
    id: 'plan_' + crypto.randomBytes(4).toString('hex'),
    name: name.trim(),
    minimumAmount: Number(minimumAmount),
    maximumAmount: maximumAmount ? Number(maximumAmount) : undefined,
    returnRate: Number(returnRate),
    durationDays: Number(durationDays),
    payoutFrequency: payoutFrequency || 'daily',
    status: 'active',
    badge: badge?.trim() || undefined,
    description: description?.trim() || 'High performance wealth accumulation tier.',
    isPopular: !!isPopular,
    totalInvestors: 0,
    totalInvestedNPR: 0,
  };

  db.plans.push(newPlan);
  writeDb(db);

  res.status(201).json({ message: 'Plan created successfully.', plan: newPlan });
});

app.put('/api/admin/plans/:id', adminMiddleware, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const db = readDb();
  if (!db.plans) db.plans = INITIAL_PLANS;

  const planIndex = db.plans.findIndex((p: any) => p.id === id);
  if (planIndex === -1) return res.status(404).json({ error: 'Plan not found.' });

  db.plans[planIndex] = {
    ...db.plans[planIndex],
    ...updates,
  };

  writeDb(db);
  res.json({ message: 'Plan updated successfully.', plan: db.plans[planIndex] });
});

// Admin Support Tickets
app.get('/api/admin/tickets', adminMiddleware, async (req, res) => {
  const db = readDb();
  if (supabase) {
    const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json((data || []).map(mapSupabaseTicket));
  }
  res.json(db.supportTickets);
});

app.post('/api/admin/tickets/:id/reply', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { message, status } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required.' });
  if (supabase) {
    const { data: ticket, error: lookupError } = await supabase.from('support_tickets').select('*').eq('id', id).maybeSingle();
    if (lookupError) return res.status(500).json({ error: lookupError.message });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    const reply = { id: `rep_${crypto.randomBytes(6).toString('hex')}`, senderRole: 'admin', senderName: 'CapitalNest Support Agent', message: message.trim(), createdAt: new Date().toISOString() };
    const { data: updated, error } = await supabase.from('support_tickets').update({ replies: [...(ticket.replies || []), reply], status: status || ticket.status, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    await supabase.from('notifications').insert({ id: `notif_${crypto.randomBytes(6).toString('hex')}`, user_id: ticket.user_id, title: 'Support Ticket Reply', message: `Support replied to your ticket "${ticket.subject}".`, type: 'system', read: false });
    return res.json({ message: 'Ticket updated and reply sent.', ticket: mapSupabaseTicket(updated) });
  }

  const db = readDb();
  const ticket = db.supportTickets.find((t: any) => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

  const reply = {
    id: 'rep_' + crypto.randomBytes(6).toString('hex'),
    senderRole: 'admin',
    senderName: 'CapitalNest Support Agent',
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  ticket.replies.push(reply);
  if (status) ticket.status = status;
  ticket.updatedAt = new Date().toISOString();

  // Notify user
  db.notifications.unshift({
    id: 'notif_' + crypto.randomBytes(6).toString('hex'),
    userId: ticket.userId,
    title: 'Support Ticket Reply',
    message: `Support replied to your ticket "${ticket.subject}": ${message.slice(0, 70)}...`,
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  res.json({ message: 'Ticket updated and reply sent.', ticket });
});

// Admin Broadcast Notification
app.post('/api/admin/broadcast-notification', adminMiddleware, async (req, res) => {
  const { title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }

  if (supabase) {
    const recipientCount = await sendBulkAnnouncement(title.trim(), message.trim());
    return res.json({ message: `Announcement sent to ${recipientCount} users.` });
  }

  const db = readDb();
  const allUsers = db.users;

  allUsers.forEach((user: any) => {
    db.notifications.unshift({
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId: user.id,
      title: title.trim(),
      message: message.trim(),
      type: type || 'system',
      read: false,
      createdAt: new Date().toISOString(),
    });
  });

  writeDb(db);
  res.json({ message: `Broadcast sent to ${allUsers.length} users.` });
});

// Start server with Vite middleware integration
async function startServer() {
  await hydrateDbFromSupabase();
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CapitalNest Nepal server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
} else {
  dbReady = hydrateDbFromSupabase();
}
