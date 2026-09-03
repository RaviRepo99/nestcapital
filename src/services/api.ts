import {
  AuthResponse,
  Deposit,
  Investment,
  InvestmentPlan,
  NotificationItem,
  PaymentSetting,
  ReferralStats,
  SupportTicket,
  Transaction,
  User,
  Wallet,
  Withdrawal,
  AdminAnalytics,
  AdminReferralRecord,
} from '../types';

const TOKEN_KEY = 'capitalnest_auth_token';
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const DEVICE_ID_KEY = 'capitalnest_registration_device_id';

function getRegistrationDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch {
    return 'device-' + Math.random().toString(36).slice(2);
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function removeStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers.Authorization) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const responseText = await response.text();
  let data: any = {};
  if (responseText.trim()) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: responseText.trim() };
    }
  }

  if (!response.ok) {
    const error = new Error(data.error || `Request failed at ${endpoint} with status ${response.status}.`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  async register(data: { fullName: string; email: string; phone: string; password: string; referralCode?: string }): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, registrationDeviceId: getRegistrationDeviceId() }),
    });
    if (!res.emailVerificationRequired) setStoredToken(res.token);
    return res;
  },

  async cancelRegistration(email: string): Promise<void> {
    await request('/api/auth/register/cancel', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async completeSupabaseSession(accessToken: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setStoredToken(res.token);
    return res;
  },

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User; wallet: Wallet; unreadNotifications: number }> {
    return request('/api/auth/me');
  },

  async updateProfile(data: { fullName?: string; phone?: string; avatar?: string }): Promise<{ user: User; message: string }> {
    return request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async submitKYC(data: { documentType: string; documentNumber: string; documentImageFront?: string; documentImageBack?: string }): Promise<{ user: User; message: string }> {
    return request('/api/auth/kyc', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout() {
    removeStoredToken();
  },

  // Plans
  async getPlans(): Promise<InvestmentPlan[]> {
    return request('/api/plans');
  },

  // Investments
  async getInvestments(): Promise<Investment[]> {
    return request('/api/investments');
  },

  async createInvestment(data: { planId: string; amount: number }): Promise<{ investment: Investment; wallet: Wallet; message: string }> {
    return request('/api/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Deposits
  async getPaymentSettings(): Promise<PaymentSetting[]> {
    return request('/api/payment-settings');
  },

  async getDeposits(): Promise<Deposit[]> {
    return request('/api/deposits');
  },

  async createDeposit(data: {
    amount: number;
    paymentMethod: string;
    paymentReference: string;
    senderName?: string;
    senderAccount?: string;
    paymentProof?: string;
    notes?: string;
  }): Promise<{ deposit: Deposit; wallet: Wallet; message: string }> {
    return request('/api/deposits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Withdrawals
  async getWithdrawals(): Promise<Withdrawal[]> {
    return request('/api/withdrawals');
  },

  async createWithdrawal(data: {
    amount: number;
    method: string;
    accountDetails: any;
  }): Promise<{ withdrawal: Withdrawal; wallet: Wallet; message: string }> {
    return request('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Wallet & Transactions
  async getWallet(): Promise<Wallet> {
    return request('/api/wallet');
  },

  async getTransactions(params?: { type?: string; status?: string; search?: string }): Promise<Transaction[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/api/transactions${query ? `?${query}` : ''}`);
  },

  // Referrals
  async getReferrals(): Promise<ReferralStats> {
    return request('/api/referrals');
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return request('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return request(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return request('/api/notifications/read-all', { method: 'POST' });
  },

  // Support
  async getSupportTickets(): Promise<SupportTicket[]> {
    return request('/api/support/tickets');
  },

  async createSupportTicket(data: {
    subject: string;
    category: string;
    message: string;
    attachment?: string;
  }): Promise<{ ticket: SupportTicket; message: string }> {
    return request('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async replySupportTicket(ticketId: string, message: string): Promise<{ ticket: SupportTicket; message: string }> {
    return request(`/api/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // ADMIN
  admin: {
    async getAnalytics(): Promise<AdminAnalytics> {
      return request('/api/admin/analytics');
    },

    async updatePaymentSettings(settings: PaymentSetting[]): Promise<{ settings: PaymentSetting[]; message: string }> {
      return request('/api/admin/payment-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },

    async getUsers(): Promise<(User & { wallet: Wallet; investmentsCount: number; referrer?: string | null; referralEarnings?: number; investments?: Partial<Investment>[] })[]> {
      return request('/api/admin/users');
    },

    async getReferrals(): Promise<AdminReferralRecord[]> {
      return request('/api/admin/referrals');
    },

    async adjustUserBalance(userId: string, data: { action: 'add' | 'deduct' | 'set'; amount: number; reason?: string }): Promise<{ wallet: Wallet; message: string }> {
      return request(`/api/admin/users/${userId}/balance`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async updateUserKYC(userId: string, status: 'verified' | 'rejected', note?: string): Promise<{ user: User; message: string }> {
      return request(`/api/admin/users/${userId}/kyc`, {
        method: 'PUT',
        body: JSON.stringify({ status, note }),
      });
    },

    async updateUserCredentials(userId: string, data: { email?: string; password?: string; currentEmail?: string }): Promise<{ user: User; message: string }> {
      return request(`/api/admin/users/${userId}/credentials`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async createAdmin(data: { fullName: string; email: string; password: string }): Promise<{ user: User; message: string }> {
      return request('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getDeposits(): Promise<Deposit[]> {
      return request('/api/admin/deposits');
    },

    async approveDeposit(depositId: string, note?: string): Promise<{ deposit: Deposit; wallet: Wallet; message: string }> {
      return request(`/api/admin/deposits/${depositId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
    },

    async rejectDeposit(depositId: string, reason?: string): Promise<{ deposit: Deposit; message: string }> {
      return request(`/api/admin/deposits/${depositId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    async getWithdrawals(): Promise<Withdrawal[]> {
      return request('/api/admin/withdrawals');
    },

    async approveWithdrawal(withdrawalId: string, note?: string): Promise<{ withdrawal: Withdrawal; wallet: Wallet; message: string }> {
      return request(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
    },

    async rejectWithdrawal(withdrawalId: string, reason?: string): Promise<{ withdrawal: Withdrawal; wallet: Wallet; message: string }> {
      return request(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    async getInvestments(): Promise<Investment[]> {
      return request('/api/admin/investments');
    },

    async triggerInvestmentPayout(investmentId: string): Promise<{ investment: Investment; wallet: Wallet; message: string }> {
      return request(`/api/admin/investments/${investmentId}/payout`, {
        method: 'POST',
      });
    },

    async completeInvestment(investmentId: string): Promise<{ investment: Investment; wallet: Wallet; message: string }> {
      return request(`/api/admin/investments/${investmentId}/complete`, {
        method: 'POST',
      });
    },

    async getPlans(): Promise<InvestmentPlan[]> {
      return request('/api/admin/plans');
    },

    async createPlan(planData: Partial<InvestmentPlan>): Promise<{ plan: InvestmentPlan; message: string }> {
      return request('/api/admin/plans', {
        method: 'POST',
        body: JSON.stringify(planData),
      });
    },

    async updatePlan(id: string, updates: Partial<InvestmentPlan>): Promise<{ plan: InvestmentPlan; message: string }> {
      return request(`/api/admin/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    async getTickets(): Promise<SupportTicket[]> {
      return request('/api/admin/tickets');
    },

    async replyTicket(ticketId: string, message: string, status?: string): Promise<{ ticket: SupportTicket; message: string }> {
      return request(`/api/admin/tickets/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message, status }),
      });
    },

    async broadcastNotification(data: { title: string; message: string; type?: string }): Promise<{ message: string }> {
      return request('/api/admin/broadcast-notification', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};
