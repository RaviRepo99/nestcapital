import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../services/api';
import { InvestmentPlan, User, Wallet } from '../types';
import { supabase } from '../lib/supabase';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  unreadNotifications: number;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  currentRoute: string;
  navigate: (route: string, state?: any) => void;
  login: (email: string, password: string) => Promise<void>;
  loginAsAdmin: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; email: string; phone: string; password: string; referralCode?: string; deviceId?: string }) => Promise<void>;
  completeEmailVerification: (accessToken: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  updateUserWallet: (wallet: Wallet) => void;
  activeModal: 'deposit' | 'withdraw' | 'invest' | 'kyc' | 'chat' | null;
  setActiveModal: (modal: 'deposit' | 'withdraw' | 'invest' | 'kyc' | 'chat' | null) => void;
  selectedPlan: InvestmentPlan | null;
  setSelectedPlan: (plan: InvestmentPlan | null) => void;
  openInvestModal: (plan: InvestmentPlan) => void;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  loginAsDemo: (role: 'investor' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function routeFromPath(pathname: string): string {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);
  if (hashParams.get('type') === 'recovery' || hashParams.has('error') || hashParams.has('access_token') || queryParams.get('type') === 'recovery' || queryParams.has('code')) {
    return 'reset-password';
  }
  const route = pathname.replace(/^\/+|\/+$/g, '');
  if (!route && new URLSearchParams(window.location.search).has('ref')) return 'register';
  return route || 'login';
}

function pathFromRoute(route: string): string {
  return route === 'home' ? '/login' : `/${route}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState<string>(() =>
    window.location.pathname === '/admin' ? 'admin-login' : routeFromPath(window.location.pathname)
  );
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | 'invest' | 'kyc' | 'chat' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshUserData = async () => {
    try {
      if (!getStoredToken()) {
        setUser(null);
        setWallet(null);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      setWallet(data.wallet);
      setUnreadNotifications(data.unreadNotifications || 0);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      if ((err as Error & { status?: number }).status === 401) {
        api.logout();
        setUser(null);
        setWallet(null);
        navigate(window.location.pathname === '/admin' ? 'admin-login' : 'login');
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => setCurrentRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);

    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
          setWallet(data.wallet);
          setUnreadNotifications(data.unreadNotifications || 0);
          setCurrentRoute(window.location.pathname === '/admin' ? data.user.role === 'admin' ? 'admin' : 'admin-login' : 'dashboard');
        } catch {
          api.logout();
          setCurrentRoute(window.location.pathname === '/admin' ? 'admin-login' : 'login');
        }
      }
      setIsLoading(false);
    };

    initAuth();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`wallet-updates-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, () => {
        void refreshUserData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
        void refreshUserData();
      })
      .subscribe();

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshUserData();
    };
    const intervalId = window.setInterval(refreshWhenVisible, 1000);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [user]);

  const navigate = (route: string) => {
    setCurrentRoute(route);
    const nextPath = pathFromRoute(route);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') navigate('reset-password');
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setUser(res.user);
    setWallet(res.wallet);
    showToast(`Welcome back, ${res.user.fullName}!`, 'success');
    navigate('dashboard');
  };

  const loginAsAdmin = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.user.role !== 'admin') {
      api.logout();
      throw new Error('Administrator account required.');
    }
    setUser(res.user);
    setWallet(res.wallet);
    showToast(`Welcome, ${res.user.fullName}!`, 'success');
    navigate('admin');
  };

  const register = async (data: { fullName: string; email: string; phone: string; password: string; referralCode?: string; deviceId?: string }) => {
    const res = await api.register(data);
    if (res.emailVerificationRequired) {
      const { error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            referral_code: data.referralCode?.trim().toUpperCase() || null,
                      device_id: data.deviceId || null,
          },
        },
      });
      if (error) {
        await api.cancelRegistration(data.email);
        throw new Error(`Could not send verification code: ${error.message}`);
      }
      showToast('Registration successful. Check your email for the verification code.', 'info');
      navigate('email-verification');
      return;
    }
    setUser(res.user);
    setWallet(res.wallet);
    showToast('Account created successfully! Welcome to CapitalNest Nepal.', 'success');
    navigate('dashboard');
  };

  const completeEmailVerification = async (accessToken: string) => {
    const res = await api.completeSupabaseSession(accessToken);
    setUser(res.user);
    setWallet(res.wallet);
    showToast('Email verified successfully. Welcome to CapitalNest Nepal.', 'success');
    if (res.referralRewarded) {
      showToast('Welcome Bonus: You received NPR 50 referral bonus.', 'success');
    }
    navigate('dashboard');
  };

  const logout = () => {
    void supabase.auth.signOut();
    api.logout();
    setUser(null);
    setWallet(null);
    showToast('Logged out successfully.', 'info');
    navigate('login');
  };

  const updateUserWallet = (newWallet: Wallet) => {
    setWallet(newWallet);
  };

  const openInvestModal = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setActiveModal('invest');
  };

  const loginAsDemo = async (role: 'investor' | 'admin') => {
    if (role === 'investor') {
      setStoredToken('demo-token-investor');
    } else {
      setStoredToken('demo-token-admin');
    }
    await refreshUserData();
    showToast(`Switched to demo ${role} mode.`, 'success');
    if (role === 'admin') {
      navigate('admin');
    } else {
      navigate('dashboard');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        unreadNotifications,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        currentRoute,
        navigate,
        login,
        loginAsAdmin,
        register,
        completeEmailVerification,
        logout,
        refreshUserData,
        updateUserWallet,
        activeModal,
        setActiveModal,
        selectedPlan,
        setSelectedPlan,
        openInvestModal,
        toasts,
        showToast,
        removeToast,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
